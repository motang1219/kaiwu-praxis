# 开物 Praxis Windows 员工端C实机测试操作手册

## 一、任务说明

本次测试用于验证 Windows 员工端在公司局域网内接入“开物企业中枢”后的完整使用流程，包括：

1. 校验并启动员工端交付包（EXE 或 ZIP 二选一）；
2. 通过公司局域网访问企业中枢；
3. 使用一次性注册码注册为“员工端C”；
4. 接收企业端在线下发的资料；
5. 验证员工端离线时指令排队、恢复后自动执行；
6. 验证企业中枢重启后员工端自动恢复连接；
7. 清理测试资料并提交截图。

本轮走公司局域网，不要求安装 Tailscale。员工端不会开放入站业务端口，只会主动连接企业中枢。

## 二、开始前需要收到的内容

请确认企业管理员已经单独发给你以下内容：

- 员工端交付包（二选一，推荐直接使用体积更小的 EXE）：
  - `kaiwu-praxis-setup-v0.5.0.exe`
  - `kaiwu-praxis-portable-v0.5.0.zip`
- 企业中枢地址：由管理员提供，格式类似 `http://192.168.x.x:3099`
- 一次性企业注册码：每位测试人员独立使用，仅使用一次
- 终端名称：`员工端C`

不要接收或索取企业管理员令牌。企业注册码也不要发到群聊或出现在截图中。

> 管理员注意：本轮统一使用新的终端名称“员工端C”，并使用独立的第三轮测试数据库，避免与历史测试终端混淆。此项不由员工端测试人员操作。

## 三、安全与操作边界

测试过程中遵守以下要求：

- 不覆盖或删除电脑上原有的 DSH、`.dsh`、旧便携包或模型配置。
- 不把 EXE 或 ZIP 解压到已有 DSH 目录中。
- 不安装 `kaiwu-praxis-enterprise`；员工电脑只安装员工端。
- 不运行 `plugin add`、`npm install`、`pnpm install`或“升级插件”。本轮必须使用锁定版本。
- 不关闭 Windows 防火墙，不设置端口转发、DMZ或公网暴露。
- 不读取、修改或删除 `terminal.json`。
- 不在截图中展示模型 API Key、注册码、终端密钥、私人聊天或无关文件。
- 不需要配置模型 API Key即可完成本轮企业连接与资料下发测试。
- 任一步骤出现与手册不一致的结果时，先截图并停止，不要反复重装或删除目录。

## 四、准备独立测试目录

建议使用一个新的、路径简短且不受网盘同步影响的目录。例如有 D 盘时使用：

```text
D:\kaiwu-test\employee-c
```

只有 C 盘时可以使用：

```text
C:\kaiwu-test\employee-c
```

把收到的 EXE 或 ZIP 放入该目录。只需接收其中一种，不要直接覆盖以前解压过的版本。

## 五、校验员工端交付包

在交付包所在文件夹空白处按住 Shift 并右键，选择“在此处打开 PowerShell”，或者打开 PowerShell 后进入该目录。

如果收到的是推荐的 EXE，执行：

```powershell
Get-FileHash .\kaiwu-praxis-setup-v0.5.0.exe -Algorithm SHA256
```

EXE 的预期 SHA-256：

```text
D2B740C4D1895C32C286049557D73520C876AA8F9074815D6E53DD9F006BB664
```

如果收到的是 ZIP，执行：

```powershell
Get-FileHash .\kaiwu-praxis-portable-v0.5.0.zip -Algorithm SHA256
```

ZIP 的预期 SHA-256：

```text
3EFC299E62FC033ADA214336683423DFFF1619E3BFEA3D5B2851CC63983DE16A
```

如果不一致：

1. 不要运行或解压；
2. 截图完整文件名与实际哈希；
3. 联系企业管理员重新获取文件。

### 截图 01：交付包哈希

截图需同时显示文件名和完整 SHA-256，命名为：

```text
01-员工端C交付包哈希.png
```

## 六、解压并确认目录结构

### 方式 A：使用 EXE（推荐）

