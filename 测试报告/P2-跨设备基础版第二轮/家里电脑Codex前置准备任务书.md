# 家里电脑 Codex 前置准备任务书

## 任务目标

在家里电脑上安全地验收并启动“开物员工端”便携包，为第二轮跨设备实机测试做好准备。完成包校验、版本核对、Tailscale 基础组网检查和员工端本机启动检查后停止，不要自行注册企业终端，也不要开始批量配置测试。

本任务使用：

- 员工端：`kaiwu-praxis v0.5.0`
- 企业端中枢：`kaiwu-praxis-enterprise v0.2.0`（运行在公司电脑，不安装到家里员工端）
- 员工端默认本机端口：`3080`
- 企业中枢端口：`3099`

## 用户需要先提供给你

1. `kaiwu-praxis-portable-v0.5.0.zip`（推荐）或 `kaiwu-praxis-setup-v0.5.0.exe`。
2. 本任务书。
3. 公司电脑的 Tailscale IPv4，格式通常为 `100.x.y.z`。如果用户暂时没有该地址，可先完成本机包验收，网络检查标记为待办。

不要向用户索取或读取模型 API Key、企业管理员令牌、Tailscale 密码或 auth key。Tailscale 登录必须由用户本人在官方客户端中完成。

## 安全边界

- 只在用户指定的新目录中解压和运行，例如 `D:\kaiwu-round2-home`；先用 `Resolve-Path` 或父目录检查确认目标位置。
- 不覆盖、不删除家里电脑现有的 DSH、`.dsh`、旧便携包或模型配置。
- 不安装企业端插件；员工端包内不应出现 `kaiwu-praxis-enterprise`。
- 不启用路由器端口映射、DMZ、Tailscale Funnel 或其他公网暴露。
- 不关闭 Windows 防火墙，不创建 `RemoteAddress Any` 的宽泛入站规则。
- 不把密钥、令牌、注册码或 `.kaiwu-enterprise\terminal.json` 内容写入报告或截图。
- 任何文件删除、软件安装、管理员权限操作，都要先向用户说明具体对象并取得同意。

## 一、校验收到的文件

在包所在目录打开 PowerShell，执行：

```powershell
Get-FileHash -Algorithm SHA256 '.\kaiwu-praxis-portable-v0.5.0.zip'
```

ZIP 的预期 SHA-256：

```text
3EFC299E62FC033ADA214336683423DFFF1619E3BFEA3D5B2851CC63983DE16A
```

如果收到的是安装程序，执行：

```powershell
Get-FileHash -Algorithm SHA256 '.\kaiwu-praxis-setup-v0.5.0.exe'
```

EXE 的预期 SHA-256：

```text
D2B740C4D1895C32C286049557D73520C876AA8F9074815D6E53DD9F006BB664
```

哈希不一致时立即停止，不要运行或解压，并向用户报告实际哈希。

### 截图 A：包校验

截图需同时显示文件名和完整 SHA-256，保存为 `A-便携包哈希校验.png`。不要把无关目录、账号或其他隐私文件截进去。

## 二、解压到独立目录

ZIP 推荐流程：

1. 让用户确认一个新的目标目录，例如 `D:\kaiwu-round2-home`。
2. 创建该目录，并把 ZIP 完整解压进去。
3. 找到实际便携包根目录；其中应直接包含：

```text
app/
home/
runtime/
start.bat
```

4. 不要把 `start.bat` 单独复制到别处运行。

若使用 EXE，由用户确认解压目标后运行自解压程序。它可能在解压完成后自动启动员工端；如已启动，直接进入第四部分检查。

## 三、核对插件组成和干净状态

在便携包根目录执行以下只读检查：

```powershell
Get-Content '.\home\profiles\web\package.json' -Encoding UTF8
Get-ChildItem '.\home' -Force
```

必须确认：

- `kaiwu-praxis` 指向 `git+https://github.com/motang1219/kaiwu-praxis.git#v0.5.0`
- `@nanmicoder/dsh-agent-teams` 为 `0.1.14`
- `@vectorize-io/hindsight-coding-agents` 为 `0.4.3`
- `dsh-better-sidebar` 为 `0.17.1`
- 不包含 `kaiwu-praxis-enterprise`
- 首次启动前，`home` 顶层只有 `profiles`

