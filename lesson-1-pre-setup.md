# 课前准备指南

第一次课之前，请把下面的环境装好。装完后跑一下最后的「验证」步骤，能看到结果就说明成功了。

搞不定的随时找我，不要自己卡太久。

---

## 1. 安装 Node.js

Node.js 是运行 JavaScript 代码的工具，后面所有课都会用到。

1. 打开 https://nodejs.org/
2. 下载 **LTS**（长期支持）版本，不要下 Current
3. 双击安装包，一路「下一步」就行

**验证**：打开终端（Mac 用"终端"应用，Windows 用"命令提示符"或"PowerShell"），输入：

```bash
node --version
```

看到类似 `v22.x.x` 的版本号就说明装好了。

> **怎么打开终端？**
> - Mac：按 `Cmd + 空格`，输入「终端」，回车
> - Windows：按 `Win + R`，输入 `cmd`，回车

---

## 2. 安装 VS Code

VS Code 是写代码的编辑器，也是我们上课时看代码用的工具。

1. 打开 https://code.visualstudio.com/
2. 下载对应你系统的版本（Mac / Windows）
3. 安装完打开，看到欢迎页面就行

装好后安装一个插件：
1. 打开 VS Code
2. 点左侧栏的「扩展」图标（四个方块的那个），或者按 `Cmd+Shift+X`（Mac）/ `Ctrl+Shift+X`（Windows）
3. 搜索 **Chinese (Simplified)**，安装第一个结果（中文语言包）
4. 重启 VS Code，界面变成中文就行

---

## 3. 安装 Git

Git 是代码版本管理工具，从第一次课开始就会用到。

**Mac**：打开终端，输入：

```bash
git --version
```

如果弹出安装提示，点「安装」。如果直接显示版本号，说明已经装好了。

**Windows**：

1. 打开 https://git-scm.com/
2. 下载安装包，安装时所有选项保持默认，一路「Next」
3. 装完后打开命令提示符，输入 `git --version`，看到版本号就行

---

## 4. 配置 Git 和 GitHub

### 4.1 配置 Git 用户信息

打开终端，输入以下两行命令（把引号里的内容换成你自己的）：

```bash
git config --global user.name "你的名字"
git config --global user.email "你GitHub账号的邮箱"
```

比如：

```bash
git config --global user.name "xiaohuang"
git config --global user.email "xiaohuang@example.com"
```

### 4.2 配置 SSH 密钥（让你的电脑和 GitHub 能互相认识）

这一步稍微复杂，照着做就行，不理解没关系，课上会解释。

**第 1 步：生成密钥**

打开终端，输入（邮箱换成你自己的）：

```bash
ssh-keygen -t ed25519 -C "你GitHub账号的邮箱"
```

然后会问你几个问题，**全部直接按回车**（不用输入任何内容，按 3 次回车）。

**第 2 步：复制密钥**

Mac：
```bash
cat ~/.ssh/id_ed25519.pub | pbcopy
```
执行后密钥就复制到剪贴板了（屏幕上不会有提示，这是正常的）。

Windows：
```bash
type %USERPROFILE%\.ssh\id_ed25519.pub | clip
```

**第 3 步：添加到 GitHub**

1. 打开 https://github.com/settings/keys
2. 点绿色按钮 **New SSH key**
3. Title 随便填，比如「我的电脑」
4. Key 那栏直接粘贴（`Cmd+V` 或 `Ctrl+V`）
5. 点 **Add SSH key**

**验证**：在终端输入：

```bash
ssh -T git@github.com
```

如果问你 `Are you sure you want to continue connecting?`，输入 `yes` 回车。

看到 `Hi 你的用户名! You've been authenticated` 就说明成功了。

### 4.3 克隆课程仓库

SSH 配置好之后，把我们的课程仓库下载到本地：

先进入你想放项目的目录（比如桌面、文档，或者任何你习惯的地方），然后执行克隆：

```bash
git clone git@github.com:zhangdongming0607/coding-setup.git
```

克隆完成后，当前目录会多一个 `coding-setup` 文件夹，就是我们的课程项目。用 VS Code 打开它：

```bash
code coding-setup
```

> 后面所有的课程资料、Demo 代码、作业都在这个仓库里管理。

---

## 5. 安装 Chrome 浏览器

我们上课会用到 Chrome 的开发者工具（DevTools），请确保装了 Chrome。

如果已经在用 Chrome 了，跳过这步。

下载地址：https://www.google.com/chrome/

---

## 6. 验证清单

全部装完后，打开终端，逐个输入以下命令，每个都能看到版本号或成功提示就说明 OK：

```bash
node --version
npm --version
git --version
code --version
ssh -T git@github.com
```

> - `code --version` 如果提示"找不到命令"，不影响上课，跳过就好。
> - `ssh -T git@github.com` 看到 `Hi xxx!` 就是成功。

---

## 常见问题

**Q: Mac 安装时提示"无法打开，因为无法验证开发者"？**
A: 去「系统设置 → 隐私与安全性」，点「仍要打开」。

**Q: Windows 安装 Node.js 后 `node --version` 提示找不到命令？**
A: 关掉命令提示符重新打开再试。如果还不行，重启电脑。

**Q: 都装好了但不确定版本对不对？**
A: 只要能显示版本号就行，版本号不需要一模一样。

**Q: `ssh -T git@github.com` 提示 "Permission denied" 怎么办？**
A: 大概率是密钥没配好，找我单独帮你看一下。

**Q: GitHub 打不开或者特别慢？**
A: 可能需要科学上网。如果实在打不开，找我帮你处理。

---

有任何问题随时在群里问，课前我会帮大家确认环境没问题。
