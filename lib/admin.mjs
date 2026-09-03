/**
 * kaiwu-praxis / admin.mjs
 * 粗糙管理端的数据层：
 *   - 注册 settings 命名空间 `kaiwu-praxis`（客户端通过 api.settings 读写）
 *   - 首次运行时把数字员工的真实技能与工具播种进设置
 *   - watch 设置变更，把资料 / SOP / 技能 / 工具策略物化到 preset 目录
 *   - 保留能力来源与版本元数据，后续升级可以区分官方基线和本地修改
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import z from '@deepseek-ai/schemastery'
import { ensureEnterpriseHub, hubRequest, terminalIdentity } from './enterprise-hub.mjs'

export const name = 'kaiwu-praxis-admin'

const NS = 'kaiwu-praxis'
const HERE = dirname(fileURLToPath(import.meta.url))
const SHIPPED_PRESETS = join(HERE, '..', 'presets')
const CAPABILITY_VERSION = '0.2.0'
const LOCAL_SOURCE = 'local'
const PACKAGE_SOURCE = 'package'

const WORKER_IDS = [
  'kaiwu-watermark',
  'kaiwu-docbutler',
  'kaiwu-content',
  'kaiwu-competitor',
  'kaiwu-research',
  'kaiwu-brand-auditor',
  'kaiwu-data-tracker',
]

const DocSchema = z.object({
  name: z.string().default(''),
  content: z.string().default(''),
})
const SkillSchema = z.object({
  id: z.string().default(''),
  name: z.string().default(''),
  description: z.string().default(''),
  content: z.string().default(''),
  enabled: z.boolean().default(true),
  deleted: z.boolean().default(false),
  source: z.string().default(PACKAGE_SOURCE),
  baseVersion: z.string().default(CAPABILITY_VERSION),
  packageVersion: z.string().default(CAPABILITY_VERSION),
  localRevision: z.number().default(0),
  modified: z.boolean().default(false),
})
const ProfileSchema = z.object({
  owner: z.string().default('admin'),
  department: z.string().default('运营中心'),
  joinedAt: z.string().default(''),
  summary: z.string().default(''),
})
const TaskSchema = z.object({
  name: z.string().default(''),
  schedule: z.string().default(''),
  prompt: z.string().default(''),
  enabled: z.boolean().default(true),
})
const ToolSchema = z.object({
  id: z.string().default(''),
  name: z.string().default(''),
  description: z.string().default(''),
  source: z.string().default(''),
  componentId: z.string().default(''),
  runtimeNames: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
  baseVersion: z.string().default(CAPABILITY_VERSION),
  packageVersion: z.string().default(CAPABILITY_VERSION),
  localRevision: z.number().default(0),
  modified: z.boolean().default(false),
})
const AuditSchema = z.object({
  id: z.string().default(''),
  time: z.string().default(''),
  operator: z.string().default('企业管理员'),
  action: z.string().default(''),
  target: z.string().default(''),
  detail: z.string().default(''),
  result: z.string().default('成功'),
})
const TerminalSchema = z.object({
  id: z.string().default('local-portable'),
  name: z.string().default('本机便携终端'),
  status: z.string().default('online'),
  version: z.string().default(CAPABILITY_VERSION),
  lastSeen: z.string().default(''),
})
const EnterpriseSchema = z.object({
  organizationName: z.string().default('开物数字员工体验组织'),
  terminals: z.array(TerminalSchema).default([]),
  audit: z.array(AuditSchema).default([]),
})
const WorkerSchema = z.object({
  profile: ProfileSchema.default({}),
  knowledge: z.array(DocSchema).default([]),
  memories: z.array(DocSchema).default([]),
  sops: z.array(DocSchema).default([]),
  tasks: z.array(TaskSchema).default([]),
  skills: z.array(SkillSchema).default([]),
  tools: z.array(ToolSchema).default([]),
})
const AdminSchema = z.object({
  workers: z.dict(WorkerSchema).default({}),
  tempWorkspacePath: z.string().default(''),
  enterprise: EnterpriseSchema.default({}),
})

function dshHome() {
  return process.env.DSH_HOME ?? join(process.env.USERPROFILE ?? '', '.dsh')
}

function userPresetRoot() {
  return join(dshHome(), '.agent-presets')
}

/** 无工作区时用于临时对话的工作区目录：固定在 DSH 根目录下，方便日后翻找记录。 */
function tempWorkspaceDir() {
  return join(dshHome(), '临时对话')
}

