import { createRequire } from 'node:module'
import { mkdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require('C:/Users/86166/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const out = path.resolve('测试报告/P1-插件拆分')
await mkdir(out, { recursive: true })

const endpoints = [
  { port: 3083, home: 'C:/Users/86166/.dsh-enterprise-test-a' },
  { port: 3084, home: 'C:/Users/86166/.dsh-enterprise-test-b' },
]
const testName = '拆包联动测试资料'
const testFiles = endpoints.map((item) => path.join(item.home, '.agent-presets/kaiwu-data-tracker/knowledge', `${testName}.md`))
async function exists(file) { try { await stat(file); return true } catch { return false } }
async function waitFor(check, timeout = 15000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    if (await check()) return
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error('condition timed out')
}

const managerPkg = JSON.parse(await readFile('C:/Users/86166/.dsh-fresh/profiles/web/package.json', 'utf8'))
if (!managerPkg.dependencies['kaiwu-praxis-enterprise'] || managerPkg.dependencies['kaiwu-praxis']) throw new Error('3082 package isolation failed')
for (const endpoint of endpoints) {
  const pkg = JSON.parse(await readFile(path.join(endpoint.home, 'profiles/web/package.json'), 'utf8'))
  if (!pkg.dependencies['kaiwu-praxis'] || pkg.dependencies['kaiwu-praxis-enterprise']) throw new Error(`${endpoint.port} package isolation failed`)
}

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' })
const manager = await browser.newPage({ viewport: { width: 1720, height: 980 } })
const managerErrors = []
manager.on('console', (msg) => { if (msg.type() === 'error') managerErrors.push(msg.text()) })
manager.on('pageerror', (error) => managerErrors.push(error.message))
await manager.goto('http://127.0.0.1:3082', { waitUntil: 'domcontentloaded' })
await manager.locator('[data-kaiwu-enterprise-entry]').waitFor({ timeout: 30000 })
if (await manager.locator('[data-kaiwu-plaza-entry]').count()) throw new Error('3082 unexpectedly exposes employee plaza')
await manager.locator('[data-kaiwu-enterprise-entry]').click()
await manager.locator('[data-enterprise-console]').waitFor({ timeout: 15000 })
await manager.waitForTimeout(3500)
const navLabels = await manager.locator('[data-enterprise-nav]').allTextContents()
const metrics = await manager.locator('.kep-card').allTextContents()
await manager.screenshot({ path: path.join(out, '01-独立企业端总览.png'), fullPage: true })

await manager.locator('[data-enterprise-nav="terminals"]').click()
const terminalRows = await manager.locator('[data-enterprise-table="terminals"] tbody tr').allTextContents()
await manager.screenshot({ path: path.join(out, '02-独立企业端终端.png'), fullPage: true })

await manager.locator('[data-enterprise-nav="workers"]').click()
const workerRows = await manager.locator('[data-enterprise-table="workers"] tbody tr').count()
await manager.locator('[data-enterprise-nav="library"]').click()
const libraryRows = await manager.locator('[data-enterprise-table="library"] tbody tr').count()

await manager.locator('[data-enterprise-nav="batch"]').click()
const workerTargets = manager.locator('.kep-targets').nth(1).locator('label')
for (let i = 0; i < await workerTargets.count(); i += 1) {
  const label = workerTargets.nth(i)
  if (!(await label.textContent()).includes('数据追踪员')) {
    const checkbox = label.locator('input')
    if (await checkbox.isChecked()) await checkbox.uncheck()
  }
}
await manager.locator('input[placeholder="配置名称"]').fill(testName)
await manager.locator('textarea[placeholder="配置内容"]').fill('# 拆包联动测试\n\n由独立企业端下发到两个独立员工端。')
await manager.locator('[data-apply-batch]').click()
await manager.getByText('配置已下发', { exact: true }).waitFor()
await waitFor(async () => (await Promise.all(testFiles.map(exists))).every(Boolean))
const contents = await Promise.all(testFiles.map((file) => readFile(file, 'utf8')))
await manager.screenshot({ path: path.join(out, '03-跨插件批量配置.png'), fullPage: true })

await manager.locator('select').first().selectOption('removeKnowledge')
await manager.locator('input[placeholder="配置名称"]').fill(testName)
await manager.locator('[data-apply-batch]').click()
await manager.getByText('配置已下发', { exact: true }).waitFor()
await waitFor(async () => (await Promise.all(testFiles.map(exists))).every((value) => !value))
await manager.waitForTimeout(3500)
await manager.locator('[data-enterprise-nav="audit"]').click()
const auditRows = await manager.locator('[data-enterprise-table="audit"] tbody tr').allTextContents()
await manager.screenshot({ path: path.join(out, '04-跨插件审计.png'), fullPage: true })

const endpointResults = []
for (const endpoint of endpoints) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`http://127.0.0.1:${endpoint.port}`, { waitUntil: 'domcontentloaded' })
  await page.locator('[data-kaiwu-plaza-entry]').waitFor({ timeout: 30000 })
  if (await page.locator('[data-kaiwu-enterprise-entry]').count()) throw new Error(`${endpoint.port} unexpectedly exposes enterprise entry`)
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
  await page.screenshot({ path: path.join(out, `05-员工端-${endpoint.port}.png`), fullPage: true })
  endpointResults.push({ port: endpoint.port, workerCount, topActions, enterpriseEntry: 0, consoleErrors: errors })
  await page.close()
}

console.log(JSON.stringify({ navLabels, metrics, terminalRows, workerRows, libraryRows, contents, auditRows: auditRows.slice(0, 2), managerErrors, endpointResults }, null, 2))
await browser.close()
