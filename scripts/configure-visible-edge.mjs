import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('C:/Users/86166/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const browser = await chromium.connectOverCDP('http://127.0.0.1:9223')
const context = browser.contexts()[0]
let page = context.pages().find((item) => item.url().startsWith('http://127.0.0.1:3182'))
if (!page) page = await context.newPage()
await page.goto('http://127.0.0.1:3182', { waitUntil: 'domcontentloaded' })
await page.evaluate(() => {
  localStorage.setItem('kaiwu.enterprise.hubUrl', 'http://127.0.0.1:3099')
  localStorage.setItem('kaiwu.enterprise.adminToken', 'cross-device-admin-token')
})
await page.reload({ waitUntil: 'domcontentloaded' })
await page.locator('[data-kaiwu-enterprise-entry]').waitFor({ timeout: 30000 })
await page.locator('[data-kaiwu-enterprise-entry]').click()
await page.locator('[data-enterprise-console]').waitFor({ timeout: 15000 })
await page.waitForFunction(() => {
  const cards = [...document.querySelectorAll('.kep-card')]
  return cards.some((card) => card.textContent.includes('2') && card.textContent.includes('在线终端'))
}, null, { timeout: 15000 })
const metrics = await page.locator('.kep-card').allTextContents()
await page.locator('[data-open-enterprise-guide]').click()
await page.locator('[data-enterprise-guide]').waitFor({ timeout: 10000 })
await page.bringToFront()
console.log(JSON.stringify({ ok: true, url: page.url(), metrics, guideOpen: true }))
process.exit(0)
