# GitHub 仓库移交

更新日期：2026-09-09

## 1. 当前仓库情况

两个插件已经是两个独立公开仓库：

- 员工端：<https://github.com/motang1219/kaiwu-praxis>
- 企业端：<https://github.com/motang1219/kaiwu-praxis-enterprise>

它们必须分别移交。只转移员工端会导致同事拿不到企业端后续管理权限；只邀请协作者也不等于完成所有权移交。

## 2. 推荐方案

优先顺序：

1. **转移到公司 GitHub Organization**：最适合公司项目。仓库所有权归组织，可设置 Owner、Maintainer、Write、Read 等不同权限，人员离职不影响资产归属。
2. **转移到指定同事个人账号**：公司没有 Organization 时可用，但项目仍绑定某个个人，未来可能再次移交。
3. **只添加 Collaborator**：适合移交前共同收尾，不适合作为最终归属。个人仓库的 collaborator 可以读写代码，但仓库仍由你的账号拥有，且权限粒度有限。

不要把你的 GitHub 账号、密码、2FA、PAT 或 SSH 私钥交给同事。

## 3. 转移前检查

对两个仓库分别完成：

1. 确认目标账号/组织的准确 GitHub 名称。
2. 目标名下不能已有同名仓库，也不能有同一 fork network 中冲突的 fork。
3. 推送所有应交付的提交和标签。
4. 检查 Actions、Deploy keys、Webhooks、Secrets、Packages、Pages 和分支保护。
5. 检查提交历史、issue、PR 和 release 中是否含个人或公司敏感信息。
6. 备份本地工作区和 `git bundle`；备份不是用 ZIP 代替 Git 历史。
7. 确认员工端 `v0.5.1` 和企业端 `v0.2.1` 标签都随仓库转移，并从新地址各做一次空白安装。

本项目当前是公开仓库。若代码应归公司保密，先由公司确认可见性策略；不要在没有授权时自行切换公开/私有，因为可见性变化会影响 fork、Pages、安全功能和访问权限。

## 4. 转移到同事个人账号

两个仓库各操作一次：

1. 登录 GitHub，进入仓库主页。
2. 打开 `Settings`。
3. 在 `General` 页面滚动到 `Danger Zone`。
4. 找到 `Transfer ownership`，点击 `Transfer`。
5. 选择或填写同事的 GitHub 用户名。
6. 按页面要求输入仓库名确认。
7. 同事会收到确认邮件，必须在 24 小时内接受；超时需重新发起。

转移后，新所有者可以管理仓库内容、issue、PR、release、project 和设置。原所有者通常会被添加为 collaborator，已有其他 collaborators 会保留。

## 5. 转移到公司 Organization

前提：你必须有权在目标 Organization 创建仓库，组织策略也必须允许转入。

步骤与个人转移相同，在 `Transfer ownership` 中选择目标 Organization。完成后立即：

- 把至少两名在职同事设为组织 Owner 或仓库管理员；
- 为开发者分配最小必要权限；
- 检查默认分支保护、tag 保护和 Actions 权限；
- 设置公司级恢复邮箱、2FA 和所有权连续性规则；
- 移除不再需要的个人 deploy key、PAT 和 webhook。

## 6. 转移后的 Git 操作

GitHub 会把旧仓库网页和常见 Git 请求重定向到新地址，但所有本地克隆仍应显式更新 remote：

```powershell
git remote -v
git remote set-url origin https://github.com/<新所有者>/kaiwu-praxis.git
```

企业端仓库：

```powershell
git remote set-url origin https://github.com/<新所有者>/kaiwu-praxis-enterprise.git
```

如果团队使用 SSH：

```powershell
git remote set-url origin git@github.com:<新所有者>/kaiwu-praxis.git
git remote set-url origin git@github.com:<新所有者>/kaiwu-praxis-enterprise.git
```

随后验证：

```powershell
git fetch --all --tags
git remote -v
git push --dry-run origin main
```

不要在旧的 `motang1219/<仓库名>` 位置重新创建同名仓库或 fork；GitHub 官方说明这会永久破坏原地址到新仓库的重定向。

## 7. 项目内需要同步更新的位置

转移后搜索旧 owner：

```powershell
rg -n "motang1219|github.com/.*/kaiwu-praxis" .
```

重点更新：

- 两个仓库的 `README.md` 安装命令；
- `package.json`、lockfile 中的 Git URL；
- 便携包 `home/profiles/web/package.json` 中的插件来源；
- 测试手册和交接文档；
- CI、badge、issue 模板和 release 链接；
- 其他电脑上的 Git remote。

已发布旧便携包仍含旧 GitHub 来源，但包内代码可离线运行。只要 GitHub 重定向还在，旧链接通常仍能访问；下一版便携包必须改成新 owner 并重新验收。`v0.5.1` 本地交付包使用内置离线 tarball，转移仓库不会影响它启动；正式源码标签已经发布。

## 8. 只添加协作者的临时办法

如果第三轮测试还没结束，可以先让同事参与：

1. 仓库 `Settings`；
2. `Collaborators`；
3. `Add people`；
4. 输入同事用户名并发送邀请；
5. 同事接受后即可推送代码。

个人账号仓库只有 owner 与 collaborator 两级。对于私有个人仓库，owner 不能给 collaborator 单独设置只读级别；需要更细权限时应使用 Organization。

## 9. 最终验收清单

- [ ] 两个仓库都显示新的所有者。
- [ ] 两个仓库的 `main` 和全部 tags 可见。
- [x] 员工端 `v0.5.1` 已发布。
- [x] 企业端 `v0.2.1` 已发布。
- [ ] 同事能 clone、创建分支、推送和开 PR。
- [ ] README 的安装 URL 已更新。
- [ ] 从新地址空白安装员工端和企业端成功。
- [ ] Actions/Secrets/Webhooks/Deploy keys 已逐项确认。
- [ ] 你的个人凭据没有交给任何人。
- [ ] 公司至少有两名在职管理员。
- [ ] 旧地址重定向可用，且没有在旧位置重建同名仓库。

## 10. 官方依据

- [GitHub：Transferring a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository)
- [GitHub：Inviting collaborators to a personal repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/inviting-collaborators-to-a-personal-repository)
- [GitHub：Permission levels for a personal account repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository)
- [GitHub：Moving your work to an organization](https://docs.github.com/en/account-and-profile/how-tos/account-management/moving-your-work-to-an-organization)