1. 确认第五部分的 EXE 哈希完全一致后，双击 `kaiwu-praxis-setup-v0.5.0.exe`。
2. 该文件是自解压交付包，不会把插件安装进电脑上原有的 DSH。选择第四部分准备的新目录作为解压位置。
3. 当前 EXE 没有数字签名。如果 Windows SmartScreen 弹出“Windows 已保护你的电脑”，再次核对文件名和哈希后，可依次点击“更多信息”与“仍要运行”。不要关闭 Windows Defender、其他杀毒软件或防火墙。
4. 等待解压完成。EXE 会自动运行解压目录中 `kaiwu-praxis-portable\start.bat`；启动窗口必须保持打开。
5. 如果没有自动启动，进入解压后的 `kaiwu-praxis-portable` 目录，手动双击 `start.bat`。

### 方式 B：使用 ZIP

使用 Windows 资源管理器“全部解压”，不要直接在压缩包预览窗口中运行文件。

### 两种方式共同检查

解压完成后，找到真正的便携包根目录。该目录中应直接包含：

```text
app
home
runtime
start.bat
启动.bat
```

如果看到外层和内层两个同名目录，以直接包含上述文件的内层目录为准。

以下示例假设便携包根目录是：

```powershell
$portableRoot = 'D:\kaiwu-test\employee-c\kaiwu-praxis-portable'
```

如果你使用其他位置，请把上面的路径改成实际路径。执行：

```powershell
Get-ChildItem -LiteralPath $portableRoot
```

应能看到 `app`、`home`、`runtime`和启动脚本。

## 七、核对插件版本

继续执行：

```powershell
$profileFile = Join-Path $portableRoot 'home\profiles\web\package.json'
$profile = Get-Content -LiteralPath $profileFile -Raw -Encoding UTF8 | ConvertFrom-Json

[pscustomobject]@{
  Employee = $profile.dependencies.'kaiwu-praxis'
  Teams = $profile.dependencies.'@nanmicoder/dsh-agent-teams'
  Hindsight = $profile.dependencies.'@vectorize-io/hindsight-coding-agents'
  Sidebar = $profile.dependencies.'dsh-better-sidebar'
  Enterprise = $profile.dependencies.'kaiwu-praxis-enterprise'
} | Format-List
```

预期结果：

- `Employee`包含 `v0.5.0`
- `Teams`为 `0.1.14`
- `Hindsight`为 `0.4.3`
- `Sidebar`为 `0.17.1`
- `Enterprise`为空

如果员工端版本不对、任一配套插件缺失，或者出现企业端插件，请停止并截图，不要自行联网更新。

### 截图 02：插件版本

命名为：

```text
02-员工端C插件版本.png
```

## 八、检查3080端口并启动员工端

先执行：

```powershell
Get-NetTCPConnection -State Listen -LocalPort 3080 -ErrorAction SilentlyContinue
```

如果使用 ZIP，此时预期没有输出，表示3080未被占用。如果有输出，不要结束陌生进程；请截图并联系管理员确认。确认端口空闲后，双击便携包根目录中的：

```text
start.bat
```

如果使用 EXE，解压结束后通常已经自动启动：

- 若3080正在监听且浏览器能打开员工端，这是正常结果，直接继续下面的检查；
- 若3080没有监听，进入 `$portableRoot` 后双击 `start.bat`；
- 若3080正在监听但无法打开员工端，停止操作并联系管理员，不要结束陌生进程。

不要关闭弹出的启动窗口。等待约10秒，在浏览器打开：

```text
http://127.0.0.1:3080
```

如浏览器没有自动打开，就手动输入该地址。

在另一个 PowerShell 窗口执行：

```powershell
curl.exe --noproxy "*" -I http://127.0.0.1:3080
```

预期看到 `HTTP/1.1 200 OK`或其他明确的 HTTP 200结果。

进入“数字员工广场”，应看到7名数字员工：

- 水印工具
- 资料管家
- 内容撰稿员
- 竞品分析员
- 情报采集员
- 品牌诊断员
- 数据追踪员

### 截图 03：员工端启动

截图同时显示数字员工广场和7名数字员工，命名为：

```text
03-员工端C启动成功.png
```

## 九、验证公司局域网中的企业中枢

