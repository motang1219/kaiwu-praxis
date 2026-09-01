/**
 * kaiwu-praxis / files-tools.mjs
 * 开物 Praxis P0 —— A 层确定性文件工具（本地运行，零联网）。
 *
 *   - batch_rename     批量重命名（加前缀 / 加后缀 / 按序号）
 *   - format_convert   图片格式转换（png/jpg/webp/avif/tiff）
 *   - watermark        PDF / 图片批量加水印（3 行 30° 半透明灰，可选 ZIP）
 *   - file_classify    资质文件分类归档 + 到期预警 + 投标资料清单
 *
 * 核心逻辑在 watermark-core.mjs / classify-core.mjs，本文件只做工具注册，
 * 并在 execute 里动态 import 核心，避免某个依赖缺失拖垮整个插件。
 */

import { promises as fs } from 'node:fs'
import { stat } from 'node:fs/promises'
import { basename, dirname, extname, join, resolve } from 'node:path'

export const name = 'kaiwu-praxis-files-tools'
export const inject = ['tools']

const INPUT_FORMATS = new Set(['png', 'jpg', 'jpeg', 'webp', 'avif', 'tiff', 'gif'])
const OUTPUT_FORMATS = new Set(['png', 'jpg', 'jpeg', 'webp', 'avif', 'tiff'])

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  return entries.filter((e) => e.isFile()).map((e) => e.name)
}

function normalizeFormat(format) {
  return format === 'jpg' ? 'jpeg' : format
}