function sanitizeName(name) {
  const cleaned = String(name || '').replace(/[\\/:*?"<>|]/g, '_').trim()
  return cleaned === '' ? 'untitled' : cleaned
}

function parseSkill(raw, id) {
  let name = ''
  let description = ''
  const m = /^---\n([\s\S]*?)\n---/.exec(raw)
  if (m) {
    const fm = m[1]
    const n = /^name:\s*(.+)$/m.exec(fm)
    const d = /^description:\s*(.+)$/m.exec(fm)
    if (n) name = n[1].trim()
    if (d) description = d[1].trim()
  }
  return {
    id,
    name: name || id,
    description,
    content: raw,
    enabled: true,
    deleted: false,
    source: PACKAGE_SOURCE,
    baseVersion: CAPABILITY_VERSION,
    packageVersion: CAPABILITY_VERSION,
    localRevision: 0,
    modified: false,
  }
}

/** 读取交付包技能基线；用户修改只从 settings 合并，不能反向污染官方基线。 */
function readSkillsFor(workerId) {
  const roots = [join(SHIPPED_PRESETS, workerId, 'skills')]
  for (const root of roots) {
    try {
      if (!existsSync(root)) continue
      const dirs = readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory())
      if (dirs.length === 0) continue
      const skills = []
      for (const dir of dirs) {
        const file = join(root, dir.name, 'SKILL.md')
        if (existsSync(file)) skills.push(parseSkill(readFileSync(file, 'utf8'), dir.name))
      }
      if (skills.length > 0) return skills
    } catch {
      // 读失败就试下一个根
    }
  }
  return []
}

const WORKER_TOOLS = {
  'kaiwu-watermark': [
    { name: 'filesystem', description: '读取输入文件与保存处理结果', source: 'DSH 文件能力', componentId: 'tool-fs' },
    { name: 'skill', description: '加载水印处理 SOP', source: 'DSH 技能能力', componentId: 'tool-skill' },
    { name: 'watermark', description: '批量为 PDF 与图片添加水印', source: '开物本地工具', componentId: '' },
  ],
  'kaiwu-docbutler': [
    { name: 'filesystem', description: '读取输入文件与保存处理结果', source: 'DSH 文件能力', componentId: 'tool-fs' },
    { name: 'skill', description: '加载资料管家 SOP', source: 'DSH 技能能力', componentId: 'tool-skill' },
    { name: 'file_classify', description: '按规则分类并归档本地文件', source: '开物本地工具', componentId: '' },
    { name: 'batch_rename', description: '批量重命名文件', source: '开物本地工具', componentId: '' },
    { name: 'format_convert', description: '转换常用文件格式', source: '开物本地工具', componentId: '' },
  ],
  'kaiwu-content': [
    { name: 'web', description: '检索公开背景资料并保留来源', source: 'DSH 联网检索', componentId: 'tool-web' },
    { name: 'filesystem', description: '读取企业资料与保存内容产出', source: 'DSH 文件能力', componentId: 'tool-fs' },
    { name: 'skill', description: '加载内容创作 SOP', source: 'DSH 技能能力', componentId: 'tool-skill' },
  ],
  'kaiwu-competitor': [
    { name: 'web', description: '检索公开竞品信息并保留来源', source: 'DSH 联网检索', componentId: 'tool-web' },
    { name: 'filesystem', description: '读取企业事实与保存分析结果', source: 'DSH 文件能力', componentId: 'tool-fs' },
    { name: 'skill', description: '加载竞品分析 SOP', source: 'DSH 技能能力', componentId: 'tool-skill' },
  ],
  'kaiwu-research': [
    { name: 'web', description: '多源检索公开行业与客户情报', source: 'DSH 联网检索', componentId: 'tool-web' },
    { name: 'filesystem', description: '读取内部资料与保存情报简报', source: 'DSH 文件能力', componentId: 'tool-fs' },
    { name: 'skill', description: '加载情报采集 SOP', source: 'DSH 技能能力', componentId: 'tool-skill' },
  ],
  'kaiwu-brand-auditor': [
    { name: 'web', description: '扫描公开品牌与口碑信息', source: 'DSH 联网检索', componentId: 'tool-web' },
    { name: 'filesystem', description: '读取品牌资料与保存诊断报告', source: 'DSH 文件能力', componentId: 'tool-fs' },
    { name: 'skill', description: '加载品牌诊断 SOP', source: 'DSH 技能能力', componentId: 'tool-skill' },
  ],
  'kaiwu-data-tracker': [
    { name: 'filesystem', description: '读取业务数据并保存台账和汇报材料', source: 'DSH 文件能力', componentId: 'tool-fs' },
    { name: 'skill', description: '加载数据追踪 SOP', source: 'DSH 技能能力', componentId: 'tool-skill' },
  ],
}

const ALL_CUSTOM_TOOLS = ['batch_rename', 'format_convert', 'watermark', 'file_classify']

function seededTool(tool) {
  const runtimeNames = tool.name === 'filesystem'
    ? ['read', 'write', 'edit', 'read_image']
    : tool.name === 'web'
      ? ['web_search', 'web_fetch']
      : [tool.name]
  return {
    id: tool.name,
    ...tool,
    runtimeNames,
    enabled: true,
    baseVersion: CAPABILITY_VERSION,
    packageVersion: CAPABILITY_VERSION,
    localRevision: 0,
    modified: false,
  }
}

function seededWorkers() {
  const workers = {}
  const today = new Date().toISOString().slice(0, 10)
  for (const id of WORKER_IDS) {
    workers[id] = {
      profile: { owner: 'admin', department: '运营中心', joinedAt: today, summary: '' },
      knowledge: [],
      memories: [],
      sops: [],
      tasks: [],
      skills: readSkillsFor(id),
      tools: (WORKER_TOOLS[id] || []).map(seededTool),
    }
  }
  return workers
}

function seededEnterprise(current) {
  const previous = current || {}
  const terminals = Array.isArray(previous.terminals) && previous.terminals.length > 0
    ? previous.terminals
    : [{
        id: 'local-portable',
        name: '本机便携终端',
        status: 'online',
        version: CAPABILITY_VERSION,
        lastSeen: new Date().toISOString(),
      }]
  return {
    organizationName: previous.organizationName || '开物数字员工体验组织',
    terminals,
    audit: Array.isArray(previous.audit) ? previous.audit.slice(-500) : [],
  }
}

async function syncDocDir(dir, docs) {
  await mkdir(dir, { recursive: true })
  const wanted = new Set()
  for (const doc of docs || []) {
    const file = `${sanitizeName(doc.name)}.md`
    wanted.add(file)
    await writeFile(join(dir, file), String(doc.content ?? ''), 'utf8')
  }
  // 清理该目录下不再存在的 md 文件
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.md') && !wanted.has(entry.name)) {
      await rm(join(dir, entry.name), { force: true })
    }
  }
}