确保当前电脑已经连接公司办公网络，并取得管理员提供的企业中枢地址。

以下示例地址仅作格式说明，不可原样照抄：

```text
http://192.168.x.x:3099
```

在 PowerShell 中设置实际地址：

```powershell
$hubUrl = 'http://管理员提供的局域网IP:3099'
$hubIp = ([uri]$hubUrl).Host
```

执行端口检查：

```powershell
Test-NetConnection $hubIp -Port 3099
```

预期：

```text
TcpTestSucceeded : True
```

然后绕过系统代理检查健康接口：

```powershell
curl.exe --noproxy "*" "$hubUrl/api/health"
```

预期返回类似：

```json
{"ok":true,"version":"0.2.1","enterpriseName":"..."}
```

如果 `TcpTestSucceeded`为 `False`：

1. 确认企业中枢地址没有输错；
2. 确认电脑确实连接公司办公网络；
3. 把完整结果截图发给管理员；
4. 不要自行修改防火墙或安装 Tailscale。

### 截图 04：内网连通

截图需显示 `TcpTestSucceeded : True`和健康接口结果，但不得包含注册码，命名为：

```text
04-员工端C公司内网连通.png
```

## 十、注册企业员工端

在员工端页面依次进入：

```text
数字员工广场 → 员工设置 → 企业连接
```

填写：

- 企业管理地址：管理员提供的完整 `$hubUrl`
- 企业注册码：管理员单独发送的一次性注册码
- 终端名称：`员工端C`

点击“保存并连接”。

预期：

- 连接状态显示“已连接”；
- 显示正确的企业名称；
- 最后连接时间持续更新；
- 注册成功后，注册码输入框应保持为空；
- 不需要查看或发送终端ID和终端密钥。

### 截图 05：企业连接成功

截图前确认注册码输入框为空，并遮挡可能显示的终端标识。命名为：

```text
05-员工端C企业连接成功.png
```

完成后通知管理员：“员工端C已连接，请确认企业端在线状态。”等待管理员确认后再继续。

## 十一、在线资料下发测试

管理员将同时向测试终端的“数据追踪员”下发：

```text
第三轮公司内网实机验收资料
```

预期内容为：

```markdown
# 第三轮公司内网实机验收

该资料由企业中枢通过公司内网下发至员工端C。
```

管理员通知“配置已下发”后，等待5至15秒。在 PowerShell 中执行：

```powershell
$knowledgeDir = Join-Path $portableRoot 'home\.agent-presets\kaiwu-data-tracker\knowledge'
$onlineFile = Join-Path $knowledgeDir '第三轮公司内网实机验收资料.md'

Test-Path -LiteralPath $onlineFile
Get-Content -LiteralPath $onlineFile -Raw -Encoding UTF8
Get-FileHash -LiteralPath $onlineFile -Algorithm SHA256
```

预期：

- `Test-Path`返回 `True`
- 中文内容完整，无乱码
- 内容与上文逐字一致
- 能输出 SHA-256

### 截图 06：在线资料落盘

截图显示文件名和完整中文内容，命名为：

```text
06-员工端C在线资料落盘.png
```

把实际 SHA-256以文字形式发给管理员。

## 十二、员工端离线队列测试

必须先得到管理员明确通知“开始离线测试”。

### 12.1 停止员工端

关闭运行 `start.bat`的员工端窗口，只停止本次便携员工端，不要退出公司网络，不要关闭其他软件。

等待约5秒，执行：

```powershell
Get-NetTCPConnection -State Listen -LocalPort 3080 -ErrorAction SilentlyContinue
```

预期没有输出。

记录停止时间并发给管理员。等待管理员确认企业端已显示员工端C离线，并且已经在离线期间下发：

```text
第三轮离线队列验收资料
```

### 12.2 恢复员工端

收到管理员“可以恢复”后，再次双击：

```text
start.bat
```

等待5至15秒。不要重新填写企业注册码。

进入“员工设置 → 企业连接”，预期自动恢复为“已连接”，最后连接时间重新更新。

执行：

```powershell
$offlineFile = Join-Path $knowledgeDir '第三轮离线队列验收资料.md'

Test-Path -LiteralPath $offlineFile
Get-Content -LiteralPath $offlineFile -Raw -Encoding UTF8
Get-FileHash -LiteralPath $offlineFile -Algorithm SHA256
```

