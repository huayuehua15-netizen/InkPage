# InkPage 阅读器 📖

一款**开源、免登录**的本地 TXT / Markdown 阅读器。支持两种形态：**Android APK（原生 APP 体验）** 和 **PWA（网页版，可安装到桌面）**。专为手机设计——解决 Markdown 文件在手机上打不开、排版丑的问题。导入即读，数据全部保存在本地设备。

## ✨ 功能

- **导入即读**：支持 `.txt` / `.md` / `.markdown`，点击导入或直接拖拽文件到页面
- **精美排版**：Markdown 标题 / 代码块（语法高亮）/ 表格 / 引用 / 图片 / 任务列表完整渲染
- **中文友好**：自动识别 UTF-8 / GBK 编码，中文 TXT 不乱码
- **书库管理**：封面色卡、阅读进度条、最近阅读排序、一键删除
- **阅读体验**：
  - 进度记忆——关闭后重开自动回到上次位置
  - 目录抽屉——Markdown 标题一键跳转
  - 书签——摘录 + 进度定位，随时跳回
  - 全文搜索——书库内搜索书名与内容，命中高亮
  - 沉浸模式——点击正文隐藏工具栏
- **排版设置**：4 套主题（日间 / 夜间 / 护眼 / 羊皮纸）、字号、行距、字体、页边距、首行缩进，实时生效并持久化
- **PWA 可安装**：手机浏览器"添加到主屏幕"，离线可用，体验等同原生 APP
- **零账号、零后端**：所有数据仅存于浏览器 IndexedDB，不上传任何服务器

## 🚀 本地运行

```bash
npm install
npm run dev
```

浏览器打开终端提示的地址（手机测试请用同一 Wi-Fi 下的局域网地址）。

## 📱 构建 Android APK

项目内置 Capacitor Android 工程（`android/`），可直接打包安装到手机的 APP。

**前置环境**：JDK 21（Capacitor 8 必需，脚本会自动查找常见安装位置）、Android SDK（Android Studio 或命令行工具）。

```bash
npm install

# 打包 Debug APK（可直接安装到手机）
npm run android:apk

# 打包 Release APK（上架/分发用，需先配置签名）
npm run android:apk:release
```

打包脚本 `scripts/build-apk.ps1` 会自动：查找 JDK 21 → `npm run build` → `cap sync android` → Gradle 打包 → 复制 APK 到项目根目录（`InkPage-v1.0.0-debug.apk`）。

> 国内网络环境若 Gradle/依赖下载超时，项目已配置阿里云 Maven 镜像；Gradle 发行版可手动从 `https://mirrors.cloud.tencent.com/gradle/` 下载后放入 `~/.gradle/wrapper/dists/gradle-8.14.3-all/`。

把 APK 传到手机（微信/QQ/数据线均可）安装即可。**无需应用商店、无需 Google 服务**。安装后在文件管理器中长按 txt/md 文件选择"用 InkPage 打开"可直接导入阅读。

> 需要用 Android Studio 调试：`npm run android:open`。

### 签名 Release APK（发布用）

```bash
keytool -genkey -v -keystore inkpage.keystore -alias inkpage -keyalg RSA -keysize 2048 -validity 10000
# 将生成的 inkpage.keystore 放到 android/ 下，并在 android/app/build.gradle 的 signingConfigs 中配置
```

## 📦 Web 构建（PWA）

```bash
npm run build
```

产物输出到 `dist/`。

## 🌐 部署到 GitHub Pages（手机直接访问）

1. 将本仓库推送到 GitHub：
   ```bash
   git init
   git add .
   git commit -m "feat: InkPage reader v1.0.0"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git push -u origin main
   ```
2. 仓库 **Settings → Pages**：
   - Source 选择 `Deploy from a branch`
   - Branch 选择 `main` / `root`（或使用 GitHub Actions 构建后发布 `dist/`）
3. 打开 `https://<你的用户名>.github.io/<仓库名>/`，在手机浏览器中选择"添加到主屏幕"即可像 APP 一样使用。

> 项目使用 `HashRouter` + `base: './'`，无需任何服务器配置即可部署在任意子路径。

## 📁 技术栈

- React 18 + TypeScript + Vite
- markdown-it + highlight.js（Markdown 渲染与代码高亮）
- idb（IndexedDB 封装）
- 原生 CSS 变量主题引擎
- Service Worker 离线缓存

## ⚠️ 说明

- 数据仅存本地：清理浏览器数据或卸载 PWA 会删除书籍与进度，重要内容请保留原文件。
- Markdown 中的本地相对路径图片无法解析（导入场景下没有资源上下文），网络链接图片正常显示。

## 📄 License

[MIT](./LICENSE)
