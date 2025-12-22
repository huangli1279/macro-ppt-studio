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
- **数据库**: Drizzle ORM + Supabase (PostgreSQL)
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

编辑 `.env` 文件，添加你的 Supabase 数据库连接字符串：

```env
DATABASE_URL=postgres://postgres.xxxxxxxxxxxx:your_password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

获取 Supabase 数据库 URL：
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 Settings -> Database
4. 找到 "Connection string" -> "Connection pooling"
5. 复制连接字符串并替换 `.env` 中的 `DATABASE_URL`

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

本项目使用 **Supabase** 作为数据库（基于 PostgreSQL）。

### 设置步骤

1. 在 [Supabase](https://supabase.com) 创建一个新项目
2. 获取数据库连接字符串（Settings -> Database -> Connection pooling）
3. 将连接字符串添加到 `.env` 文件的 `DATABASE_URL` 变量
4. 运行数据库迁移：

```bash
npm run db:push
```

### 数据库命令

```bash
# 生成迁移文件
npm run db:generate

# 应用数据库更改
npm run db:push

# 打开数据库管理界面
npm run db:studio
```

### 为什么选择 Supabase？

- ✅ 云端托管，无需本地数据库
- ✅ 自动备份和扩展
- ✅ 免费层级足够开发使用
- ✅ 提供实时数据库功能
- ✅ 无需编译 native 模块，部署更简单

## License

MIT
