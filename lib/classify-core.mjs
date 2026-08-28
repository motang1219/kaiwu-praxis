/**
 * kaiwu-praxis / classify-core.mjs
 * 资料管家核心实现（确定性分类 + 到期预警 + 投标资料清单）。
 *
 * 分类依据：文件名 + 文本内容的关键词 → 9 类资质目录。
 * 到期预警：正则提取「有效期至 / 到期日 / 截至」等日期，比对今天。
 */

import { promises as fs } from 'node:fs'
import { extname, join, resolve } from 'node:path'

export const CATEGORIES = [
  { name: '体系认证证书', keywords: ['体系认证', 'ISO', '9001', '27001', 'CMMI', '等保', '信息安全管理', '质量管理体系', '环境管理体系'] },
  { name: '专利及著作权证书', keywords: ['专利', '发明专利', '实用新型', '外观设计', '著作权', '软著', '软件著作权'] },
  { name: '开户许可证', keywords: ['开户许可', '基本存款账户', '银行开户'] },
  { name: '商标注册证', keywords: ['商标', '注册商标', '商标注册证'] },
  { name: '获奖证书', keywords: ['获奖', '荣誉', '奖项', '优秀', '奖状', '荣誉证书'] },
  { name: '营业执照', keywords: ['营业执照', '统一社会信用代码', '企业法人', '工商登记'] },
  { name: '财务报表', keywords: ['财务报表', '审计报告', '资产负债表', '利润表', '现金流量表', '年度财务'] },
  { name: '完税证明', keywords: ['完税', '纳税', '缴税', '完税证明', '税收'] },
  { name: '人员资料', keywords: ['身份证', '学历', '学位', '简历', '职称', '职业资格', '劳动合同', '人员'] },
]

const TEXT_EXTS = new Set(['txt', 'md', 'csv', 'json', 'text'])
const LONG_TERM = /长期|长期有效|永久|无固定期限/
// 覆盖「有效期至 2026-12-31」「有效期 2026/12/31」「到期日 2026年12月31日」等
const DATE_RE = /(?:有效期至|有效期|到期日|截止日期|截至)\s*[：:]?\s*(\d{4})\s*[年\/\-.]\s*(\d{1,2})\s*[月\/\-.]\s*(\d{1,2})\s*日?/g

function classifyText(text) {
  const t = String(text).toLowerCase()
  for (const cat of CATEGORIES) {
    for (const kw of cat.keywords) {
      if (t.includes(kw.toLowerCase())) return cat.name
    }
  }
  return null
}

function expiryInfo(text, now) {
  if (LONG_TERM.test(text)) return { daysLeft: null, status: '长期有效' }
  let latest = null
  for (const m of text.matchAll(DATE_RE)) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    if (!latest || d > latest) latest = d
  }
  if (!latest) return { daysLeft: null, status: '未识别到有效期' }
  const daysLeft = Math.ceil((latest - now) / 86400000)
  return { daysLeft, status: daysLeft < 0 ? '已过期' : daysLeft <= 90 ? '即将到期' : '有效' }
}

/** 分析目录下的文件：分类 + 到期状态 + 缺失类目 + 清单。 */
export async function classifyDirectory(directory) {
  const dir = resolve(directory)
  const now = new Date()
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const items = []
  for (const f of entries) {
    if (!f.isFile()) continue
    const ext = extname(f.name).slice(1).toLowerCase()
    let content = ''
    if (TEXT_EXTS.has(ext)) {
      try {
        content = await fs.readFile(join(dir, f.name), 'utf8')
      } catch {
        /* 二进制或不可读：仅用文件名 */
      }
    }
    const haystack = `${f.name} ${content}`
    const ei = expiryInfo(content || f.name, now)
    items.push({
      file: f.name,
      category: classifyText(haystack) ?? '未分类',
      daysLeft: ei.daysLeft,
      status: ei.status,
    })
  }

  const found = new Set(items.map((i) => i.category))
  const missing = CATEGORIES.map((c) => c.name).filter((n) => !found.has(n))
  const expired = items.filter((i) => i.status === '已过期')
  const expiring = items.filter((i) => i.status === '即将到期')

  return {
    directory: dir,
    items,
    expired,
    expiring,
    missing,
    checklist: {
      total: items.length,
      categorized: items.filter((i) => i.category !== '未分类').length,
      expiredCount: expired.length,
      expiringCount: expiring.length,
      missingCount: missing.length,
    },
  }
}

/** 把文件移动到 <dir>/分类归档/<类目>/ 子目录（可选归档）。 */
export async function archiveIntoCategories(directory, items) {
  const dir = resolve(directory)
  const base = join(dir, '分类归档')
  await fs.mkdir(base, { recursive: true })
  const moved = []
  for (const it of items) {
    if (it.category === '未分类') continue
    const catDir = join(base, it.category)
    await fs.mkdir(catDir, { recursive: true })
    await fs.rename(join(dir, it.file), join(catDir, it.file))
    moved.push({ file: it.file, category: it.category })
  }
  return { base, moved, count: moved.length }
}
