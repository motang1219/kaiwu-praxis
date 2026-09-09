import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const root = await mkdtemp(join(tmpdir(), 'kaiwu-tool-policy-'))
const workerId = 'test-worker'
const preset = join(root, '.agent-presets', workerId)
await mkdir(preset, { recursive: true })
await writeFile(join(preset, 'capabilities.json'), JSON.stringify({
  disabledTools: ['read', 'write', 'edit', 'read_image'],
  denyGlobal: ['watermark'],
}), 'utf8')

const previousHome = process.env.DSH_HOME
process.env.DSH_HOME = root
let guard = null
let restriction = null
let cleanup = null
const fakeCtx = {
  tools: {
    guard(fn) { guard = fn; return () => { guard = null } },
    restrict(value) { restriction = value; return () => { restriction = null } },
  },
  effect(fn) { cleanup = fn() },
}

const policy = await import('../lib/tool-policy.mjs')
policy.apply(fakeCtx, { workerId })
if (!guard || !guard({ name: 'read' }) || guard({ name: 'skill' }) !== undefined) throw new Error('运行时工具拦截未按策略生效')
if (!restriction || restriction.deny[0] !== 'watermark') throw new Error('全局工具可见性限制未生效')
cleanup()
if (previousHome === undefined) delete process.env.DSH_HOME
else process.env.DSH_HOME = previousHome
await rm(root, { recursive: true, force: true })
console.log(JSON.stringify({ blocked: ['read', 'write', 'edit', 'read_image'], allowed: 'skill', deniedGlobal: 'watermark' }))