function mergeSkills(shipped, current) {
  const used = new Set()
  const merged = shipped.map((base) => {
    const index = (current || []).findIndex((item, i) => !used.has(i) && ((item.id && item.id === base.id) || (!item.id && item.name === base.name)))
    if (index < 0) return base
    used.add(index)
    const cur = current[index]
    const modified = cur.modified === true && (
      (cur.name || base.name) !== base.name ||
      (cur.description ?? base.description) !== base.description ||
      (cur.content || base.content) !== base.content
    )
    return {
      ...base,
      name: modified ? (cur.name || base.name) : base.name,
      description: modified ? (cur.description ?? base.description) : base.description,
      content: modified ? (cur.content || base.content) : base.content,
      enabled: cur.enabled !== false,
      deleted: cur.deleted === true,
      baseVersion: modified ? (cur.baseVersion || CAPABILITY_VERSION) : CAPABILITY_VERSION,
      packageVersion: CAPABILITY_VERSION,
      localRevision: Number(cur.localRevision) || 0,
      modified,
    }
  })
  for (let i = 0; i < (current || []).length; i += 1) {
    if (used.has(i)) continue
    const cur = current[i]
    // 旧 schema 曾把缺失技能解析成一个全空默认对象；这不是用户资产。
    if (!cur.id && !cur.name && !cur.description && !cur.content) continue
    const normalizedContent = String(cur.content || '').replace(/\r\n/g, '\n').trim()
    const duplicatesPackage = shipped.some((base) => String(base.content || '').replace(/\r\n/g, '\n').trim() === normalizedContent)
    if (/^local-untitled-\d+$/.test(cur.id || '') && cur.name === '未命名技能' && duplicatesPackage) continue
    merged.push({
      id: cur.id || `local-${sanitizeName(cur.name)}-${i + 1}`,
      name: cur.name || '未命名技能',
      description: cur.description || '',
      content: cur.content || '',
      enabled: cur.enabled !== false,
      deleted: cur.deleted === true,
      source: LOCAL_SOURCE,
      baseVersion: cur.baseVersion || '',
      packageVersion: cur.packageVersion || '',
      localRevision: Number(cur.localRevision) || 1,
      modified: true,
    })
  }
  return merged
}

