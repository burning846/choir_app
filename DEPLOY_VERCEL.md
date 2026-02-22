# Vercel 部署指南

本指南将协助你将 **Choir Practice App** 部署到 Vercel 平台。Vercel 是 Next.js 的官方部署平台，提供全球 CDN、HTTPS 和自动化 CI/CD，非常适合本项目。

## 前置准备

1.  确保你的代码已经推送到 GitHub（已完成）。
    *   仓库地址: `https://github.com/burning846/choir_app`
2.  准备好你的 Supabase 项目的 API Key。
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 步骤 1: 注册/登录 Vercel

1.  访问 [Vercel 官网](https://vercel.com/)。
2.  点击右上角的 **"Sign Up"**。
3.  选择 **"Continue with GitHub"**。这会自动关联你的 GitHub 账号，方便读取仓库。

## 步骤 2: 导入项目

1.  登录成功后，在 Dashboard 页面点击 **"Add New..."** -> **"Project"**。
2.  在 "Import Git Repository" 列表中，找到 `choir_app` 仓库，点击 **"Import"**。
    *   如果没看到，检查 GitHub 权限设置，确保 Vercel 有权访问你的所有仓库或该特定仓库。

## 步骤 3: 配置项目 (⚠️ 关键步骤)

在 "Configure Project" 页面，你需要做两处关键修改：

### 3.1 修改根目录 (Root Directory)
由于我们的 Next.js 代码不在仓库根目录，而是在 `web` 目录下，必须修改此设置：

1.  找到 **"Root Directory"** 选项。
2.  点击 **"Edit"**。
3.  在文件树中选择 `web` 目录。
4.  点击 **"Continue"**。
    *   修改后，Framework Preset 应该会自动识别为 `Next.js`。

### 3.2 配置环境变量 (Environment Variables)
展开 **"Environment Variables"** 折叠面板，添加你在本地 `.env.local` 中使用的变量：

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | 填入你的 Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 填入你的 Supabase Anon Key |

*   输入一对 Key 和 Value 后，点击 **"Add"**。确保两个都添加成功。

## 步骤 4: 开始部署

1.  确认以上配置无误后，点击底部的 **"Deploy"** 按钮。
2.  Vercel 会自动执行以下流程：
    *   拉取代码。
    *   安装依赖 (`npm install`)。
    *   构建项目 (`npm run build`)。
    *   分发到全球 CDN。
3.  等待约 1-2 分钟，看到满屏撒花的动画，即表示部署成功！

## 步骤 5: 验证与后续

1.  点击预览图或 **"Visit"** 按钮，访问你的线上域名（通常是 `choir-app-xi...vercel.app`）。
2.  **测试功能**:
    *   尝试登录（检查 Supabase Auth 是否连接正常）。
    *   进入 Library 页面（检查 Supabase Database 连接）。
    *   尝试录音并上传（检查 Supabase Storage 连接）。

### 常见问题排查

*   **部署失败 (Build Failed)**:
    *   查看 Vercel 的 Build Logs。
    *   常见原因是 TypeScript 类型错误。如果在本地 `npm run build` 能通过，通常 Vercel 也能通过。
    *   如果是因为 `web` 目录设置错误，Vercel 会提示找不到 `package.json`，请回到 Settings -> General -> Root Directory 重新设置。

*   **页面报错 "Application error: a client-side exception has occurred"**:
    *   通常是环境变量没填对。检查 Vercel 后台 Settings -> Environment Variables，修改后需要**重新部署** (Redeploy) 才会生效。
