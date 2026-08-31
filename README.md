# kaiwu-praxis · 开物 Praxis

一个 DeepSeek Harness（DSH）插件：把「数字员工」带进 DSH。

安装并启动 web 后，侧边栏会出现「数字员工广场」入口；点进去选择一位员工，即以它专属的工具与 SOP 开始新会话。插件同时注册 4 个本地确定性文件工具（A 层），并提供一个粗糙版「管理端」用于维护每位员工的资料 / 技能 / SOP。

## 5 位数字员工

| 员工 | preset id | 定位 | 技能 |
| --- | --- | --- | --- |
| 水印工具 | `kaiwu-watermark` | 批量给 PDF / 图片加水印，本地零联网（资料防泄密、客户方案外发） | `kaiwu-watermark` |
| 资料管家 | `kaiwu-docbutler` | 政企投标资料整理：自动分类资质、到期预警、生成投标资料清单 | `kaiwu-docbutler` |
| 内容撰稿员 | `kaiwu-content` | 按产品 / 活动 / 受众一键出多版可用营销文案 | `kaiwu-content` |
| 竞品分析员 | `kaiwu-competitor` | 竞品套餐 / 方案盯防：检索并带来源汇总友商动态、做对比表 | `kaiwu-competitor` |
| 情报采集员 | `kaiwu-research` | 区域 / 行业 / 客户公开情报汇总成简报 | `kaiwu-research` |

每位员工一个技能（`presets/<id>/skills/<id>/SKILL.md`），随预设一起分发；会话由该员工的 persona 主动加载并按其 SOP 工作。

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

然后启动该 profile 的 web：

```bash
dsh web --profile <profile> --port 3081
```

5 个数字员工预设会在宿主首次加载时自动播种到 `~/.dsh/.agent-presets/`（`preset.yml` / `agent.cordis.yml` / `skills/`）。

## 使用

1. **进入广场**：启动 web 后，点侧边栏的「数字员工广场」。
2. **开始会话**：点任意员工卡片，即选中该预设并开启新会话；未发消息时输入框上方会显示能力卡片，对话开始后缩为输入框上方的小头像，悬停可再次查看。
3. **管理端**：广场右上角「管理端」进入，左侧选员工，右侧三个页签：
   - **资料**：新增 / 编辑 / 删除知识文档（Markdown），自动落盘到该员工预设目录的 `knowledge/`。
   - **SOP**：新增 / 编辑 / 删除业务流程文档，自动落盘到 `sop/`。
   - **技能**：只读展示该员工随包技能全文；如需修改，点「打开预设目录」直接编辑 `SKILL.md`，重启生效。
4. 广场卡片与能力卡片上的「资料 / 技能 / SOP」数字来自管理端真实数据。

> 管理端数据存在 DSH 的 settings 命名空间 `kaiwu-praxis`（`~/.dsh/settings.yaml`），宿主会 watch 变更并把资料 / SOP 物化为预设目录下的 md 文件。

## 目录结构

```
kaiwu-praxis/
├── package.json          # dsh.bundle.patch + dsh.client + 依赖
├── cordis.patch.yml      # 把 host 插件 kaiwu-praxis 挂进组合
├── lib/
│   ├── index.js          # host 插件：注册 A 层工具 + 播种 presets + 管理端数据层
│   ├── admin.mjs         # 管理端 settings 命名空间 + 技能种子 + 文件物化
│   ├── client.js         # 客户端自注册 bundle：广场 + 管理端 + 会话能力卡片（免构建）
│   ├── files-tools.mjs   # 4 个 A 层文件工具
│   ├── watermark-core.mjs
│   └── classify-core.mjs
└── presets/
    └── kaiwu-{watermark,docbutler,content,competitor,research}/
        ├── agent.cordis.yml
        ├── preset.yml
        └── skills/<name>/SKILL.md
```

## 说明

- 客户端 `lib/client.js` 是手写的「自注册 bundle」（`window.__ModuleLoader__.load`），**无需打包步骤**，直接作为 `exports["./client"]` 下发。
- 广场是挂在 `shell.overlay` 的整页覆盖层（只覆盖主内容区，保留 DSH 原生侧边栏），由侧边栏注入的「数字员工广场」按钮驱动开合。
- 预设根走用户根 `~/.dsh/.agent-presets/`，由 host 插件幂等播种；管理端只读写这个目录下的 `knowledge/`、`sop/`，不碰其他文件。
- `@deepseek-ai/schemastery` 是可选 peerDependency，由 DSH 宿主提供。

## License

MIT
