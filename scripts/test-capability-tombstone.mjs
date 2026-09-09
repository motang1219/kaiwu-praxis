import { createRequire } from 'node:module'
import { access } from 'node:fs/promises'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require('C:/Users/86166/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const mode = process.argv[2] || 'inspect'
const skillFile = 'C:/Users/86166/.dsh-fresh/.agent-presets/kaiwu-data-tracker/skills/kaiwu-data-tracker/SKILL.md'
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' })
const page = await browser.newPage({ viewport: { width: 1720, height: 980 } })
await page.goto('http://127.0.0.1:3082', { waitUntil: 'domcontentloaded' })
await page.locator('[data-kaiwu-plaza-entry]').waitFor({ timeout: 30000 })
await page.locator('[data-kaiwu-plaza-entry]').click()
await page.getByRole('button', { name: '员工设置', exact: true }).click()
await page.locator('.kwp-adminWorker').filter({ hasText: '数据追踪员' }).click()
await page.locator('.kwp-adminNavItem').filter({ hasText: '能力配置' }).click()
const row = page.locator('[data-skill-id="kaiwu-data-tracker"]')
await row.waitFor()

if (mode === 'delete') await row.getByRole('button', { name: '删除', exact: true }).click()
else if (mode === 'restore') await row.getByRole('button', { name: '恢复', exact: true }).click()

await page.waitForTimeout(400)
let fileExists = true
try { await access(skillFile) } catch { fileExists = false }
const deleted = (await row.getAttribute('class')).includes('kwp-capabilityDeleted')
if (mode === 'restore' ? (!fileExists || deleted) : (fileExists || !deleted)) throw new Error(`${mode} 状态不符合预期：file=${fileExists}, deleted=${deleted}`)
if (mode !== 'restore') await page.screenshot({ path: path.resolve('测试报告/P1-管理端/10-官方技能删除标记.png'), fullPage: true })
console.log(JSON.stringify({ mode, fileExists, deleted }))
await browser.close()
