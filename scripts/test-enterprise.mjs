import { createRequire } from 'node:module'
import { mkdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require('C:/Users/86166/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const out = path.resolve('测试报告/P1-企业管理端')
await mkdir(out, { recursive: true })

const homes = [
  'C:/Users/86166/.dsh-enterprise-test-a',
  'C:/Users/86166/.dsh-enterprise-test-b',
]
const testName = '企业端联动测试资料'
const knowledgeFiles = homes.map((home) => path.join(home, '.agent-presets/kaiwu-data-tracker/knowledge', `${testName}.md`))
const policyFiles = homes.map((home) => path.join(home, '.agent-presets/kaiwu-data-tracker/capabilities.json'))
const agentFiles = homes.map((home) => path.join(home, '.agent-presets/kaiwu-data-tracker/agent.cordis.yml'))

async function exists(file) {
  try { await stat(file); return true } catch { return false }
}

async function waitFor(check, timeout = 15000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    if (await check()) return
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error('condition timed out')
}

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' })
const page = await browser.newPage({ viewport: { width: 1720, height: 980 }, deviceScaleFactor: 1 })
const consoleErrors = []
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
page.on('pageerror', (error) => consoleErrors.push(error.message))

await page.goto('http://127.0.0.1:3082', { waitUntil: 'domcontentloaded' })
await page.locator('[data-kaiwu-plaza-entry]').waitFor({ timeout: 30000 })
await page.locator('[data-kaiwu-plaza-entry]').click()
await page.getByRole('button', { name: '企业管理', exact: true }).click()
await page.locator('[data-enterprise-console]').waitFor({ timeout: 15000 })
await page.locator('[data-enterprise-table="terminals"] tbody tr').waitFor({ state: 'detached', timeout: 1000 }).catch(() => {})
await page.waitForTimeout(3500)

const navLabels = await page.locator('[data-enterprise-nav]').allTextContents()
const overviewMetrics = await page.locator('.kwp-enterpriseCard').allTextContents()
await page.screenshot({ path: path.join(out, '01-企业总览.png'), fullPage: true })

await page.locator('[data-enterprise-nav="terminals"]').click()
await page.locator('[data-enterprise-table="terminals"] tbody tr').first().waitFor()
const terminalRows = await page.locator('[data-enterprise-table="terminals"] tbody tr').allTextContents()
await page.screenshot({ path: path.join(out, '02-终端管理.png'), fullPage: true })

await page.locator('[data-enterprise-nav="workers"]').click()
const workerRows = await page.locator('[data-enterprise-table="workers"] tbody tr').allTextContents()
await page.screenshot({ path: path.join(out, '03-数字员工.png'), fullPage: true })

await page.locator('[data-enterprise-nav="library"]').click()
const libraryRows = await page.locator('[data-enterprise-table="library"] tbody tr').count()
await page.screenshot({ path: path.join(out, '04-能力库.png'), fullPage: true })

await page.locator('[data-enterprise-nav="batch"]').click()
const targetLabels = page.locator('.kwp-enterpriseTargets').nth(1).locator('label')
for (let i = 0; i < await targetLabels.count(); i += 1) {
  const label = targetLabels.nth(i)
  if (!(await label.textContent()).includes('数据追踪员')) {
    const checkbox = label.locator('input')
    if (await checkbox.isChecked()) await checkbox.uncheck()
  }
}
await page.locator('input[placeholder="资料、SOP、技能或工具名称"]').fill(testName)
await page.locator('textarea[placeholder^="内容"]').fill('# 企业端联动测试\n\n由企业管理端同时下发到两个独立员工端。')
await page.locator('[data-apply-batch]').click()
await page.getByText('批量配置已应用', { exact: true }).waitFor()
await waitFor(async () => (await Promise.all(knowledgeFiles.map(exists))).every(Boolean))
const knowledgeContents = await Promise.all(knowledgeFiles.map((file) => readFile(file, 'utf8')))
await page.screenshot({ path: path.join(out, '05-批量配置成功.png'), fullPage: true })

// 删除测试资料，验证企业端既能增加也能回收资产。
await page.locator('select').first().selectOption('removeKnowledge')
await page.locator('input[placeholder="资料、SOP、技能或工具名称"]').fill(testName)
await page.locator('[data-apply-batch]').click()
await page.getByText('批量配置已应用', { exact: true }).waitFor()
await waitFor(async () => (await Promise.all(knowledgeFiles.map(exists))).every((value) => !value))

// 停用再恢复 filesystem，验证策略文件与 agent 组件配置在两端都真实变化。
await page.locator('select').first().selectOption('disableTool')
await page.locator('select').nth(1).selectOption('filesystem')
await page.locator('[data-apply-batch]').click()
await page.getByText('批量配置已应用', { exact: true }).waitFor()
await waitFor(async () => {
  const policies = await Promise.all(policyFiles.map((file) => readFile(file, 'utf8')))
  const agents = await Promise.all(agentFiles.map((file) => readFile(file, 'utf8')))
  return policies.every((raw) => JSON.parse(raw).disabledTools.includes('read')) && agents.every((raw) => !raw.includes('- id: tool-fs'))
})
const disabledPolicies = await Promise.all(policyFiles.map(async (file) => JSON.parse(await readFile(file, 'utf8'))))

await page.locator('select').first().selectOption('enableTool')
await page.locator('select').nth(1).selectOption('filesystem')
await page.locator('[data-apply-batch]').click()
await page.getByText('批量配置已应用', { exact: true }).waitFor()
await waitFor(async () => {
  const policies = await Promise.all(policyFiles.map((file) => readFile(file, 'utf8')))
  const agents = await Promise.all(agentFiles.map((file) => readFile(file, 'utf8')))
  return policies.every((raw) => JSON.parse(raw).disabledTools.length === 0) && agents.every((raw) => raw.includes('- id: tool-fs'))
})

await page.waitForTimeout(3500)
await page.locator('[data-enterprise-nav="audit"]').click()
const auditRows = await page.locator('[data-enterprise-table="audit"] tbody tr').allTextContents()
await page.screenshot({ path: path.join(out, '06-审计记录.png'), fullPage: true })

console.log(JSON.stringify({ navLabels, overviewMetrics, terminalRows, workerCount: workerRows.length, dataTrackerRows: workerRows.filter((row) => row.includes('数据追踪员')), libraryRows, knowledgeContents, disabledPolicies, auditRows: auditRows.slice(0, 6), consoleErrors }, null, 2))
await browser.close()