function mergeTools(shipped, current) {
  return shipped.map((base) => {
    const cur = (current || []).find((item) => (item.id || item.name) === base.id)
    if (!cur) return base
    return {
      ...base,
      enabled: cur.enabled !== false,
      localRevision: Number(cur.localRevision) || 0,
      modified: cur.enabled === false,
    }
  })
}

function skillMarkdown(skill) {
  const raw = String(skill.content || '')
  const header = `---\nname: ${skill.name || skill.id}\ndescription: ${skill.description || ''}\n---`
  if (/^---\r?\n[\s\S]*?\r?\n---/.test(raw)) return raw.replace(/^---\r?\n[\s\S]*?\r?\n---/, header)
  return `${header}\n\n${raw}`
}

async function syncSkills(dir, skills) {
  await mkdir(dir, { recursive: true })
  const wanted = new Set()
  for (const skill of skills || []) {
    const id = sanitizeName(skill.id || skill.name)
    const target = join(dir, id)
    if (skill.enabled === false || skill.deleted === true) {
      await rm(target, { recursive: true, force: true })
      continue
    }
    wanted.add(id)
    await mkdir(target, { recursive: true })
    await writeFile(join(target, 'SKILL.md'), skillMarkdown(skill), 'utf8')
    await writeFile(join(target, '.kaiwu-managed'), `${skill.id || id}\n`, 'utf8')
  }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || wanted.has(entry.name)) continue
    const target = join(dir, entry.name)
    if (existsSync(join(target, '.kaiwu-managed'))) await rm(target, { recursive: true, force: true })
  }
}

function withoutDisabledComponents(raw, tools) {
  const disabled = new Set((tools || []).filter((tool) => tool.enabled === false && tool.componentId).map((tool) => tool.componentId))
  return raw.split(/\r?\n(?=- id: )/).filter((block) => {
    const match = /^- id:\s*([^\r\n]+)/m.exec(block)
    return !match || !disabled.has(match[1].trim())
  }).join('\n')
}

async function syncToolPolicy(root, workerId, tools) {
  const enabled = new Set((tools || []).filter((tool) => tool.enabled !== false).map((tool) => tool.name))
  const disabledTools = (tools || []).filter((tool) => tool.enabled === false).flatMap((tool) => tool.runtimeNames || [tool.name])
  const denyGlobal = ALL_CUSTOM_TOOLS.filter((name) => !enabled.has(name))
  await writeFile(join(root, workerId, 'capabilities.json'), `${JSON.stringify({ workerId, disabledTools, denyGlobal }, null, 2)}\n`, 'utf8')
  const shippedConfig = readFileSync(join(SHIPPED_PRESETS, workerId, 'agent.cordis.yml'), 'utf8')
  await writeFile(join(root, workerId, 'agent.cordis.yml'), withoutDisabledComponents(shippedConfig, tools), 'utf8')
}

