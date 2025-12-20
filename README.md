# 宏观报告Studio

宏观经济报告PPT Studio - 可视化配置与渲染PPT页面的Web应用。

## 功能特性

- **可视化配置**: 通过表单配置幻灯片标题、论点和图表
- **源码模式**: 直接编辑JSON源码配置PPT
- **多种图表支持**: 表格、ECharts图形、图片
- **幻灯片管理**: 添加、编辑、删除、拖拽排序
- **全屏演示**: 支持滚轮/键盘切换幻灯片
- **PDF导出**: 后端渲染生成PDF文件
- **数据持久化**: 发布功能保存PPT到数据库

## 技术栈

- **框架**: Next.js 15 (App Router)
- **样式**: Tailwind CSS + shadcn/ui
- **数据库**: Drizzle ORM + SQLite
- **代码编辑器**: Monaco Editor
- **图表**: ECharts
- **PDF导出**: Puppeteer
- **拖拽排序**: @dnd-kit

## 开始使用

### 安装依赖

```bash
npm install
```

### 初始化数据库

```bash
npm run db:push
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
src/
├── app/
│   ├── page.tsx              # 主页面
│   ├── print/page.tsx        # PDF打印页面
│   └── api/
│       ├── report/           # PPT CRUD API
│       └── export-pdf/       # PDF导出API
├── components/
│   ├── slide/               # 幻灯片渲染组件
│   ├── editor/              # 编辑器组件
│   ├── presentation/        # 演示组件
│   └── ui/                  # shadcn组件
├── lib/
│   ├── db/                  # 数据库配置
│   └── pdf-generator.ts     # PDF生成器
└── types/
    └── slide.ts             # 类型定义
```

## 幻灯片JSON格式

```json
{
  "title": "示例标题",
  "content": ["论点1", "论点2"],
  "charts": [
    {
      "type": "table",
      "data": {
        "col1": [1, 2, 3],
        "col2": [4, 5, 6]
      }
    },
    {
      "type": "echarts",
      "data": {
        "xAxis": { "type": "category", "data": ["Mon", "Tue", "Wed"] },
        "yAxis": { "type": "value" },
        "series": [{ "data": [150, 230, 224], "type": "line" }]
      }
    },
    {
      "type": "image",
      "data": { "src": "https://example.com/image.png" }
    }
  ]
}
```

## 数据库命令

```bash
# 生成迁移文件
npm run db:generate

# 应用数据库更改
npm run db:push

# 打开数据库管理界面
npm run db:studio
```

## License

MIT
