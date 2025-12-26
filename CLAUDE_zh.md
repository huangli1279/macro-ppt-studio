# CLAUDE_zh.md

本文件为 Claude Code (claude.ai/code) 在此代码仓库中工作时提供指导。

## 项目概述

宏观 PPT Studio 是一个基于 Next.js 16 的 Web 应用，用于创建和管理宏观经济报告演示文稿。用户可以通过可视化表单编辑器或 JSON 源代码配置幻灯片，支持表格、ECharts 图表和图片。应用包含幻灯片管理、PDF 导出、全屏演示模式以及通过 Supabase 实现的数据持久化。

## 命令

### 开发
```bash
npm run dev        # 启动开发服务器 (http://localhost:3000)
npm run build      # 构建生产版本
npm run start      # 启动生产服务器
npm run lint       # 运行 ESLint
```

### 数据库 (Drizzle ORM + Supabase)
```bash
npm run db:generate  # 生成迁移文件
npm run db:push      # 推送 schema 更改到数据库
npm run db:studio    # 打开 Drizzle Studio 进行数据库管理
```

## 架构

### 核心数据流

1. **幻灯片数据结构** (`src/types/slide.ts`):
   - `PPTReport`: `SlideData` 对象数组，表示完整的演示文稿
   - `SlideData`: 包含 `title?`、`content[]` 和 `charts[]`
   - `ChartConfig`: `table`、`echarts` 或 `image` 类型联合及关联数据
   - 提供类型守卫: `isTableData()`、`isImageData()`、`isStyledCellValue()`

2. **状态管理** (`src/app/page.tsx`):
   - 单一数据源: `slides` 状态 (PPTReport)
   - 双模式: `preview` (可视化预览) vs `source` (Monaco JSON 编辑器)
   - 预览模式和源码模式之间双向同步状态
   - 添加/编辑/删除幻灯片时自动保存到 API

3. **季度系统**:
   - 报告按季度组织 (如 "2024Q4")
   - `ppt_quarter` 表存储季度标识符
   - `ppt_reports` 表存储每个季度的 JSON (外键关联)
   - 选择季度后从数据库加载对应报告

### 组件架构

**编辑器组件** (`src/components/editor/`):
- `ThumbnailPanel`: 左侧边栏，包含幻灯片缩略图、拖拽排序、插入/删除/编辑控制
- `SlidePreview`: 主预览区域，以 16:9 宽高比显示当前幻灯片
- `SlideModal`: 添加/编辑幻灯片的表单对话框 (标题、0-4 个论点、0-4 个图表)
- `CodeEditor`: Monaco Editor 包装器，用于 JSON 源码编辑

**幻灯片渲染** (`src/components/slide/`):
- `SlideRenderer`: 主渲染器，根据论点/图表数量动态布局
  - 支持 4 种布局模式: 2+1、2+2、3+3、4+4 (论点+图表)
  - 根据模式响应式调整: `isThumbnail`、`isFullscreen` 或普通模式
  - 渲染微众银行 logo 和页码
- `TableChart`: 支持单元格 CSS 样式的表格
- `EChartsChart`: 使用 `echarts-for-react` 集成 ECharts
- `ImageChart`: Next.js Image 组件，用于外部图片 URL

**演示** (`src/components/presentation/`):
- `FullscreenPresenter`: 全屏幻灯片放映，支持键盘/鼠标滚轮导航

### API 路由

- `GET/POST /api/quarters`: 列出/创建季度
- `GET/POST /api/report`: 获取/保存指定季度的 PPT JSON
- `POST /api/export-pdf`: 使用 Puppeteer 生成 PDF

### PDF 生成

位于 `src/lib/pdf-generator.ts`:
- 使用 Puppeteer (开发环境: `puppeteer`，生产环境: `@sparticuz/chromium`)
- 在 `/print?slides={base64}&index={n}` 单独渲染每张幻灯片
- 等待 `window.__PRINT_READY__` 信号后再生成 PDF
- 使用 `pdf-lib` 合并单张幻灯片 PDF

## 关键模式

### 只读模式
- URL 参数 `?type=write` 控制编辑模式
- 默认为只读: 隐藏添加/编辑/删除/保存按钮，禁用拖拽
- 组件中检查 `isReadOnly` 属性

### 幻灯片布局逻辑

`SlideRenderer` 组件根据论点/图表数量确定布局:
- **2 论点, 1 图表**: 垂直堆叠 (论点 → 全宽图表)
- **2 论点, 2 图表**: 垂直堆叠 (论点 → 并排图表)
- **3 论点, 3 图表**: 论点 2+1 分栏，图表: 左侧全高 + 右侧堆叠 2 个
- **4 论点, 4 图表**: 论点 2+2 分栏，图表 2x2 网格
- **回退方案**: 灵活网格布局

### 源码 ↔ 预览同步

从源码切换到预览时:
1. 解析 Monaco 编辑器中的 JSON
2. 验证是否为数组
3. 更新 `slides` 状态
4. 如果无效，显示警告并保持在源码模式

### 拖拽缩略图

使用 `@dnd-kit` 库:
- `DndContext` 包装可排序项
- `SortableContext` 提供项 ID: `slide-${index}`
- 每个缩略图使用 `useSortable` hook
- 放置后使用 `arrayMove()` 重排序
- 如有需要更新 `selectedIndex`

## 样式

- **Tailwind CSS v4** 使用 `@/*` 路径别名
- 使用 `@/lib/utils` 中的 `cn()` 工具处理条件类名
- 配色方案: slate 灰色系，`#1a4f99` 品牌蓝色
- shadcn/ui 组件位于 `src/components/ui/`

## 重要约束

1. **16:9 宽高比**: 所有幻灯片以 16:9 渲染 (基础 960x540px)
2. **单元格样式**: 表格单元格通过 `StyledCellValue` 类型支持 CSS
3. **ECharts 配置**: 直接透传 ECharts 选项
4. **打印就绪**: PDF 生成需要 `window.__PRINT_READY__ = true` 信号
5. **季度选择**: 保存/加载操作必需

## 路径别名

使用 `@/*` 引用 `src/*`:
- `@/components/ui/button` → `src/components/ui/button`
- `@/types/slide` → `src/types/slide`
- `@/lib/utils` → `src/lib/utils`
