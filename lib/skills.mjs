/**
 * kaiwu-praxis / skills.mjs
 * 把三个「数字员工通用能力」的能力内核（SOP）注册为运行时技能。
 *
 * 用法：在 agent preset 的 agent.cordis.yml 里挂载本插件并指定 `skill`：
 *   config:
 *     skill: research | competitor | content
 * 每个 preset 只注册自己的那一个技能，做到「每个员工一个技能」。
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

export const name = 'kaiwu-praxis-skills'

/** 技能注册服务（host 提供，按 scope 分层）。 */
export const inject = ['skills']

const HERE = dirname(fileURLToPath(import.meta.url))

const DEFINITIONS = {
  research: {
    name: 'kaiwu-research',
    description: '企业情报采集 SOP：多源交叉验证、可信度分级、结构化情报简报',
    whenToUse:
      '当需要采集公网行业动态、竞品情报、技术趋势，或产出带来源引用、可信度分级的情报简报时使用',
    file: 'research.md',
  },
  competitor: {
    name: 'kaiwu-competitor',
    description: '竞品分析 SOP：三维拆解、差异化定位、对比原则、TCO 分析',
    whenToUse:
      '当需要研究竞争格局、做竞品对比、输出差异化话术或 TCO 分析报告时使用',
    file: 'competitor.md',
  },
  content: {
    name: 'kaiwu-content',
    description: '内容创作 SOP：70/30 原则、E-E-A-T、质量评分卡、人工校验',
    whenToUse:
      '当需要撰写营销文案、技术博客、行业方案、QA 或社媒短文案等可验证内容时使用',
    file: 'content.md',
  },
  docbutler: {
    name: 'kaiwu-docbutler',
    description: '资料管家 SOP：资质分类归档（9 类）、到期预警、投标资料清单',
    whenToUse:
      '当需要整理政企投标资料、分类归档证书/资质、校验有效期或生成投标资料清单时使用',
    file: 'docbutler.md',
  },
}

export function apply(ctx, config = {}) {
  const key = config && config.skill
  const def = DEFINITIONS[key]
  if (def === undefined) {
    throw new Error(
      `kaiwu-praxis-skills: config.skill 必须是 ${Object.keys(DEFINITIONS).join(' / ')} 之一`,
    )
  }
  const content = readFileSync(join(HERE, '..', 'skills', def.file), 'utf8')
  ctx.skills.register({
    name: def.name,
    description: def.description,
    whenToUse: def.whenToUse,
    content,
    source: 'kaiwu-praxis',
  })
}
