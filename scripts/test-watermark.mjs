// 测试水印工具：对「文档」目录里的 PDF 与图片加水印，输出到 test/output-watermark
import { watermarkDirectory } from '../lib/watermark-core.mjs'

const result = await watermarkDirectory(
  'E:/杰创实习/数字员工/文档',
  '常青云\n内部资料 · 请勿外传\n仅供测试',
  'E:/杰创实习/数字员工/kaiwu-praxis/test/output-watermark',
)
console.log(JSON.stringify(result, null, 2))
