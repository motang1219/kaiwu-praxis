/**
 * kaiwu-praxis / watermark-core.mjs
 * 水印核心实现（本地零联网）：
 *   - 图片：sharp + SVG 叠加「3 行 30° 半透明灰」水印
 *   - PDF：pdf-lib 每页绘制旋转半透明文字（中文嵌系统字体，找不到则回退 ASCII）
 */

import { promises as fs } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import sharp from 'sharp'
import { PDFDocument, rgb, degrees } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp', 'tiff'])
const PDF_EXTS = new Set(['pdf'])

// pdf-lib 只支持 ttf/otf，不支持 ttc；候选里都是单字重 ttf
const CHINESE_FONT_CANDIDATES = [
  'C:/Windows/Fonts/simhei.ttf',
  'C:/Windows/Fonts/simfang.ttf',
  'C:/Windows/Fonts/simkai.ttf',
  'C:/Windows/Fonts/STSONG.TTF',
]

function defaultLines(text) {
  if (typeof text === 'string' && text.trim().length > 0) {
    return text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).slice(0, 6)
  }
  const d = new Date()
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return ['常青云', '内部资料 · 请勿外传', stamp]
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function loadChineseFontBytes() {
  for (const p of CHINESE_FONT_CANDIDATES) {
    try {
      return await readFile(p)
    } catch {
      /* 尝试下一个 */
    }
  }
  return null
}

/** 给一张图片加水印，输出到 outputPath，返回 outputPath。 */
export async function watermarkImage(inputPath, outputPath, text) {
  const lines = defaultLines(text)
  const meta = await sharp(inputPath).metadata()
  const W = meta.width || 800
  const H = meta.height || 600
  const fontSize = Math.max(14, Math.round(Math.min(W, H) * 0.08))
  const lineHeight = fontSize * 1.3
  const y0 = -((lines.length - 1) * lineHeight) / 2
  const textNodes = lines
    .map((line, i) => {
      const y = y0 + i * lineHeight
      return `<text x="0" y="${y.toFixed(1)}">${escapeXml(line)}</text>`
    })
    .join('')
  const svg =
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">` +
    `<g transform="translate(${W / 2},${H / 2}) rotate(-30)" fill="rgba(120,120,120,0.35)" ` +
    `font-family="sans-serif" font-size="${fontSize}" font-weight="700" text-anchor="middle">` +
    textNodes +
    `</g></svg>`
  // 先把 SVG 水印栅格化为带明确色彩空间的 PNG 覆盖层，避免部分图片
  // 在 libvips 合成时出现 “colourspace: parameter space not set”。
  const overlay = await sharp(Buffer.from(svg)).png().toBuffer()
  await sharp(inputPath)
    .composite([{ input: overlay, blend: 'over' }])
    .toFile(outputPath)
  return outputPath
}

/** 给一个 PDF 每页加水印，输出到 outputPath，返回 outputPath。 */
export async function watermarkPdf(inputPath, outputPath, text) {
  const lines = defaultLines(text)
  const bytes = await readFile(inputPath)
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false })
  pdf.registerFontkit(fontkit)
  const pages = pdf.getPages()

  let font = null
  const cnFont = await loadChineseFontBytes()
  if (cnFont) {
    try {
      font = await pdf.embedFont(cnFont)
    } catch {
      font = null
    }
  }
  if (!font) font = await pdf.embedFont('Helvetica') // ASCII 回退

  for (const page of pages) {
    const { width, height } = page.getSize()
    const fontSize = Math.max(12, Math.round(Math.min(width, height) * 0.06))
    const lineHeight = fontSize * 1.4
    page.drawText(lines.join('\n'), {
      x: width / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(0.45, 0.45, 0.45),
      opacity: 0.35,
      rotate: degrees(-30),
      lineHeight,
    })
  }
  await writeFile(outputPath, await pdf.save())
  return outputPath
}

/** 批量处理目录下的图片与 PDF，输出到 outputDir（缺省 <dir>/watermarked）。 */
export async function watermarkDirectory(directory, text, outputDir) {
  const dir = resolve(directory)
  const outDir = outputDir ? resolve(outputDir) : join(dir, 'watermarked')
  await fs.mkdir(outDir, { recursive: true })
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const results = []
  for (const f of entries) {
    if (!f.isFile()) continue
    const ext = extname(f.name).slice(1).toLowerCase()
    const inputPath = join(dir, f.name)
    const outputPath = join(outDir, f.name)
    try {
      if (IMAGE_EXTS.has(ext)) await watermarkImage(inputPath, outputPath, text)
      else if (PDF_EXTS.has(ext)) await watermarkPdf(inputPath, outputPath, text)
      else continue
      results.push({ from: f.name, to: f.name, ok: true })
    } catch (e) {
      results.push({ from: f.name, ok: false, error: String((e && e.message) || e) })
    }
  }
  return { outputDir: outDir, results, count: results.filter((r) => r.ok).length }
}
