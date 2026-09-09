import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require('C:/Users/86166/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const out = path.resolve('测试报告/P1-管理端')
await mkdir(out, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
})
const page = await browser.newPage({ viewport: { width: 1720, height: 980 }, deviceScaleFactor: 1 })
const consoleErrors = []
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
page.on('pageerror', (err) => consoleErrors.push(err.message))

await page.goto('http://127.0.0.1:3082', { waitUntil: 'domcontentloaded' })
await page.locator('[data-kaiwu-plaza-entry]').waitFor({ timeout: 30000 })
await page.locator('[data-kaiwu-plaza-entry]').click()

const settingsButton = page.getByRole('button', { name: '员工设置', exact: true })
const toggleCluster = page.locator('[data-dsh-toggle-cluster]')
await settingsButton.waitFor()
await toggleCluster.waitFor()

const buttonBox = await settingsButton.boundingBox()
const clusterBox = await toggleCluster.boundingBox()
if (!buttonBox || !clusterBox) throw new Error('入口或侧边栏按钮组没有可见边界')
const gap = Math.round(clusterBox.x - (buttonBox.x + buttonBox.width))
if (gap < 6 || gap > 12) throw new Error(`员工设置入口位置错误：与侧边栏按钮组间距 ${gap}px`)
if (Math.abs(buttonBox.y - clusterBox.y) > 1) throw new Error('员工设置入口没有与侧边栏按钮组顶部对齐')

await page.screenshot({ path: path.join(out, '06-员工设置入口.png'), fullPage: false })
await settingsButton.click()
await page.locator('.kwp-adminProfile').waitFor({ timeout: 15000 })
const title = await page.locator('.kwp-title').textContent()
if (title !== '员工设置') throw new Error(`进入后的标题错误：${title}`)

console.log(JSON.stringify({ buttonBox, clusterBox, gap, title, consoleErrors }, null, 2))
await browser.close()
if (consoleErrors.length) process.exitCode = 1
