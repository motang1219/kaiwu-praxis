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
await page.getByRole('button', { name: '员工设置', exact: true }).waitFor()
await page.getByRole('button', { name: '员工设置', exact: true }).click()
await page.locator('.kwp-adminProfile').waitFor({ timeout: 15000 })
await page.screenshot({ path: path.join(out, '01-管理端-员工档案.png'), fullPage: true })

const navLabels = await page.locator('.kwp-adminNavItem').allTextContents()
const metrics = await page.locator('.kwp-adminMetric').allTextContents()
const workerCount = await page.locator('.kwp-adminWorker').count()

await page.locator('.kwp-adminWorker').filter({ hasText: '数据追踪员' }).click()
await page.locator('.kwp-adminNavItem').filter({ hasText: '定时任务' }).click()
await page.getByRole('button', { name: '新增任务计划', exact: true }).click()
await page.getByPlaceholder('任务名称').fill('管理端自动化测试计划')
await page.getByPlaceholder(/执行周期/).fill('每天 09:00')
await page.getByPlaceholder('执行指令').fill('汇总昨日网格业绩并生成追踪简报')
await page.getByRole('button', { name: '保存', exact: true }).click()
await page.getByText('管理端自动化测试计划', { exact: true }).waitFor()
await page.getByRole('button', { name: '已启用', exact: true }).click()
await page.getByRole('button', { name: '已停用', exact: true }).waitFor()
await page.getByRole('button', { name: '已停用', exact: true }).click()
await page.getByRole('button', { name: '已启用', exact: true }).waitFor()
await page.screenshot({ path: path.join(out, '02-管理端-定时任务.png'), fullPage: true })

await page.reload({ waitUntil: 'domcontentloaded' })
await page.locator('[data-kaiwu-plaza-entry]').waitFor({ timeout: 30000 })
await page.locator('[data-kaiwu-plaza-entry]').click()
await page.getByRole('button', { name: '员工设置', exact: true }).click()
await page.locator('.kwp-adminWorker').filter({ hasText: '数据追踪员' }).click()
await page.locator('.kwp-adminNavItem').filter({ hasText: '定时任务' }).click()
const taskPersisted = await page.getByText('管理端自动化测试计划', { exact: true }).isVisible()
await page.getByRole('button', { name: '删除', exact: true }).click()
await page.getByText('管理端自动化测试计划', { exact: true }).waitFor({ state: 'detached' })

await page.locator('.kwp-adminNavItem').filter({ hasText: '记忆' }).click()
await page.getByRole('button', { name: '新增', exact: true }).click()
await page.getByPlaceholder('名称').fill('测试口径记忆')
await page.getByPlaceholder('内容（Markdown）').fill('完成率 = 实际值 / 目标值；缺失值不得推测。')
await page.getByRole('button', { name: '保存', exact: true }).click()
await page.getByText('测试口径记忆', { exact: true }).waitFor()
await page.screenshot({ path: path.join(out, '03-管理端-记忆与资料.png'), fullPage: true })
await page.getByRole('button', { name: '删除', exact: true }).click()
await page.getByText('测试口径记忆', { exact: true }).waitFor({ state: 'detached' })

for (const item of [
  { nav: '资料', title: '测试知识文档', content: '这是管理端资料 CRUD 自动化测试。' },
  { nav: 'SOP', title: '测试业务流程', content: '步骤一：验证管理端保存。' },
]) {
  await page.locator('.kwp-adminNavItem').filter({ hasText: item.nav }).click()
  await page.getByRole('button', { name: '新增', exact: true }).click()
  await page.getByPlaceholder('名称').fill(item.title)
  await page.getByPlaceholder('内容（Markdown）').fill(item.content)
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await page.getByText(item.title, { exact: true }).waitFor()
  await page.getByRole('button', { name: '删除', exact: true }).click()
  await page.getByText(item.title, { exact: true }).waitFor({ state: 'detached' })
}

await page.locator('.kwp-adminNavItem').filter({ hasText: '能力配置' }).click()
const skillCount = await page.locator('[data-capability-kind="skills"] [data-skill-id]').count()
const toolNames = await page.locator('[data-capability-kind="tools"] .kwp-adminRowTitle').allTextContents()
await page.screenshot({ path: path.join(out, '04-管理端-能力配置.png'), fullPage: true })
await page.locator('.kwp-adminNavItem').filter({ hasText: '对话日志' }).click()
const logRows = await page.locator('.kwp-adminTable tbody tr').count()
await page.screenshot({ path: path.join(out, '05-管理端-对话日志.png'), fullPage: true })

console.log(JSON.stringify({ workerCount, navLabels, metrics, taskPersisted, skillCount, toolNames, logRows, consoleErrors }, null, 2))
await browser.close()
