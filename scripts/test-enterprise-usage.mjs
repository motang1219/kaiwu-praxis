import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require('C:/Users/86166/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const out = path.resolve('测试报告/P1-企业管理端')
await mkdir(out, { recursive: true })

async function report(sessionCount, dataTrackerCount) {
  const response = await fetch('http://127.0.0.1:3099/api/usage', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ port: 3083, sessionCount, sessionsByWorker: { 'kaiwu-data-tracker': dataTrackerCount } }),
  })
  if (!response.ok) throw new Error(`usage heartbeat failed: ${response.status}`)
}

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const consoleErrors = []
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
page.on('pageerror', (error) => consoleErrors.push(error.message))

try {
  // 模拟员工端浏览器的会话快照心跳，验证中枢聚合与企业端展示链路。
  await report(3, 3)
  await page.goto('http://127.0.0.1:3082', { waitUntil: 'domcontentloaded' })
  await page.locator('[data-kaiwu-plaza-entry]').waitFor({ timeout: 30000 })
  await page.locator('[data-kaiwu-plaza-entry]').click()
  await page.getByRole('button', { name: '企业管理', exact: true }).click()
  await page.waitForTimeout(3500)
  const metrics = await page.locator('.kwp-enterpriseCard').allTextContents()
  await page.locator('[data-enterprise-nav="workers"]').click()
  const dataTracker = await page.locator('[data-worker-id="kaiwu-data-tracker"]').textContent()
  await page.screenshot({ path: path.join(out, '09-使用情况聚合.png'), fullPage: true })
  console.log(JSON.stringify({ metrics, dataTracker, consoleErrors }, null, 2))
} finally {
  await report(0, 0)
  await browser.close()
}
