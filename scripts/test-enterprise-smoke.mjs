import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('C:/Users/86166/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const consoleErrors = []
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
page.on('pageerror', (error) => consoleErrors.push(error.message))
await page.goto('http://127.0.0.1:3082', { waitUntil: 'domcontentloaded' })
await page.locator('[data-kaiwu-plaza-entry]').waitFor({ timeout: 30000 })
await page.locator('[data-kaiwu-plaza-entry]').click()
await page.getByRole('button', { name: '企业管理', exact: true }).click()
await page.locator('[data-enterprise-console]').waitFor()
await page.waitForTimeout(3500)
const nav = await page.locator('[data-enterprise-nav]').allTextContents()
const metrics = await page.locator('.kwp-enterpriseCard').allTextContents()
for (const id of ['terminals', 'workers', 'library', 'batch', 'audit', 'overview']) {
  await page.locator(`[data-enterprise-nav="${id}"]`).click()
}
console.log(JSON.stringify({ nav, metrics, consoleErrors }, null, 2))
await browser.close()