export function apply(ctx, config = {}) {
  // ── 1. 批量重命名 ─────────────────────────────────────────────────────
  ctx.tools.register({
    name: 'batch_rename',
    description:
      '批量重命名目录下的文件。支持三种模式：prefix（加前缀）、suffix（加后缀）、number（按序号重命名）。纯本地操作，零联网。',
    parameters: {
      type: 'object',
      properties: {
        directory: { type: 'string', description: '要处理的目录的绝对路径' },
        mode: { type: 'string', enum: ['prefix', 'suffix', 'number'], description: 'prefix=加前缀，suffix=加后缀，number=按序号' },
        text: { type: 'string', description: 'prefix/suffix 模式下要添加的文字' },
        start: { type: 'integer', description: 'number 模式的起始序号，默认 1' },
        digits: { type: 'integer', description: 'number 模式的序号位数（补零），默认 3' },
        filter: { type: 'string', description: '可选：只处理文件名包含此子串的文件' },
        dryRun: { type: 'boolean', description: '为 true 时只预览，不真正改名' },
      },
      required: ['directory', 'mode'],
      additionalProperties: false,
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          renamed: {
            type: 'array',
            items: { type: 'object', additionalProperties: false, properties: { from: { type: 'string' }, to: { type: 'string' } }, required: ['from', 'to'] },
          },
          count: { type: 'integer' },
          dryRun: { type: 'boolean' },
        },
        required: ['renamed', 'count', 'dryRun'],
      },
      render: (_args, value) => {
        const head = value.dryRun ? '【预览】将重命名' : '【已完成】重命名'
        const lines = value.renamed.map((r) => `  ${r.from} → ${r.to}`)
        return [{ type: 'text', text: `${head} ${value.count} 个文件：\n${lines.join('\n')}` }]
      },
    },
    async execute(args) {
      const dir = resolve(args.directory)
      const mode = args.mode
      const dryRun = args.dryRun === true
      let names = await listFiles(dir)
      if (typeof args.filter === 'string' && args.filter.length > 0) names = names.filter((n) => n.includes(args.filter))
      names.sort()
      const start = Number.isInteger(args.start) ? args.start : 1
      const digits = Number.isInteger(args.digits) ? args.digits : 3
      const renamed = []
      let index = 0
      for (const name of names) {
        const ext = extname(name)
        const stem = basename(name, ext)
        let newStem
        if (mode === 'prefix') newStem = `${args.text ?? ''}${stem}`
        else if (mode === 'suffix') newStem = `${stem}${args.text ?? ''}`
        else newStem = String(start + index).padStart(digits, '0')
        const to = `${newStem}${ext}`
        if (to === name) continue
        renamed.push({ from: name, to })
        if (!dryRun) await fs.rename(join(dir, name), join(dir, to))
        index += 1
      }
      return { renamed, count: renamed.length, dryRun }
    },
  })

  // ── 2. 图片格式转换 ───────────────────────────────────────────────────
  ctx.tools.register({
    name: 'format_convert',
    description: '图片格式转换：把 png/jpg/webp/avif/tiff 在目标格式之间互转，支持单文件或整目录批量转换。',
    parameters: {
      type: 'object',
      properties: {
        source: { type: 'string', description: '输入文件或目录的绝对路径' },
        targetFormat: { type: 'string', enum: ['png', 'jpg', 'webp', 'avif', 'tiff'], description: '目标格式' },
        outputDir: { type: 'string', description: '输出目录；缺省为源文件所在目录' },
        quality: { type: 'integer', description: '有损格式（jpg/webp/avif）质量 1-100，默认 85' },
      },
      required: ['source', 'targetFormat'],
      additionalProperties: false,
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          converted: {
            type: 'array',
            items: { type: 'object', additionalProperties: false, properties: { from: { type: 'string' }, to: { type: 'string' } }, required: ['from', 'to'] },
          },
          count: { type: 'integer' },
          format: { type: 'string' },
        },
        required: ['converted', 'count', 'format'],
      },
      render: (_args, value) => {
        const lines = value.converted.map((c) => `  ${c.from} → ${c.to}`)
        return [{ type: 'text', text: `已转换 ${value.count} 个文件为 ${value.format}：\n${lines.join('\n')}` }]
      },
    },
    async execute(args) {
      const { default: sharp } = await import('sharp')
      const src = resolve(args.source)
      const targetFormat = normalizeFormat(args.targetFormat)
      const quality = Number.isInteger(args.quality) ? Math.min(100, Math.max(1, args.quality)) : 85
      const info = await stat(src)
      const isDir = info.isDirectory()
      const outDir = typeof args.outputDir === 'string' && args.outputDir.length > 0 ? resolve(args.outputDir) : isDir ? src : dirname(src)
      const inputDir = isDir ? src : dirname(src)
      const inputs = isDir ? (await listFiles(src)).filter((f) => INPUT_FORMATS.has(extname(f).slice(1).toLowerCase())) : [basename(src)]
      const converted = []
      for (const name of inputs) {
        const inExt = extname(name).slice(1).toLowerCase()
        if (!INPUT_FORMATS.has(inExt)) continue
        const outName = `${basename(name, extname(name))}.${args.targetFormat === 'jpg' ? 'jpg' : args.targetFormat}`
        const outPath = join(outDir, outName)
        const opts = ['jpeg', 'webp', 'avif'].includes(targetFormat) ? { quality } : {}
        await sharp(join(inputDir, name)).toFormat(targetFormat, opts).toFile(outPath)
        converted.push({ from: name, to: outName })
      }
      return { converted, count: converted.length, format: args.targetFormat }
    },
  })

  // ── 3. PDF/图片批量加水印 ──────────────────────────────────────────────
  ctx.tools.register({
    name: 'watermark',
    description:
      '批量给 PDF / 图片加水印（本地零联网）：3 行文字、30° 倾斜、半透明灰，输出带水印副本，可选打包 ZIP。',
    parameters: {
      type: 'object',
      properties: {
        directory: { type: 'string', description: '待加水印文件所在目录的绝对路径' },
        text: { type: 'string', description: '水印文字，可用换行分隔多行；缺省为「常青云 / 内部资料 · 请勿外传 / 日期」' },
        outputDir: { type: 'string', description: '输出目录；缺省为 <目录>/watermarked' },
        zip: { type: 'boolean', description: '是否额外打包 ZIP，默认 false' },
      },
      required: ['directory'],
      additionalProperties: false,
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          outputDir: { type: 'string' },
          count: { type: 'integer' },
          results: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { from: { type: 'string' }, to: { type: 'string' }, ok: { type: 'boolean' }, error: { type: 'string' } }, required: ['from', 'ok'] } },
          zip: { type: 'string' },
        },
        required: ['outputDir', 'count', 'results'],
      },
      render: (_args, value) => {
        const lines = value.results.map((r) => (r.ok ? `  ✓ ${r.from}` : `  ✗ ${r.from}（${r.error}）`))
        const zip = value.zip ? `\n已打包：${value.zip}` : ''
        return [{ type: 'text', text: `已加水印 ${value.count} 个文件，输出到 ${value.outputDir}\n${lines.join('\n')}${zip}` }]
      },
    },
    async execute(args) {
      const { watermarkDirectory } = await import('./watermark-core.mjs')
      const result = await watermarkDirectory(args.directory, args.text, args.outputDir)
      if (args.zip === true) {
        const { zipSync } = await import('fflate')
        const names = (await listFiles(result.outputDir)).filter((n) => !n.toLowerCase().endsWith('.zip'))
        const files = {}
        for (const n of names) files[n] = await fs.readFile(join(result.outputDir, n))
        if (names.length > 0) {
          const zipPath = join(result.outputDir, '水印副本.zip')
          await fs.writeFile(zipPath, zipSync(files))
          result.zip = zipPath
        }
      }
      return result
    },
  })

  // ── 4. 资质文件分类归档 + 到期预警 + 资料清单 ─────────────────────────
  ctx.tools.register({
    name: 'file_classify',
    description:
      '按 9 类资质目录自动分类文件、校验有效期并到期预警、生成投标资料清单；可选把文件移动到「分类归档/<类目>/」子目录。',
    parameters: {
      type: 'object',
      properties: {
        directory: { type: 'string', description: '待分类文件所在目录的绝对路径' },
        archive: { type: 'boolean', description: '是否把文件移动到分类子目录归档，默认 false（仅报告）' },
      },
      required: ['directory'],
      additionalProperties: false,
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          directory: { type: 'string' },
          items: { type: 'array', items: { type: 'object' } },
          expired: { type: 'array', items: { type: 'object' } },
          expiring: { type: 'array', items: { type: 'object' } },
          missing: { type: 'array', items: { type: 'string' } },
          checklist: { type: 'object' },
          archived: { type: 'object' },
        },
        required: ['directory', 'items', 'expired', 'expiring', 'missing', 'checklist'],
      },
      render: (_args, value) => {
        const rows = value.items.map((i) => {
          const day = i.daysLeft == null ? '' : i.status === '已过期' ? `（超期 ${-i.daysLeft} 天）` : i.status === '长期有效' ? '' : `（${i.daysLeft} 天）`
          return `  [${i.category}] ${i.file} —— ${i.status}${day}`
        })
        const ck = value.checklist
        const expired = value.expired.length ? `\n⚠ 已过期：${value.expired.map((i) => i.file).join('、')}` : ''
        const expiring = value.expiring.length ? `\n⚠ 即将到期：${value.expiring.map((i) => i.file).join('、')}` : ''
        const missing = value.missing.length ? `\n缺类目：${value.missing.join('、')}` : ''
        const archived = value.archived ? `\n已归档 ${value.archived.count} 个文件到 ${value.archived.base}` : ''
        return [{ type: 'text', text: `资料分类（共 ${ck.total} 个，已分类 ${ck.categorized}，过期 ${ck.expiredCount}，临期 ${ck.expiringCount}，缺 ${ck.missingCount} 类）\n${rows.join('\n')}${expired}${expiring}${missing}${archived}` }]
      },
    },
    async execute(args) {
      const { classifyDirectory, archiveIntoCategories } = await import('./classify-core.mjs')
      const result = await classifyDirectory(args.directory)
      if (args.archive === true) result.archived = await archiveIntoCategories(args.directory, result.items)
      return result
    },
  })
}
