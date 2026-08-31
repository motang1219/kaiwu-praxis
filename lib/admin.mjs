/**
 * kaiwu-praxis / admin.mjs
 * 粗糙管理端的数据层：
 *   - 注册 settings 命名空间 `kaiwu-praxis`（客户端通过 api.settings 读写）
 *   - 首次运行时把 4 个员工的真实技能（preset 目录里的 SKILL.md）播种进设置
 *   - watch 设置变更，把「资料 / SOP」物化为 preset 目录下的 md 文件
 *     （技能保持只读，仍由各员工自己的 dsh-skill-filesystem 加载）
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import z from '@deepseek-ai/schemastery'

export const name = 'kaiwu-praxis-admin'

const NS = 'kaiwu-praxis'
const HERE = dirname(fileURLToPath(import.meta.url))
const SHIPPED_PRESETS = join(HERE, '..', 'presets')

const WORKER_IDS = ['kaiwu-watermark', 'kaiwu-docbutler', 'kaiwu-content', 'kaiwu-competitor', 'kaiwu-research']

const DocSchema = z.object({
  name: z.string().default(''),
  content: z.string().default(''),
})
const SkillSchema = z.object({
  name: z.string().default(''),
  description: z.string().default(''),
  content: z.string().default(''),
})
const WorkerSchema = z.object({
  knowledge: z.array(DocSchema).default([]),
  sops: z.array(DocSchema).default([]),
  skills: z.array(SkillSchema).default([]),
})
const AdminSchema = z.object({
  workers: z.dict(WorkerSchema).default({}),
})

function userPresetRoot() {
  return join(process.env.DSH_HOME ?? join(process.env.USERPROFILE ?? '', '.dsh'), '.agent-presets')
}

function sanitizeName(name) {
  const cleaned = String(name || '').replace(/[\\/:*?"<>|]/g, '_').trim()
  return cleaned === '' ? 'untitled' : cleaned
}

function parseSkill(raw) {
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
  return { name, description, content: raw }
}

/** 读取一个员工当前生效的技能（用户根优先，回退到随包 presets）。 */
function readSkillsFor(workerId) {
  const roots = [join(userPresetRoot(), workerId, 'skills'), join(SHIPPED_PRESETS, workerId, 'skills')]
  for (const root of roots) {
    try {
      if (!existsSync(root)) continue
      const dirs = readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory())
      if (dirs.length === 0) continue
      const skills = []
      for (const dir of dirs) {
        const file = join(root, dir.name, 'SKILL.md')
        if (existsSync(file)) skills.push(parseSkill(readFileSync(file, 'utf8')))
      }
      if (skills.length > 0) return skills
    } catch {
      // 读失败就试下一个根
    }
  }
  return []
}

function seededWorkers() {
  const workers = {}
  for (const id of WORKER_IDS) {
    workers[id] = {
      knowledge: [],
      sops: [],
      skills: readSkillsFor(id),
    }
  }
  return workers
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

async function materialize(workers) {
  const root = userPresetRoot()
  for (const id of WORKER_IDS) {
    const worker = workers[id] || { knowledge: [], sops: [] }
    await syncDocDir(join(root, id, 'knowledge'), worker.knowledge)
    await syncDocDir(join(root, id, 'sop'), worker.sops)
  }
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

    // 首次运行：用户层没有数据时，写入技能种子（资料/SOP 为空）。
    const current = scope.get()
    const hasData = current && current.workers && Object.keys(current.workers).length > 0
    if (!hasData) {
      scope.update({ workers: seededWorkers() }).catch((e) => {
        logger?.warn(`kaiwu-praxis: seed admin settings failed: ${(e && e.message) || e}`)
      })
    } else {
      // 已有数据也物化一次，保证文件与设置一致（例如手动改过设置文件）。
      materialize(current.workers).catch((e) => {
        logger?.warn(`kaiwu-praxis: initial materialize failed: ${(e && e.message) || e}`)
      })
    }
  })
}
