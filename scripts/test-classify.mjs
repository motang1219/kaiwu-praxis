// 测试资料管家：生成带标题的资质文档（内容含分类依据 + 到期时间），再跑分类 + 到期预警 + 清单
import { promises as fs } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { classifyDirectory } from '../lib/classify-core.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const fixtures = join(HERE, '..', 'test', 'fixtures')
await fs.mkdir(fixtures, { recursive: true })

const now = new Date()
const d = (days) => {
  const t = new Date(now)
  t.setDate(t.getDate() + days)
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

const files = [
  ['ISO27001信息安全管理体系认证证书.txt', `体系认证证书\nISO 27001 信息安全管理体系认证\n有效期至 ${d(120)}`],
  ['ISO9001质量管理体系认证证书.txt', `体系认证证书\nISO 9001 质量管理体系认证\n有效期至 ${d(-30)}`],
  ['软件著作权登记证书.txt', '软件著作权登记证书\n登记号 2026SR0123456\n长期有效'],
  ['发明专利证书.txt', `发明专利证书\n专利名称：一种…\n有效期至 ${d(400)}`],
  ['开户许可证.txt', '开户许可证\n开户银行：中国工商银行\n长期有效'],
  ['商标注册证.txt', `商标注册证\n注册商标「开物」\n有效期至 ${d(45)}`],
  ['营业执照.txt', '营业执照\n统一社会信用代码 91330100MA2KX12345\n营业期限：长期'],
  ['财务报表_2025年度.txt', '财务报表\n2025 年度审计报告'],
  ['完税证明.txt', `完税证明\n纳税年度 2025\n有效期至 ${d(180)}`],
  ['获奖证书.txt', `获奖证书\n荣誉「年度优秀产品」\n有效期至 ${d(200)}`],
]
for (const [name, body] of files) {
  await fs.writeFile(join(fixtures, name), body, 'utf8')
}
console.log(`已生成 ${files.length} 个测试文档到 ${fixtures}\n`)

const result = await classifyDirectory(fixtures)
console.log('==== 分类结果 ====')
for (const it of result.items) {
  const day = it.daysLeft == null ? '' : `（${it.status === '已过期' ? '超期 ' + -it.daysLeft : it.daysLeft} 天）`
  console.log(`[${it.category}] ${it.file} —— ${it.status}${day}`)
}
console.log('\n==== 到期预警 ====')
console.log('已过期:', result.expired.map((i) => i.file).join('、') || '无')
console.log('即将到期:', result.expiring.map((i) => i.file).join('、') || '无')
console.log('\n==== 缺类目 ====')
console.log(result.missing.join('、') || '无（9 类齐全）')
console.log('\n==== 汇总 ====')
console.log(JSON.stringify(result.checklist, null, 2))
