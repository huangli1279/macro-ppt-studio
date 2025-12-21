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
- **数据库**: Drizzle ORM + MySQL
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

复制环境变量模板文件并配置 MySQL 数据库：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置 MySQL 连接信息：

```env
MYSQL_URL=mysql://user:password@localhost:3306/hongguanai
```

详细配置请参考 [数据库配置文档](./docs/database-config.md)。

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

## Docker 部署 🐳

### 快速开始

使用 Docker Compose 一键启动：

```bash
# 1. 复制环境变量模板
cp .env.docker.example .env.docker

# 2. 修改 .env.docker 中的数据库密码

# 3. 启动服务（包含 MySQL 数据库）
make dev-up

# 4. 访问应用
open http://localhost:3000
```

### 常用命令

```bash
# 启动服务
make dev-up

# 停止服务
make dev-down

# 查看日志
make logs-app

# 重新构建
make rebuild

# 健康检查
make health
```

### 详细文档

- 📖 [完整 Docker 部署指南](./docs/docker-deployment.md)
- 🧪 [测试 Docker 配置](./scripts/test-docker.sh)

## 数据库

本项目使用 MySQL 数据库。

### 本地开发

1. 确保 MySQL 服务已启动
2. 创建数据库：`CREATE DATABASE hongguanai;`
3. 修改 `.env` 文件：

```env
MYSQL_URL=mysql://user:password@localhost:3306/hongguanai
```

4. 应用数据库迁移：

```bash
npm run db:push
```

### Docker 部署

使用 `docker-compose.yml` 自动配置 MySQL：

```bash
make dev-up  # 自动启动 MySQL 并连接
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

# 测试数据库连接
npm run db:test
```

## License

MIT
