# Project Plan: AI Macro Economic Analysis Expert Agent

## 1. 概述 (Overview)
在 Header 右侧增加一个“AI 宏观经济分析专家 Agent”功能。该 Agent 旨在辅助用户进行宏观经济分析，提供基于当前幻灯片上下文的问答服务，并具备联网搜索最新信息的能力。

## 2. 用户界面 (User Interface)

### 2.1 入口 (Entry Point)
- **位置**: header 右侧（与其他操作按钮并列）。
- **组件**: 一个带有 AI 图标（如 Sparkles 或 Bot）的按钮。
- **交互**: 点击按钮打开 Agent 模态框 (Modal)。

### 2.2 交互界面 (Chat Interface)
- **容器**: 使用 Dialog/Modal 组件，居中显示。
- **布局**:
    - **Header**: 标题 "AI 宏观经济分析专家"，包含关闭按钮。
    - **Message List**: 聊天记录区域，支持滚动。
        - **User Message**: 右侧气泡。
        - **AI Message**: 左侧气泡，支持 Markdown 渲染。
        - **Loading State**: AI 思考时、调用工具时的加载动画。
    - **Input Area**: 底部输入框 (Textarea) + 发送按钮。

## 3. 功能需求 (Functional Requirements)

### 3.1 会话管理 (Session Management)
- **生命周期**: 
    - 每次打开模态框时，视为一次新的会话 (Header close/open resets session)。
    - 关闭模态框时，清空当前会话记录。
- **上下文记忆**: 在单次会话保持期间，Agent 拥有完整的上下文记忆（多轮对话）。

### 3.2 上下文感知 (Context Awareness)
当用户打开 Agent 时，系统需自动抓取以下信息注入到 System Prompt：
1.  **当前幻灯片内容**: 用户当前浏览/编辑的 slide。
2.  **临近幻灯片**: 前 2 张 + 后 2 张 (Total max 5 slides)。
3.  **时间信息**: 当前系统的日期和时间 (用于宏观经济数据的时效性判断)。

### 3.3 Agent 能力 (Capabilities)
- **基于内容的问答**: 利用 slide 上下文回答用户关于报告内容的提问。
- **联网搜索**: 集成 Tavily Search API，允许 Agent 搜索最新的宏观经济数据或新闻。
- **多模型支持**: 后端应设计为支持 OpenAI Compatible API，以便切换不同的 LLM。

## 4. 技术架构 (Technical Architecture)

### 4.1 技术栈 (Tech Stack)
- **Frontend**: React (Next.js App Router), Tailwind CSS, Lucide React Icons.
- **Backend**: Next.js API Routes (Serverless Functions).
- **AI Integration**: 
    - `openai` (Official Node.js SDK).
    - Vercel AI SDK (`ai`) (可选，用于简化流式传输，推荐使用).
- **Search Tool**: `tavily-ai` (Tavily Search API).

### 4.2 数据流 (Data Flow)
1.  **Client**: 用户输入 Message -> 收集当前 Slides Context -> POST `/api/chat`.
2.  **Server**: 
    - 接收 Message + Context.
    - 构建 System Message (包含 Context + Date).
    - 调用 LLM (with Tools Definitions).
    - 如果 LLM 请求 Tool (Search): 执行 Search -> 将结果回传 LLM -> 获取最终响应.
    - Stream Response 回 Client.
3.  **Client**: 实时渲染 Markdown 响应.

## 5. 开发计划 (Implementation Roadmap)

### Phase 1: 基础设施准备 (Infrastructure)
- [ ] 安装依赖: `openai`, `ai` (Vercel AI SDK), `react-markdown`, `tavily-ai` (or similar).
- [ ] 配置环境变量: `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `TAVILY_API_KEY`.

### Phase 2: UI 实现 (UI Implementation)
- [ ] 更新 `src/components/ui`: 确保 Dialog, Textarea, Button 等组件可用。
- [ ] 创建 `ChatBox` 组件: 实现消息列表、输入框布局。
- [ ] 修改 `Header`: 添加 AI Agent 入口按钮。
- [ ] 状态管理: 在 `page.tsx` 或 Context 中管理 Modal 的开关状态。

### Phase 3: 上下文获取逻辑 (Context Logic)
- [ ] 实现 `getSlideContext(currentSlideIndex, allSlides)` 函数，提取 5 张幻灯片的文本内容。

### Phase 4: 后端 API 开发 (Backend Development)
- [ ] 创建 `/api/chat/route.ts`。
- [ ] 集成 OpenAI SDK。
- [ ] 实现 System Prompt 构建逻辑 (注入 Context & Time)。
- [ ] 实现 Streaming Response (使用 Vercel AI SDK 的 `streamText` 或原生实现)。

### Phase 5: 工具集成 (Tool Integration)
- [ ] 在 API 中定义 `search_web` tool (Function Calling).
- [ ] 集成 Tavily API 执行搜索。
- [ ] 处理 Tool Call 的往返逻辑。

### Phase 6: 测试与优化 (Testing & Polish)
- [ ] 测试多轮对话。
- [ ] 测试联网搜索触发场景。
- [ ] 优化 UI (Loading 状态, Markdown 样式).
