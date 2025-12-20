# 宏观经济报告 PPT Studio - Cursor 规则

## 项目概述

这是一个宏观经济报告 PPT Studio Web 应用，用于通过可视化配置或 JSON 源码方式创建、编辑和展示 PPT 幻灯片。

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS v4
- **UI 组件库**: shadcn/ui (基于 Radix UI)
- **数据库 ORM**: Drizzle ORM
- **数据库**: SQLite (开发环境) / MySQL (生产环境)
- **图表库**: ECharts + echarts-for-react
- **代码编辑器**: Monaco Editor (@monaco-editor/react)
- **拖拽排序**: @dnd-kit
- **PDF 导出**: Puppeteer

## 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── api/               # API 路由
│   │   ├── export-pdf/    # PDF 导出接口
│   │   └── report/        # 报告 CRUD 接口
│   ├── print/             # 打印页面（PDF 生成用）
│   └── page.tsx           # 主页面
├── components/
│   ├── editor/            # 编辑器相关组件
│   │   ├── CodeEditor.tsx      # JSON 源码编辑器
│   │   ├── SlideModal.tsx      # 幻灯片配置模态框
│   │   ├── SlidePreview.tsx    # 幻灯片预览组件
│   │   └── ThumbnailPanel.tsx  # 左侧缩略图面板
│   ├── presentation/      # 演示相关组件
│   │   └── FullscreenPresenter.tsx  # 全屏演示组件
│   ├── slide/             # 幻灯片渲染组件
│   │   ├── SlideRenderer.tsx   # 幻灯片渲染器
│   │   ├── EChartsChart.tsx    # ECharts 图表组件
│   │   ├── TableChart.tsx      # 表格组件
│   │   └── ImageChart.tsx      # 图片组件
│   └── ui/                # shadcn/ui 基础组件
├── lib/
│   ├── db/                # 数据库相关
│   │   ├── index.ts       # 数据库连接
│   │   └── schema.ts      # Drizzle 表结构定义
│   ├── pdf-generator.ts   # PDF 生成逻辑
│   └── utils.ts           # 工具函数
└── types/
    └── slide.ts           # 幻灯片类型定义
```

## 编码规范

### TypeScript

- 始终使用 TypeScript 严格模式
- 为所有函数参数和返回值添加类型注解
- 优先使用 `interface` 定义对象类型，复杂联合类型使用 `type`
- 避免使用 `any`，必要时使用 `unknown` 并进行类型守卫

### React 组件

- 使用函数组件和 React Hooks
- 组件文件使用 PascalCase 命名（如 `SlideRenderer.tsx`）
- 优先使用 `'use client'` 指令标记客户端组件
- 服务端组件保持默认，不添加指令
- Props 接口命名规范：`组件名Props`（如 `SlideRendererProps`）

### 样式

- 使用 Tailwind CSS 进行样式编写
- 遵循移动端优先的响应式设计
- 使用 `cn()` 工具函数合并类名
- 保持 16:9 的幻灯片宽高比

### 文件命名

- React 组件：PascalCase（如 `CodeEditor.tsx`）
- 工具函数/hooks：camelCase（如 `utils.ts`）
- 类型定义：camelCase（如 `slide.ts`）

## 幻灯片数据结构

### 单页幻灯片 JSON 格式

```typescript
interface Slide {
  title?: string;           // 标题（可选，为空则不占高度）
  content?: string[];       // 论点数组（0-4个）
  charts?: Chart[];         // 图表数组（0-4个）
}

interface Chart {
  type: 'table' | 'echarts' | 'image';
  data: TableData | EChartsOption | ImageData;
}

// 表格数据格式
interface TableData {
  [columnName: string]: (string | number | CellStyle)[];
}

interface CellStyle {
  value: string | number;
  'font-weight'?: string;
  color?: string;
  // 其他 CSS 属性
}

// 图片数据格式
interface ImageData {
  src: string;
}
```

### 完整 PPT JSON 格式

```typescript
interface PPTReport {
  slides: Slide[];
}
```

## 布局规则

幻灯片布局根据论点和图表数量自动调整：

- **2论点 + 1图表**: 左侧论点，右侧单个图表
- **2论点 + 2图表**: 左侧论点，右侧 2 个图表纵向排列
- **3论点 + 3图表**: 3 行，每行 1 论点 + 1 图表
- **4论点 + 4图表**: 4 行，每行 1 论点 + 1 图表

## API 接口

### 获取/保存报告

- `GET /api/report` - 获取最新发布的 PPT 配置
- `POST /api/report` - 保存/发布 PPT 配置

### 导出 PDF

- `POST /api/export-pdf` - 导出 PDF 文件

## 数据库操作

使用 Drizzle ORM 进行数据库操作：

```typescript
// 查询示例
import { db } from '@/lib/db';
import { pptReports } from '@/lib/db/schema';

const reports = await db.select().from(pptReports).orderBy(desc(pptReports.createTime)).limit(1);

// 插入示例
await db.insert(pptReports).values({ report: jsonString });
```

## 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 数据库迁移生成
npm run db:generate

# 数据库迁移推送
npm run db:push

# Drizzle Studio（数据库可视化）
npm run db:studio
```

## 注意事项

1. **ECharts 配置**: 图表配置完全遵循 ECharts 官方规范
2. **PDF 导出**: 使用 Puppeteer 无头浏览器渲染，确保与全屏演示效果一致
3. **响应式**: 幻灯片预览区域保持 16:9 宽高比
4. **拖拽排序**: 使用 @dnd-kit 实现缩略图拖拽排序
5. **Monaco Editor**: JSON 编辑器提供语法高亮和错误提示

## UI/UX 设计原则

- 现代、美观、简约的设计风格
- 深色主题优先
- 清晰的视觉层次
- 流畅的交互动画
- 直观的操作反馈

## 常见操作

### 新增幻灯片
1. 点击缩略图面板底部的 "+" 按钮
2. 在模态框中配置标题、论点和图表
3. 可切换到源码模式直接编辑 JSON
4. 点击确认添加

### 编辑幻灯片
1. 鼠标悬停在缩略图右上角，点击 "..." 图标
2. 进入编辑模态框修改配置

### 插入幻灯片
1. 鼠标悬停在两个缩略图之间
2. 点击出现的小 "+" 号
3. 配置新幻灯片

### 调整顺序
- 长按缩略图拖拽到目标位置

## 错误处理

- API 请求失败时显示友好的错误提示
- JSON 解析错误时在编辑器中高亮显示
- 网络异常时提供重试选项