不要为了“更新到最新”自行运行 `plugin add`、`npm install` 或 `pnpm install`；本轮测试必须使用已锁定和验收的包。

## 四、启动并检查员工端

先检查 `3080` 是否被占用：

```powershell
Get-NetTCPConnection -LocalPort 3080 -State Listen -ErrorAction SilentlyContinue
```

若没有输出，双击便携包根目录的 `start.bat`。浏览器未自动打开时，手动访问：

```text
http://127.0.0.1:3080
```

若 `3080` 已被占用，不要结束未知进程。改用以下方式启动在 `3085`：

```powershell
$portableRoot = (Get-Location).Path
$env:DSH_HOME = Join-Path $portableRoot 'home'
$portableNode = Join-Path $portableRoot 'runtime\node\node.exe'
$dshBin = Join-Path $portableRoot 'app\node_modules\@deepseek-ai\dsh\lib\bin.js'
& $portableNode $dshBin web --host 127.0.0.1 --port 3085 --no-open
```

首次启动时可以按界面完成内测声明，并选择“稍后配置”模型 API。模型 API 由用户本人后续填写；不要读取输入框或配置文件中的密钥。

在浏览器确认：

1. 侧边栏有“数字员工广场”。
2. 广场共有 7 名数字员工，包含品牌诊断与数据追踪两名员工（员工标识分别为 `kaiwu-brand-auditor`、`kaiwu-data-tracker`）。
3. “员工设置 → 企业连接”能够打开，状态应为“未注册”。
4. 页面中没有“企业管理”入口。

### 截图 B：员工端版本界面

截图“员工设置 → 企业连接”页面，保留左侧 7 名员工列表与右侧“未注册”状态，保存为 `B-员工端本机启动.png`。不要填写或截图注册码。

## 五、准备 Tailscale

先检查是否已经安装：

```powershell
Test-Path 'C:\Program Files\Tailscale\tailscale.exe'
```

如果未安装，告诉用户需要从 Tailscale 官方 Windows 页面安装，并在获得用户同意后再协助安装：

```text
https://tailscale.com/docs/install/windows
```

安装后，由用户本人在图形界面登录测试用 tailnet。不要代替用户处理密码、验证码或 auth key。

登录完成后执行：

```powershell
& 'C:\Program Files\Tailscale\tailscale.exe' status
& 'C:\Program Files\Tailscale\tailscale.exe' ip -4
```

记录家里电脑 Tailscale IPv4，但公开报告中可遮住最后两段。

## 六、检查到公司中枢的网络

拿到用户提供的公司电脑 Tailscale IPv4 后，将 `<COMPANY_TS_IP>` 替换为实际地址：

```powershell
& 'C:\Program Files\Tailscale\tailscale.exe' ping <COMPANY_TS_IP>
Test-NetConnection <COMPANY_TS_IP> -Port 3099
Invoke-RestMethod "http://<COMPANY_TS_IP>:3099/api/health"
```

预期结果：

- `tailscale ping` 返回 `pong`
- `TcpTestSucceeded : True`
- 健康接口返回 `ok: true`、`version: 0.2.0`

如果 `ping` 成功但端口失败，先确认公司电脑的中枢进程仍在运行。不要擅自关闭防火墙或创建宽泛规则，把完整错误交回公司电脑侧排查。

### 截图 C：跨设备前置连通

截图 `tailscale ping`、`TcpTestSucceeded : True` 和健康接口结果，保存为 `C-中枢前置连通.png`。不得包含管理员令牌。

## 七、交付结果并停止

在便携包之外建立 `家里电脑前置准备结果` 文件夹，提交：

```text
家里电脑前置准备结果/
├─ 家里电脑前置准备结果.md
├─ A-便携包哈希校验.png
├─ B-员工端本机启动.png
└─ C-中枢前置连通.png
```

结果文档至少写明：

- 使用的包名、实际 SHA-256、解压位置
- 四个插件及其版本
- 员工端实际端口和页面检查结果
- 家里电脑 Tailscale 是否在线
- `tailscale ping`、3099 TCP、健康接口是否通过
- 未通过项目的原始错误摘要
- 明确写出“尚未填写企业注册码、尚未注册终端”

完成后保持员工端窗口可用，但停在“未注册”状态，等待用户把结果和三张截图交回主测试人员。不要自行进入第二轮正式接入与批量下发阶段。
