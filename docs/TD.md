# 合唱团练习 App - 技术设计文档 (TD)

## 1. 技术架构选型
基于“免费、快速开发、移动端优先、易扩展”的原则，采用以下技术栈：

### 1.1 前端 (Frontend)
*   **框架:** **Next.js (React)** - 利用其强大的路由和全栈能力。
*   **语言:** **TypeScript** - 保证代码健壮性。
*   **UI 组件库:** **Tailwind CSS** + **shadcn/ui** - 快速构建美观、响应式的移动端界面。
*   **构建工具:** **Vite** (或 Next.js 内置 Webpack/Turbopack)。
*   **移动端适配:** **PWA (Progressive Web App)** - 通过 manifest.json 和 Service Worker 实现“类 App”体验（可添加到主屏幕、离线缓存）。

### 1.2 后端与服务 (Backend as a Service)
为了零成本启动并减少运维，全面采用 **Supabase** (开源 Firebase 替代品)：
*   **数据库:** PostgreSQL (Supabase 托管)。
*   **认证 (Auth):** Supabase Auth (支持邮箱、手机、第三方)。
*   **文件存储 (Storage):** Supabase Storage (存放 PDF 乐谱、伴奏 MP3、用户录音 WAV/WEBM)。
*   **API:** Supabase 自动生成的 RESTful/GraphQL API + Next.js API Routes (处理少量自定义逻辑)。

### 1.3 核心音频技术 (Audio Engine)
这是本项目的技术难点，全部在**客户端 (浏览器)** 完成，以节省服务器计算资源：
*   **Web Audio API:** 浏览器原生 API，用于底层的音频处理。
*   **音频库:** **Howler.js** (播放控制) 或 **Tone.js** (更高级的调度和效果处理)。
*   **录音:** **MediaStream Recording API**。
*   **PDF 渲染:** **react-pdf** (基于 PDF.js)。

## 2. 系统架构图
```mermaid
graph TD
    User[用户 (Mobile/Desktop)] -->|HTTPS| CDN[Vercel CDN]
    CDN -->|Serve| WebApp[Next.js Web App]
    
    subgraph Client_Side [浏览器端核心逻辑]
        WebApp --> PDF_Render[PDF 渲染器]
        WebApp --> Audio_Engine[音频引擎 (Web Audio API)]
        Audio_Engine -->|Mix| Mixer[混音器]
        Audio_Engine -->|Record| Recorder[录音机]
    end
    
    subgraph Backend_Services [Supabase (Free Tier)]
        WebApp -->|Auth| Auth_Service[身份认证]
        WebApp -->|Data| DB[(PostgreSQL)]
        WebApp -->|Files| Storage[对象存储]
    end
    
    Storage -->|Stream Audio/PDF| WebApp
    Recorder -->|Upload Blob| Storage
```

## 3. 关键模块设计

### 3.1 数据库设计 (Schema)
*   **profiles:** 用户信息 (id, role, avatar_url)。
*   **songs:** 曲目 (id, title, composer, pdf_url, cover_url)。
*   **stems:** 分轨音频 (id, song_id, name, file_url, type='backing'|'vocal')。
*   **recordings:** 用户录音 (id, user_id, song_id, file_url, created_at, feedback_text)。

### 3.2 音频同步与录制流程
1.  **加载:** 并行加载 PDF 和音频文件（使用 `Preload` 策略）。
2.  **播放:** 使用 `AudioContext` 创建多个 `AudioBufferSourceNode`，分别对应伴奏和范唱，确保 `startTime` 严格一致以实现同步。
3.  **录音:** 
    *   请求麦克风权限 `navigator.mediaDevices.getUserMedia({ audio: true })`。
    *   **关键:** 必须提示用户佩戴耳机。如果外放，麦克风会录入伴奏声音，导致后期无法独立调节人声。
4.  **合成 (可选):** 
    *   **方案 A (MVP):** 仅上传人声干音 (Vocal Stem)。回放时，客户端实时将人声干音与伴奏混合播放。**优点:** 上传快，节省流量和存储。
    *   **方案 B:** 客户端使用 `OfflineAudioContext` 渲染混合后的音频并上传。**优点:** 生成的文件可直接分享。
    *   **决策:** 采用 **方案 A**，灵活性最高，存储成本最低。

### 3.3 移动端适配策略
*   **Viewport:** 禁止缩放，模拟 App 触感。
*   **PDF 阅读:** 手机竖屏时显示单页，横屏时显示双页或半页滚动。
*   **Touch 事件:** 优化播放条拖拽体验。

## 4. 部署方案 (全免费)
*   **前端:** 代码托管于 GitHub，连接 **Vercel** 进行自动化部署 (Free Tier 支持 HTTPS, CDN)。
*   **后端:** 创建 **Supabase** 项目 (Free Tier 包含 500MB 数据库, 1GB 文件存储, 50k 月活跃用户)。
*   **域名:** 使用 Vercel 提供的二级域名 (xxx.vercel.app) 或绑定个人域名。

## 5. 可扩展性设计
*   **App 转化:** 前端代码结构将 UI 与 逻辑分离。未来使用 **Capacitor**，只需添加配置文件即可将 Next.js 网站打包为 iOS/Android App，无需重写代码。
*   **存储扩展:** Supabase 兼容 AWS S3 协议，未来可无缝迁移到 AWS S3 或阿里云 OSS。
