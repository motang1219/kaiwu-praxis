/** 每个数字员工的实时工具权限层。 */
import { watch } from 'node:fs'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const name = 'kaiwu-praxis-tool-policy'
export const inject = ['tools']

function policyPath(workerId) {
  const home = process.env.DSH_HOME ?? join(process.env.USERPROFILE ?? '', '.dsh')
  return join(home, '.agent-presets', workerId, 'capabilities.json')
}

export function apply(ctx, config = {}) {
  const workerId = String(config.workerId || '')
  if (!workerId) return
  const file = policyPath(workerId)
  let disabled = new Set()
  let disposeRestriction = null

  function reload() {
    try {
      const policy = JSON.parse(readFileSync(file, 'utf8'))
      disabled = new Set(Array.isArray(policy.disabledTools) ? policy.disabledTools : [])
      if (disposeRestriction) disposeRestriction()
      disposeRestriction = null
      if (Array.isArray(policy.denyGlobal) && policy.denyGlobal.length > 0) {
        disposeRestriction = ctx.tools.restrict({ deny: policy.denyGlobal })
      }
    } catch {
      disabled = new Set()
    }
  }

  reload()
  ctx.effect(() => {
    const disposeGuard = ctx.tools.guard((execution) => disabled.has(execution.name)
      ? `工具 ${execution.name} 已在员工设置中停用。`
      : undefined)
    let watcher = null
    try { watcher = watch(file, { persistent: false }, reload) } catch { /* 管理数据层稍后会补齐策略文件 */ }
    return () => {
      if (watcher) watcher.close()
      disposeGuard()
      if (disposeRestriction) disposeRestriction()
    }
  }, `kaiwu tool policy: ${workerId}`)
}
