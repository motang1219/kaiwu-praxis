import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require('C:/Users/86166/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const out = path.resolve('测试报告/P2-跨设备基础版第一轮')
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' })

async function dismiss(page) {
  await page.keyboard.press('Escape')
  const buttons = page.locator('[role="presentation"] button:visible:not(:disabled)')
  if (await buttons.count()) await buttons.last().click().catch(() => {})
}

try {
  const enterprise = await browser.newPage({ viewport: { width: 1720, height: 980 } })
  await enterprise.goto('http://127.0.0.1:3182', { waitUntil: 'domcontentloaded' })
  await enterprise.evaluate(() => { localStorage.setItem('kaiwu.enterprise.hubUrl', 'http://127.0.0.1:3099'); localStorage.setItem('kaiwu.enterprise.adminToken', 'cross-device-admin-token') })
  await enterprise.reload({ waitUntil: 'domcontentloaded' })
  await dismiss(enterprise)
  await enterprise.locator('[data-kaiwu-enterprise-entry]').click()
  await enterprise.locator('[data-open-enterprise-guide]').click()
  const enterpriseGuide = enterprise.locator('[data-enterprise-guide]')
  await enterpriseGuide.waitFor()
  if (!(await enterpriseGuide.textContent()).includes('为什么总览显示 0')) throw new Error('企业端引导缺少鉴权排查')
  await enterprise.screenshot({ path: path.join(out, '07-企业端-使用引导.png'), fullPage: true })

  const unauthenticated = await browser.newContext()
  const firstUse = await unauthenticated.newPage()
  await firstUse.goto('http://127.0.0.1:3182', { waitUntil: 'domcontentloaded' })
  await firstUse.locator('[data-kaiwu-enterprise-entry]').click()
  await firstUse.locator('[data-enterprise-nav="access"][data-active="true"]').waitFor({ timeout: 10000 })
  await unauthenticated.close()

  const employee = await browser.newPage({ viewport: { width: 1540, height: 920 } })
  await employee.goto('http://127.0.0.1:3183', { waitUntil: 'domcontentloaded' })
  await dismiss(employee)
  await employee.locator('[data-kaiwu-plaza-entry]').click()
  await employee.getByRole('button', { name: '员工设置', exact: true }).click()
  await employee.locator('.kwp-adminNavItem', { hasText: '企业连接' }).click()
  const employeeGuide = employee.locator('[data-employee-enterprise-guide]')
  await employeeGuide.locator('summary').click()
  if (!(await employeeGuide.textContent()).includes('恢复网络后会自动重连')) throw new Error('员工端引导缺少断线说明')
  await employee.screenshot({ path: path.join(out, '08-员工端-企业连接使用引导.png'), fullPage: true })
  console.log(JSON.stringify({ ok: true, enterpriseGuide: true, employeeGuide: true, unauthenticatedRedirect: true, screenshots: 2 }))
} finally {
  await browser.close()
}