async function materialize(workers) {
  const root = userPresetRoot()
  for (const id of WORKER_IDS) {
    const worker = workers[id] || { knowledge: [], sops: [], skills: [], tools: [] }
    await mkdir(join(root, id), { recursive: true })
    await syncDocDir(join(root, id, 'knowledge'), worker.knowledge)
    await syncDocDir(join(root, id, 'sop'), worker.sops)
    await syncSkills(join(root, id, 'skills'), worker.skills)
    await syncToolPolicy(root, id, worker.tools)
  }
}

function terminalWorkerSnapshot(workers) {
  const result = {}
  for (const id of WORKER_IDS) {
    const worker = workers[id] || {}
    result[id] = {
      profile: worker.profile || {},
      knowledge: (worker.knowledge || []).map((item) => ({ name: item.name })),
      sops: (worker.sops || []).map((item) => ({ name: item.name })),
      skills: (worker.skills || []).map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        source: item.source,
        packageVersion: item.packageVersion,
        enabled: item.enabled !== false,
        deleted: item.deleted === true,
      })),
      tools: (worker.tools || []).map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        source: item.source,
        packageVersion: item.packageVersion,
        enabled: item.enabled !== false,
      })),
    }
  }
  return result
}

function applyEnterpriseCommand(workers, command) {
  const next = structuredClone(workers || {})
  const payload = command.payload || {}
  for (const workerId of command.workerIds || []) {
    const worker = next[workerId]
    if (!worker) continue
    if (payload.action === 'addKnowledge') {
      worker.knowledge = [...(worker.knowledge || []), { name: payload.name, content: payload.content || '' }]
    } else if (payload.action === 'removeKnowledge') {
      worker.knowledge = (worker.knowledge || []).filter((item) => item.name !== payload.name)
    } else if (payload.action === 'addSop') {
      worker.sops = [...(worker.sops || []), { name: payload.name, content: payload.content || '' }]
    } else if (payload.action === 'removeSop') {
      worker.sops = (worker.sops || []).filter((item) => item.name !== payload.name)
    } else if (payload.action === 'addSkill') {
      worker.skills = [...(worker.skills || []), {
        id: `enterprise-${sanitizeName(payload.name)}-${Date.now()}`,
        name: payload.name,
        description: payload.description || '',
        content: payload.content || '',
        enabled: true,
        deleted: false,
        source: LOCAL_SOURCE,
        baseVersion: '',
        packageVersion: '',
        localRevision: 1,
        modified: true,
      }]
    } else if (payload.action === 'removeSkill') {
      worker.skills = (worker.skills || []).flatMap((skill) => {
        if ((skill.id || skill.name) !== payload.name && skill.name !== payload.name) return [skill]
        if (skill.source === LOCAL_SOURCE) return []
        return [{ ...skill, enabled: false, deleted: true, localRevision: (Number(skill.localRevision) || 0) + 1 }]
      })
    } else if (payload.action === 'enableTool' || payload.action === 'disableTool') {
      worker.tools = (worker.tools || []).map((tool) => {
        if ((tool.id || tool.name) !== payload.name && tool.name !== payload.name) return tool
        const enabled = payload.action === 'enableTool'
        return { ...tool, enabled, modified: !enabled, localRevision: (Number(tool.localRevision) || 0) + 1 }
      })
    }
  }
  return next
}

