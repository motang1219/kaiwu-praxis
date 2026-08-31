// kaiwu-praxis host 插件：注册 A 层文件工具，并把 5 个数字员工预设播种到用户预设根。
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { cp, access, mkdir } from 'node:fs/promises'
import { apply as applyFilesTools } from './files-tools.mjs'
import { apply as applyAdmin } from './admin.mjs'

export const name = 'kaiwu-praxis'
export const inject = ['tools']

const HERE = dirname(fileURLToPath(import.meta.url))
const PRESET_IDS = ['kaiwu-watermark', 'kaiwu-docbutler', 'kaiwu-content', 'kaiwu-competitor', 'kaiwu-research']

function userPresetRoot() {
  return join(process.env.DSH_HOME ?? join(process.env.USERPROFILE ?? '', '.dsh'), '.agent-presets')
}

async function seedPresets() {
  const src = join(HERE, '..', 'presets')
  const dst = userPresetRoot()
  await mkdir(dst, { recursive: true })
  for (const id of PRESET_IDS) {
    try {
      await access(join(dst, id))
    } catch {
      await cp(join(src, id), join(dst, id), { recursive: true })
    }
  }
}

export function apply(ctx, config = {}) {
  applyFilesTools(ctx, config)
  applyAdmin(ctx, config)
  seedPresets().catch((e) => ctx.logger?.warn(`kaiwu-praxis: seed presets failed: ${(e && e.message) || e}`))
}
