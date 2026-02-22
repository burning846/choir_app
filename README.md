# Choir Practice App

一个专为合唱团打造的在线练习平台，集成了乐谱阅读、多声部范唱播放、录音回放与评价等核心功能。基于 Next.js + Supabase 构建，支持 Web 端及 PWA 移动端使用。

## 🌟 核心功能

*   **智能乐谱阅读器**: 集成 PDF 查看器，支持缩放、翻页，让手机也能清晰看谱。
*   **多轨同步播放**:
    *   **伴奏音轨**: 纯净伴奏，稳定节奏。
    *   **范唱音轨**: 分声部人声示范，辅助音准练习。
    *   **独立混音**: 可自由调节伴奏与范唱的音量比例。
*   **在线录音室**:
    *   **同步录音**: 录音时自动同步播放伴奏。
    *   **即时回放**: 录音结束后立即回放，支持与伴奏混音试听。
    *   **自我评价**: 对练习效果进行打分和备注。
*   **云端存储**: 录音文件自动上传至云端，不仅防丢失，也方便指挥后续查阅。
*   **移动端优先**: 采用 PWA 架构，支持“添加到主屏幕”，提供类原生 App 的流畅体验。

## 🛠️ 技术栈

*   **前端**: [Next.js 14](https://nextjs.org/) (App Router), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
*   **UI 组件**: [shadcn/ui](https://ui.shadcn.com/), [Lucide Icons](https://lucide.dev/)
*   **后端服务 (BaaS)**: [Supabase](https://supabase.com/)
    *   **Auth**: 用户注册与登录。
    *   **Database (PostgreSQL)**: 存储用户信息、曲目数据、录音记录。
    *   **Storage**: 存储乐谱 PDF、音频文件、用户录音。
*   **音频处理**: Web Audio API (原生), `useAudioPlayer` & `useAudioRecorder` (自定义 Hooks)
*   **PDF 渲染**: [react-pdf](https://github.com/wojtekmaj/react-pdf)

## 🚀 快速开始

### 1. 环境准备
确保本地已安装 Node.js 18+。

### 2. 克隆项目并安装依赖
```bash
git clone <your-repo-url>
cd choir-app/web
npm install
```

### 3. 配置环境变量
在 `web` 目录下创建 `.env.local` 文件，并填入你的 Supabase 项目配置：

```env
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase项目AnonKey
```

### 4. 初始化数据库
在 Supabase SQL Editor 中运行项目根目录下的 `supabase_schema.sql` 脚本，创建所需的表结构和安全策略 (RLS)。

### 5. 启动开发服务器
```bash
npm run dev
```
访问 [http://localhost:3000](http://localhost:3000) 开始使用。

## 📱 部署指南 (Vercel)

本项目针对 Vercel 进行了优化，推荐使用 Vercel 进行一键部署。

1.  将代码推送到 GitHub/GitLab。
2.  登录 [Vercel](https://vercel.com/)，点击 **"Add New..."** -> **"Project"**。
3.  导入你的代码仓库。
4.  在 **Environment Variables** 中添加 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
5.  点击 **Deploy**。

## 📂 目录结构

```
.
├── docs/                   # 项目文档 (PRD, TD)
├── web/                    # Next.js 前端项目
│   ├── public/             # 静态资源 (Manifest, Icons)
│   ├── src/
│   │   ├── app/            # 页面路由
│   │   │   ├── (auth)/     # 认证相关页面
│   │   │   ├── admin/      # 管理员页面 (上传)
│   │   │   ├── library/    # 曲目库
│   │   │   └── practice/   # 核心练习室
│   │   ├── components/     # UI 组件
│   │   ├── context/        # 全局状态 (Auth)
│   │   ├── hooks/          # 自定义 Hooks (Audio, Recorder)
│   │   └── lib/            # 工具库 (Supabase Client)
│   └── ...
└── supabase_schema.sql     # 数据库初始化脚本
```

## 📝 后续规划

*   **指挥端**: 开发指挥后台，用于听取团员录音并进行点评。
*   **社区互动**: 增加团员间的点赞、评论功能。
*   **原生 App**: 使用 Capacitor 将 PWA 打包为 iOS/Android 原生应用。

## 📄 License

MIT
