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

- **框架**: Next.js 16 (App Router)
- **样式**: Tailwind CSS v4 + shadcn/ui
- **数据库**: Drizzle ORM + SQLite (开发) / MySQL (生产)
- **代码编辑器**: Monaco Editor
- **图表**: ECharts
- **PDF导出**: Puppeteer
- **拖拽排序**: @dnd-kit

## 开始使用

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制环境变量模板文件：

```bash
cp .env.example .env
```

开发环境默认使用 SQLite，无需修改配置。生产环境配置请参考 [数据库配置文档](./docs/database-config.md)。

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

## 数据库

### 开发环境（SQLite）

默认使用 SQLite，无需额外配置。

### 生产环境（MySQL）

1. 修改 `.env` 文件：

```env
DATABASE_TYPE=mysql
MYSQL_URL=mysql://user:password@host:3306/database
```

2. 应用数据库迁移：

```bash
npm run db:push
```

详细配置说明请参考：[数据库配置文档](./docs/database-config.md)

### 数据库命令

```bash
# 生成迁移文件
npm run db:generate

# 应用数据库更改
npm run db:push

# 打开数据库管理界面
npm run db:studio

# 从 SQLite 迁移到 MySQL
npm run db:migrate
```

## License

MIT
