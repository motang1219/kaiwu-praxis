import { createRequire } from 'node:module'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require('C:/Users/86166/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const out = path.resolve('测试报告/P1-企业管理端')
await mkdir(out, { recursive: true })

const endpoints = [
  { port: 3083, home: 'C:/Users/86166/.dsh-enterprise-test-a', screenshot: '07-员工端A-完整插件环境.png' },
  { port: 3084, home: 'C:/Users/86166/.dsh-enterprise-test-b', screenshot: '08-员工端B-完整插件环境.png' },
]
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' })
const results = []

for (const endpoint of endpoints) {
  const pkg = JSON.parse(await readFile(path.join(endpoint.home, 'profiles/web/package.json'), 'utf8'))
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`http://127.0.0.1:${endpoint.port}`, { waitUntil: 'domcontentloaded' })
  await page.locator('[data-kaiwu-plaza-entry]').waitFor({ timeout: 30000 })
  // 全新 DSH_HOME 首次打开会展示欢迎提示；关闭后按普通用户路径点击入口。
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  const overlayButtons = page.locator('[role="presentation"] button:visible:not(:disabled)')
  const overlayButtonCount = await overlayButtons.count()
  if (overlayButtonCount) {
    const labels = await overlayButtons.allTextContents()
    const closeIndex = labels.findIndex((label) => /知道|关闭|以后|跳过|开始|确认|同意|取消/.test(label))
    await overlayButtons.nth(closeIndex >= 0 ? closeIndex : overlayButtonCount - 1).click()
    await page.waitForTimeout(300)
  }
  await page.locator('[data-kaiwu-plaza-entry]').click()
  await page.locator('.kwp-card').first().waitFor({ timeout: 15000 })
  const workerCount = await page.locator('.kwp-card').count()
  const topActions = await page.locator('.kwp-ghostBtn').allTextContents()
  const betterSidebarLoaded = await page.locator('[data-dsh-toggle-cluster]').count() > 0
  await page.screenshot({ path: path.join(out, endpoint.screenshot), fullPage: true })
  results.push({
    port: endpoint.port,
    dependencies: pkg.dependencies,
    bundles: pkg.dsh.profile.bundles,
    workerCount,
    topActions,
    betterSidebarLoaded,
    consoleErrors: errors,
  })
  await page.close()
}

console.log(JSON.stringify(results, null, 2))
await browser.close()
