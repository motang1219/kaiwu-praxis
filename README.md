# kaiwu-praxis · 开物 Praxis

一个 DeepSeek Harness（DSH）插件：把「数字员工」带进 DSH。

装完启动 web 后，**启动页即见数字员工广场** —— 点一位员工，就以它专属的工具与 SOP 开始新会话；同时插件还注册 4 个本地确定性文件工具（A 层）。

## 5 位数字员工

| 员工 | preset id | 定位 |
| --- | --- | --- |
| 水印工具 | `kaiwu-watermark` | 批量给 PDF / 图片加水印，本地零联网（资料防泄密、客户方案外发） |
| 资料管家 | `kaiwu-docbutler` | 政企投标资料整理：自动分类资质、到期预警、生成投标资料清单 |
| 内容撰稿员 | `kaiwu-content` | 按产品 / 活动 / 受众一键出多版可用营销文案 |
| 竞品分析员 | `kaiwu-competitor` | 竞品套餐 / 方案盯防：检索并带来源汇总友商动态、做对比表 |
| 情报采集员 | `kaiwu-research` | 区域 / 行业 / 客户公开情报汇总成简报 |

## 4 个文件工具（A 层）

- `batch_rename` —— 批量重命名（前缀 / 后缀 / 序号）
- `format_convert` —— 图片格式互转（png / jpg / webp / avif / tiff）
- `watermark` —— PDF / 图片加水印，可选打包 ZIP
- `file_classify` —— 文件自动分类，可选归档

工具全部本地确定性执行，不依赖模型推理，结果可复现。

## 安装

`dsh plugin` 会转发给 pnpm，可从 GitHub 或本地安装：

```bash
# 从 GitHub 安装到某个 profile
dsh plugin --profile <profile> add git+https://github.com/motang1219/kaiwu-praxis.git

# 本地链接开发
dsh plugin --profile <profile> add link:<本仓库绝对路径>
```

装完启动该 profile 的 web 即可看到广场；5 个预设会在首次加载时自动播种到 `~/.dsh/.agent-presets/`。

## 目录结构

```
kaiwu-praxis/
├── package.json          # dsh.bundle.patch + dsh.client + 依赖
├── cordis.patch.yml      # 把 host 插件 kaiwu-praxis 挂进组合
├── lib/
│   ├── index.js          # host 插件：注册 A 层工具 + 播种 presets
│   ├── client.js         # 客户端自注册 bundle：数字员工广场 UI（免构建）
│   ├── files-tools.mjs   # 4 个 A 层文件工具
│   ├── watermark-core.mjs
│   ├── classify-core.mjs
│   └── skills.mjs
└── presets/
    └── kaiwu-{watermark,docbutler,content,competitor,research}/
        ├── agent.cordis.yml
        ├── preset.yml
        └── skills/<name>/SKILL.md
```

## 说明

- 客户端 `lib/client.js` 是手写的「自注册 bundle」（`window.__ModuleLoader__.load`），**无需打包步骤**，直接作为 `exports["./client"]` 下发。
- 广场注册到启动区槽位 `conversation.hero.agentPreset`，点员工即对该预设开新会话。
- 预设根走用户根 `~/.dsh/.agent-presets/`（插件无法通过配置新增系统预设根），由 host 插件幂等播种。

## License

MIT
