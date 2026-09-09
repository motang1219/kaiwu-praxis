import { createRequire } from 'node:module'
import { mkdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require('C:/Users/86166/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const out = path.resolve('测试报告/P2-跨设备基础版第一轮')
await mkdir(out, { recursive: true })

const managerUrl = 'http://127.0.0.1:3182'
const endpointUrls = ['http://127.0.0.1:3183', 'http://127.0.0.1:3184']
const endpointHomes = ['C:/Users/86166/.dsh-github-clean-employee-a', 'C:/Users/86166/.dsh-github-clean-employee-b']
const adminToken = 'cross-device-admin-token'
const testName = '第一轮跨设备联动资料'
const testFiles = endpointHomes.map((home) => path.join(home, '.agent-presets/kaiwu-data-tracker/knowledge', `${testName}.md`))

async function exists(file) { try { await stat(file); return true } catch { return false } }
async function waitFor(check, timeout = 25000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    if (await check()) return
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error('condition timed out')
}
async function dismissFirstRunOverlay(page) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(250)
    const buttons = page.locator('[role="presentation"] button:visible:not(:disabled)')
    const count = await buttons.count()
    if (!count) return
    const labels = await buttons.allTextContents()
    const closeIndex = labels.findIndex((label) => /知道|关闭|稍后|以后|跳过|开始|确认|同意|取消/.test(label))
    await buttons.nth(closeIndex >= 0 ? closeIndex : count - 1).click()
    await page.waitForTimeout(400)
  }
}

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' })
const errors = []
try {
  const manager = await browser.newPage({ viewport: { width: 1720, height: 980 } })
  manager.on('pageerror', (error) => errors.push(`manager pageerror: ${error.message}`))
  manager.on('console', (message) => { if (message.type() === 'error') errors.push(`manager console: ${message.text()}`) })
  await manager.goto(managerUrl, { waitUntil: 'domcontentloaded' })
  await manager.evaluate(({ adminToken }) => { localStorage.setItem('kaiwu.enterprise.hubUrl', 'http://127.0.0.1:3099'); localStorage.setItem('kaiwu.enterprise.adminToken', adminToken) }, { adminToken })
  await manager.reload({ waitUntil: 'domcontentloaded' })
  await dismissFirstRunOverlay(manager)
  await manager.locator('[data-kaiwu-enterprise-entry]').waitFor({ timeout: 30000 })
  if (await manager.locator('[data-kaiwu-plaza-entry]').count()) throw new Error('企业端错误地包含员工端入口')
  await manager.locator('[data-kaiwu-enterprise-entry]').click()
  await manager.locator('[data-enterprise-console]').waitFor({ timeout: 15000 })
  await waitFor(async () => (await manager.locator('[data-enterprise-table="terminals"] tbody tr').count().catch(() => 0)) === 0 || true, 1000)
  await manager.waitForTimeout(3800)
  const navLabels = await manager.locator('[data-enterprise-nav]').allTextContents()
  if (!['总览', '终端', '数字员工', '能力库', '批量配置', '审计', '接入管理'].every((label) => navLabels.some((text) => text.includes(label)))) throw new Error(`导航不完整：${navLabels.join(',')}`)
  const metrics = await manager.locator('.kep-card').allTextContents()
  if (!metrics.some((text) => text.includes('2在线终端'))) throw new Error(`在线终端数量不正确：${metrics.join('|')}`)
  await manager.screenshot({ path: path.join(out, '01-企业端总览-双终端在线.png'), fullPage: true })

  await manager.locator('[data-enterprise-nav="terminals"]').click()
  const terminalRows = await manager.locator('[data-enterprise-table="terminals"] tbody tr').allTextContents()
  if (terminalRows.length !== 2 || !terminalRows.every((row) => row.includes('在线') && row.includes('0.5.0'))) throw new Error(`终端表异常：${terminalRows.join('|')}`)
  await manager.screenshot({ path: path.join(out, '02-终端列表-身份版本地址.png'), fullPage: true })

  await manager.locator('[data-enterprise-nav="access"]').click()
  await manager.locator('[data-create-enrollment]').click()
  await manager.locator('[data-created-code]').waitFor({ timeout: 10000 })
  const generatedCode = (await manager.locator('[data-created-code]').textContent()).trim()
  if (!generatedCode) throw new Error('注册码生成失败')
  await manager.screenshot({ path: path.join(out, '03-接入管理-鉴权与注册码.png'), fullPage: true })

  const endpointResults = []
  for (let index = 0; index < endpointUrls.length; index += 1) {
    const page = await browser.newPage({ viewport: { width: 1540, height: 920 } })
    page.on('pageerror', (error) => errors.push(`endpoint-${index + 1} pageerror: ${error.message}`))
    page.on('console', (message) => { if (message.type() === 'error') errors.push(`endpoint-${index + 1} console: ${message.text()}`) })
    await page.goto(endpointUrls[index], { waitUntil: 'domcontentloaded' })
    await dismissFirstRunOverlay(page)
    await page.locator('[data-kaiwu-plaza-entry]').waitFor({ timeout: 30000 })
    if (await page.locator('[data-kaiwu-enterprise-entry]').count()) throw new Error(`员工端 ${index + 1} 错误地包含企业端入口`)
    await page.locator('[data-kaiwu-plaza-entry]').click()
    await page.locator('.kwp-card').first().waitFor({ timeout: 15000 })
    const workerCount = await page.locator('.kwp-card').count()
    if (workerCount !== 7) throw new Error(`员工端 ${index + 1} 数字员工数量 ${workerCount}`)
    await page.getByRole('button', { name: '员工设置', exact: true }).click()
    await page.locator('.kwp-adminNavItem', { hasText: '企业连接' }).click()
    await page.locator('[data-enterprise-connection]').waitFor({ timeout: 10000 })
    const connectionText = await page.locator('[data-enterprise-connection]').textContent()
    if (!connectionText.includes('已连接') || !connectionText.includes('terminal-')) throw new Error(`员工端 ${index + 1} 连接状态异常：${connectionText}`)
    if (index === 0) await page.screenshot({ path: path.join(out, '04-员工端-企业连接状态.png'), fullPage: true })
    endpointResults.push({ url: endpointUrls[index], workerCount, connectionText: connectionText.replace(/\s+/g, ' ').trim() })
    await page.close()
  }

  await manager.locator('[data-enterprise-nav="workers"]').click()
  const workerRows = await manager.locator('[data-enterprise-table="workers"] tbody tr').count()
  if (workerRows !== 7) throw new Error(`数字员工汇总数量 ${workerRows}`)
  await manager.locator('[data-enterprise-nav="library"]').click()
  const libraryRows = await manager.locator('[data-enterprise-table="library"] tbody tr').count()
  if (libraryRows < 7) throw new Error(`能力库记录过少：${libraryRows}`)

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
  await manager.locator('textarea[placeholder="配置内容"]').fill('# 第一轮跨设备联动测试\n\n由独立企业端下发到两个隔离员工端。')
  await manager.locator('[data-apply-batch]').click()
  await manager.getByText('配置已下发', { exact: true }).waitFor({ timeout: 10000 })
  await waitFor(async () => (await Promise.all(testFiles.map(exists))).every(Boolean))
  const fileContents = await Promise.all(testFiles.map((file) => readFile(file, 'utf8')))
  if (!fileContents.every((content) => content.includes('第一轮跨设备联动测试'))) throw new Error('下发文件内容不一致')
  await manager.waitForTimeout(3500)
  await manager.screenshot({ path: path.join(out, '05-批量配置-双端下发成功.png'), fullPage: true })

  await manager.locator('select').first().selectOption('removeKnowledge')
  await manager.locator('input[placeholder="配置名称"]').fill(testName)
  await manager.locator('[data-apply-batch]').click()
  await manager.getByText('配置已下发', { exact: true }).waitFor({ timeout: 10000 })
  await waitFor(async () => (await Promise.all(testFiles.map(exists))).every((value) => !value))
  await manager.waitForTimeout(3500)
  await manager.locator('[data-enterprise-nav="audit"]').click()
  const auditRows = await manager.locator('[data-enterprise-table="audit"] tbody tr').allTextContents()
  if (!auditRows.some((row) => row.includes('增加资料') && row.includes('成功')) || !auditRows.some((row) => row.includes('删除资料') && row.includes('成功'))) throw new Error('审计结果缺少成功记录')
  await manager.screenshot({ path: path.join(out, '06-审计-下发与删除成功.png'), fullPage: true })

  const relevantErrors = errors.filter((line) => !/favicon|Failed to load resource.*404/.test(line))
  if (relevantErrors.length) throw new Error(`浏览器错误：\n${relevantErrors.join('\n')}`)
  console.log(JSON.stringify({ ok: true, navLabels, metrics, terminalRows, workerRows, libraryRows, generatedCodeLength: generatedCode.length, endpointResults, auditRows: auditRows.slice(0, 6), screenshots: 6 }, null, 2))
} finally {
  await browser.close()
}