预期：

- 文件自动出现；
- 中文无乱码；
- 不需要重新注册；
- 管理员侧审计最终变为“成功”；
- 同一指令只执行一次。

### 截图 07和08

```text
07-员工端C已停止.png
08-员工端C恢复并执行离线指令.png
```

截图08需显示企业连接已恢复，以及离线资料文件已经落盘。把文件 SHA-256发给管理员。

## 十三、企业中枢重启恢复测试

保持员工端C和启动窗口运行。收到管理员“企业中枢即将重启”后，不要修改任何配置。

中枢停止期间，企业连接可能暂时无法更新，这是预期现象。管理员通知“中枢已恢复”后等待约15秒。

检查：

1. 企业连接是否自动恢复“已连接”；
2. 最后连接时间是否继续更新；
3. 是否没有要求重新输入注册码；
4. 3080是否仍返回 HTTP 200。

```powershell
curl.exe --noproxy "*" -I http://127.0.0.1:3080
```

### 截图 09：中枢重启后自动恢复

命名为：

```text
09-员工端C中枢重启后自动恢复.png
```

## 十四、测试资料清理

所有验收截图完成后，管理员会从企业端删除两份测试资料：

- `第三轮公司内网实机验收资料.md`
- `第三轮离线队列验收资料.md`

收到管理员“清理指令已下发”后等待5至15秒，执行：

```powershell
Test-Path -LiteralPath $onlineFile
Test-Path -LiteralPath $offlineFile
Get-ChildItem -LiteralPath $knowledgeDir -Force
```

前两项均应返回 `False`。目录中不应再出现这两个文件。

### 截图 10：测试资料清理

命名为：

```text
10-员工端C测试资料清理.png
```

## 十五、需要提交的材料

请建立一个文件夹：

```text
员工端C-第三轮公司内网测试结果
```

其中应包含：

```text
01-员工端C交付包哈希.png
02-员工端C插件版本.png
03-员工端C启动成功.png
04-员工端C公司内网连通.png
05-员工端C企业连接成功.png
06-员工端C在线资料落盘.png
06B-员工端C在线资料落盘-修复复测.png
07-员工端C已停止.png
08-员工端C恢复并执行离线指令.png
09-员工端C中枢重启后自动恢复.png
10-员工端C测试资料清理.png
员工端C测试结果.md
```

`员工端C测试结果.md`按以下模板填写：

```markdown
# 员工端C第三轮公司内网测试结果

- 操作系统：
- 测试日期：
- 交付包文件名：
- 交付包 SHA-256：
- 企业中枢地址：只写局域网IP和端口，不写注册码
- 3080启动结果：
- 公司内网3099连通结果：
- 企业注册结果：
- 在线资料落盘结果：
- 在线资料 SHA-256：
- 离线后企业端识别结果：由管理员反馈
- 恢复后离线指令执行结果：
- 离线资料 SHA-256：
- 中枢重启后自动恢复结果：
- 测试资料清理结果：
- 是否出现中文乱码：
- 是否修改注册码或 terminal.json：否
- 遇到的问题及完整错误：
- 文件名重复扩展名缺陷：首次发现 `.md.md`，保留失败截图；修复复测通过
- 最终结论：通过（测试中发现1项缺陷，修复复测通过） / 不通过 / 部分通过
```

## 十六、停止条件

遇到以下任一情况时立即停止并联系管理员：

- 交付包哈希不一致；
- 包内插件版本不符合要求；
- 员工端包中出现企业端插件；
- 3080被未知程序占用；
- 公司内网3099不通；
- 健康接口不是预期企业；
- 注册码提示无效或已使用；
- 注册成功后要求反复重新注册；
- 下发文件落到预期目录之外；
- 中文文件出现乱码；
- 企业端要求关闭防火墙或开放公网端口；
- 任何操作要求发送API Key、管理员令牌或终端密钥。

停止后请发送：当前步骤编号、完整错误文字、相关截图和发生时间。不要通过删除目录或重新安装来掩盖现场。
