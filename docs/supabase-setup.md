# Supabase 数据库设置指南

本项目使用 Supabase 作为数据库（基于 PostgreSQL），本文档将指导你完成数据库设置。

## 为什么选择 Supabase？

- ✅ **云端托管**: 无需本地安装数据库
- ✅ **自动备份**: 数据自动备份，无需担心数据丢失
- ✅ **自动扩展**: 根据需求自动扩展
- ✅ **免费层级**: 提供免费层级，足够开发和小规模使用
- ✅ **简单部署**: 无需编译 native 模块（better-sqlite3），部署更简单
- ✅ **实时功能**: 提供实时数据库功能（未来可用）

## 步骤 1: 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并注册/登录账号
2. 点击 "New Project" 创建新项目
3. 填写项目信息：
   - **Name**: 项目名称（如 `hongguanai-ppt`）
   - **Database Password**: 设置一个强密码（请记住这个密码）
   - **Region**: 选择离你最近的区域（如 `Southeast Asia (Singapore)`）
   - **Pricing Plan**: 选择 Free 或其他计划
4. 点击 "Create new project" 并等待项目创建完成（约 2 分钟）

## 步骤 2: 获取数据库连接字符串

项目创建完成后：

1. 在项目面板左侧导航栏，点击 **Settings** (⚙️ 设置图标)
2. 点击 **Database** 选项
3. 向下滚动到 **Connection string** 部分
4. 选择 **Connection pooling** 标签（推荐）
5. 在 **Mode** 下拉菜单中选择 **Session**
6. 复制显示的连接字符串，格式类似：
   ```
   postgres://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
7. 将 `[YOUR-PASSWORD]` 替换为你在步骤 1 中设置的密码

> **提示**: Connection pooling 模式提供更好的性能和连接管理，推荐用于生产环境。

## 步骤 3: 配置本地环境变量

1. 在项目根目录复制 `.env.example` 为 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，将 `DATABASE_URL` 替换为你的 Supabase 连接字符串：
   ```env
   DATABASE_URL=postgres://postgres.xxxxxxxxxxxx:your_password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

3. 保存文件

> **安全提示**: `.env` 文件包含敏感信息，已被 `.gitignore` 忽略，不会提交到 Git 仓库。

## 步骤 4: 初始化数据库表结构

运行以下命令创建数据库表：

```bash
npm run db:push
```

这个命令会：
- 读取 `src/lib/db/schema.ts` 中定义的表结构
- 在 Supabase 数据库中创建 `ppt_reports` 表

## 步骤 5: 验证连接

启动开发服务器：

```bash
npm run dev
```

如果看到控制台输出：
```
📊 Database: Supabase (PostgreSQL) connected
```

说明数据库连接成功！

## 常用数据库命令

```bash
# 应用数据库架构更改
npm run db:push

# 生成数据库迁移文件
npm run db:generate

# 打开 Drizzle Studio（数据库可视化界面）
npm run db:studio
```

## 在 Supabase Dashboard 中查看数据

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 点击左侧导航栏的 **Table Editor**
4. 选择 `ppt_reports` 表查看数据

## 部署到生产环境

部署到 Vercel、Netlify 等平台时：

1. 在平台的环境变量设置中添加 `DATABASE_URL`
2. 值为你的 Supabase 连接字符串
3. 重新部署应用

## 故障排查

### 连接失败

如果遇到连接错误，请检查：

1. **密码是否正确**: 确认 `DATABASE_URL` 中的密码与创建项目时设置的密码一致
2. **特殊字符编码**: 如果密码包含特殊字符（如 `@`, `#`, `%` 等），需要进行 URL 编码
3. **网络连接**: 确认网络可以访问 Supabase 服务器
4. **项目状态**: 在 Supabase Dashboard 中确认项目状态为 "Active"

### URL 编码特殊字符

如果密码包含特殊字符，使用在线工具进行 URL 编码，或使用以下对照表：

- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`
- `=` → `%3D`

例如，如果密码是 `pass@word#123`，应该编码为 `pass%40word%23123`

### 重置数据库密码

如果忘记密码：

1. 进入 Supabase Dashboard
2. Settings -> Database
3. 向下滚动到 "Reset database password"
4. 设置新密码并更新 `.env` 文件

## 数据迁移

如果你之前使用 SQLite 或 MySQL，需要迁移数据：

### 方法 1: 手动导出导入

1. 从旧数据库导出 `ppt_reports` 表数据
2. 在 Supabase Dashboard 的 Table Editor 中手动导入
3. 或使用 SQL 编辑器运行 INSERT 语句

### 方法 2: 使用脚本

可以编写一个 Node.js 脚本读取旧数据库并写入 Supabase：

```typescript
// 示例迁移脚本
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { pptReports } from './src/lib/db/schema';

// 旧数据库数据（从 SQLite/MySQL 读取）
const oldData = [...]; // 你的旧数据

// 连接 Supabase
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

// 批量插入
for (const record of oldData) {
  await db.insert(pptReports).values({
    report: record.report,
    createTime: record.createTime,
  });
}

console.log('Migration completed!');
```

## 相关资源

- [Supabase 官方文档](https://supabase.com/docs)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)

## 需要帮助？

如果遇到问题，可以：

1. 查看 [Supabase 社区](https://github.com/supabase/supabase/discussions)
2. 查看 [Drizzle Discord](https://discord.gg/drizzle)
3. 查看项目的 GitHub Issues