export function apply(ctx, config = {}) {
  ctx.inject(['settings'], (sctx) => {
    const scope = sctx.settings.register(NS, AdminSchema, { base: { workers: {} } })
    const logger = sctx.logger ?? ctx.logger

    scope.watch((next) => {
      materialize(next && next.workers ? next.workers : {}).catch((e) => {
        logger?.warn(`kaiwu-praxis: materialize failed: ${(e && e.message) || e}`)
      })
    })

    // 每次启动合并交付包能力基线与用户设置；官方更新不会覆盖本地修改，
    // 被删除的官方技能保留 tombstone，避免升级后被静默加回。
    // tempWorkspacePath 固定在 DSH 根目录下，供客户端在无工作区时开临时对话。
    const tempDir = tempWorkspaceDir()
    const current = scope.get()
    const seeded = seededWorkers()
    const merged = {}
    for (const id of WORKER_IDS) {
      const cur = (current && current.workers && current.workers[id]) || {}
      merged[id] = {
        profile: {
          ...seeded[id].profile,
          ...(cur.profile || {}),
          owner: (cur.profile && cur.profile.owner) || seeded[id].profile.owner,
          department: (cur.profile && cur.profile.department) || seeded[id].profile.department,
          joinedAt: (cur.profile && cur.profile.joinedAt) || seeded[id].profile.joinedAt,
        },
        knowledge: cur.knowledge || [],
        memories: cur.memories || [],
        sops: cur.sops || [],
        tasks: cur.tasks || [],
        skills: mergeSkills(seeded[id].skills, cur.skills || []),
        tools: mergeTools(seeded[id].tools, cur.tools || []),
      }
    }
    mkdir(tempDir, { recursive: true }).catch((e) => {
      logger?.warn(`kaiwu-praxis: mkdir temp workspace failed: ${(e && e.message) || e}`)
    })
    const enterprise = seededEnterprise(current && current.enterprise)
    const nextValue = { workers: merged, tempWorkspacePath: tempDir, enterprise }
    const changed = JSON.stringify(merged) !== JSON.stringify((current && current.workers) || {}) ||
      (current && current.tempWorkspacePath) !== tempDir ||
      JSON.stringify(enterprise) !== JSON.stringify((current && current.enterprise) || {})
    if (changed) {
      scope.update(nextValue).catch((e) => {
        logger?.warn(`kaiwu-praxis: sync admin settings failed: ${(e && e.message) || e}`)
      })
    } else {
      materialize(current.workers).catch((e) => {
        logger?.warn(`kaiwu-praxis: initial materialize failed: ${(e && e.message) || e}`)
      })
    }

    // 多个本机 DSH 实例通过 127.0.0.1 企业中枢交换终端心跳和配置指令。
    // 企业端只负责下发；每个员工端仍由自己的 settings/watch 完成真正物化。
    const identity = terminalIdentity(dshHome())
    let syncing = false
    async function reportAndPull() {
      if (syncing) return
      syncing = true
      try {
        await ensureEnterpriseHub(logger)
        const value = scope.get() || {}
        const response = await hubRequest('/api/register', {
          method: 'POST',
          body: JSON.stringify({
            ...identity,
            workers: identity.role === 'manager' ? {} : terminalWorkerSnapshot(value.workers || {}),
          }),
        })
        for (const command of response.commands || []) {
          try {
            const currentValue = scope.get() || {}
            const nextWorkers = applyEnterpriseCommand(currentValue.workers || {}, command)
            await scope.update({ ...currentValue, workers: nextWorkers })
            await hubRequest('/api/ack', { method: 'POST', body: JSON.stringify({ commandId: command.id, result: '成功' }) })
          } catch (error) {
            await hubRequest('/api/ack', { method: 'POST', body: JSON.stringify({ commandId: command.id, result: `失败：${error.message}` }) }).catch(() => {})
          }
        }
      } catch (error) {
        logger?.warn(`kaiwu-praxis: enterprise sync failed: ${(error && error.message) || error}`)
      } finally {
        syncing = false
      }
    }
    const timer = setInterval(reportAndPull, 3000)
    timer.unref?.()
    setTimeout(reportAndPull, 400).unref?.()
    sctx.effect?.(() => () => clearInterval(timer), 'kaiwu-praxis: enterprise terminal sync')
  })
}
