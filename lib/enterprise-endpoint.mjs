/**
 * 企业终端代理的最小通信层。
 * 员工端只负责向企业中枢注册、拉取指令，不在本地启动管理服务。
 */
import { hostname } from 'node:os'
import { basename } from 'node:path'

const HUB_HOST = '127.0.0.1'
const HUB_PORT = Number(process.env.KAIWU_ENTERPRISE_HUB_PORT || 3099)
const HUB_URL = `http://${HUB_HOST}:${HUB_PORT}`
const VERSION = '0.4.0'

export function terminalIdentity(dshHome) {
  const profile = basename(dshHome) || 'dsh'
  const portArg = process.argv.findIndex((value) => value === '--port')
  const port = portArg >= 0 ? process.argv[portArg + 1] : ''
  return {
    id: `${hostname()}-${profile}`.toLowerCase(),
    name: port ? `${profile} · ${port}` : profile,
    port: port ? Number(port) : 0,
    role: 'endpoint',
    version: VERSION,
  }
}

export async function hubRequest(path, options = {}) {
  const response = await fetch(`${HUB_URL}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(options.headers || {}) },
  })
  if (!response.ok) throw new Error(`enterprise hub ${response.status}`)
  return response.json()
}

export { HUB_URL }
