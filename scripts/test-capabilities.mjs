import { createRequire } from 'node:module'
import { access, mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require('C:/Users/86166/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const out = path.resolve('测试报告/P1-管理端')
const presetRoot = 'C:/Users/86166/.dsh-fresh/.agent-presets/kaiwu-data-tracker'
await mkdir(out, { recursive: true })

async function exists(file) {
  try { await access(file); return true } catch { return false }
}
async function waitFor(check, label) {
  for (let i = 0; i < 40; i += 1) {
    if (await check()) return
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`等待超时：${label}`)
}

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' })
const page = await browser.newPage({ viewport: { width: 1720, height: 980 }, deviceScaleFactor: 1 })
const consoleErrors = []
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
page.on('pageerror', (err) => consoleErrors.push(err.message))

async function openCapabilities() {
  await page.goto('http://127.0.0.1:3082', { waitUntil: 'domcontentloaded' })
  await page.locator('[data-kaiwu-plaza-entry]').waitFor({ timeout: 30000 })
  await page.locator('[data-kaiwu-plaza-entry]').click()
  await page.getByRole('button', { name: '员工设置', exact: true }).click()
  await page.locator('.kwp-adminProfile').waitFor({ timeout: 15000 })
  await page.locator('.kwp-adminWorker').filter({ hasText: '数据追踪员' }).click()
  await page.locator('.kwp-adminNavItem').filter({ hasText: '能力配置' }).click()
  await page.locator('[data-capability-kind="skills"]').waitFor()
}

await openCapabilities()
const navLabels = await page.locator('.kwp-adminNavItem').allTextContents()
if (navLabels.some((text) => text.endsWith('技能') || text.endsWith('工具')) || !navLabels.some((text) => text.includes('能力配置'))) throw new Error(`导航未合并：${navLabels.join(',')}`)

const skillGroup = page.locator('[data-capability-kind="skills"]')
const toolGroup = page.locator('[data-capability-kind="tools"]')
const initialSkills = await skillGroup.locator('[data-skill-id]').count()
const initialTools = await toolGroup.locator('[data-tool-id]').count()
await page.screenshot({ path: path.join(out, '07-能力配置-合并页面.png'), fullPage: true })

await page.getByRole('button', { name: '新增技能', exact: true }).click()
await page.getByPlaceholder('技能名称').fill('能力配置自动化测试')
await page.getByPlaceholder('技能说明').fill('验证本地技能增删改和启停')
await page.getByPlaceholder('技能内容（Markdown）').fill('# 自动化测试\n\n只用于实机回归。')
await page.locator('[data-skill-editor]').getByRole('button', { name: '保存', exact: true }).click()
const localRow = skillGroup.locator('[data-skill-id^="local-"]').filter({ hasText: '能力配置自动化测试' })
await localRow.waitFor()
const localId = await localRow.getAttribute('data-skill-id')
const localFile = `${presetRoot}/skills/${localId}/SKILL.md`
await waitFor(() => exists(localFile), '本地技能物化')

await localRow.locator('.kwp-adminSwitch').click()
await waitFor(async () => !(await exists(localFile)), '技能停用后移除')
await localRow.locator('.kwp-adminSwitch').click()
await waitFor(() => exists(localFile), '技能重新启用后恢复')

const officialRow = skillGroup.locator('[data-skill-id="kaiwu-data-tracker"]')
await officialRow.locator('.kwp-adminSwitch').click()
await waitFor(async () => !(await exists(`${presetRoot}/skills/kaiwu-data-tracker/SKILL.md`)), '交付包技能停用')
await officialRow.locator('.kwp-adminSwitch').click()
await waitFor(() => exists(`${presetRoot}/skills/kaiwu-data-tracker/SKILL.md`), '交付包技能恢复')

const fsRow = toolGroup.locator('[data-tool-id="filesystem"]')
await fsRow.locator('.kwp-adminSwitch').click()
await waitFor(async () => {
  const policy = JSON.parse(await readFile(`${presetRoot}/capabilities.json`, 'utf8'))
  return ['read', 'write', 'edit', 'read_image'].every((name) => policy.disabledTools.includes(name))
}, '文件工具真实运行名写入策略')
await waitFor(async () => !(await readFile(`${presetRoot}/agent.cordis.yml`, 'utf8')).includes('- id: tool-fs'), '工具组件从预设移除')
await page.screenshot({ path: path.join(out, '08-能力配置-工具停用.png'), fullPage: true })

await page.reload({ waitUntil: 'domcontentloaded' })
await openCapabilities()
const persistedFs = page.locator('[data-capability-kind="tools"] [data-tool-id="filesystem"] .kwp-adminSwitch')
if ((await persistedFs.getAttribute('data-enabled')) !== 'false') throw new Error('工具停用状态刷新后未持久化')
await persistedFs.click()
await waitFor(async () => (await readFile(`${presetRoot}/agent.cordis.yml`, 'utf8')).includes('- id: tool-fs'), '工具组件恢复')

const cleanupRow = page.locator('[data-capability-kind="skills"] [data-skill-id="' + localId + '"]')
await cleanupRow.getByRole('button', { name: '删除', exact: true }).click()
await waitFor(async () => !(await exists(localFile)), '本地测试技能清理')
await cleanupRow.waitFor({ state: 'detached' })
await page.screenshot({ path: path.join(out, '09-能力配置-最终状态.png'), fullPage: true })

await page.locator('.kwp-back').click()
await page.locator('.kwp-card').filter({ hasText: '数据追踪员' }).click()
await page.locator('.kwp-fixed').waitFor({ state: 'detached', timeout: 20000 })

console.log(JSON.stringify({ navLabels, initialSkills, initialTools, localId, toolRuntimeNames: ['read', 'write', 'edit', 'read_image'], presetSessionStarted: true, consoleErrors }, null, 2))
await browser.close()
if (consoleErrors.length) process.exitCode = 1
