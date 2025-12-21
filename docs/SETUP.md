# 数据库配置总结

## ✅ 已完成的更改

### 1. 核心文件修改

- **`src/lib/db/index.ts`**: 支持 SQLite 和 MySQL 双数据库连接
- **`drizzle.config.ts`**: 根据环境变量动态切换数据库配置
- **`package.json`**: 添加 MySQL 相关依赖和数据库脚本

### 2. 新增文件

#### 环境配置文件
- **`.env.example`**: 环境变量模板（所有可用选项）
- **`.env`**: 实际使用的环境变量配置文件（开发/生产通用）
- **`.gitignore`**: 添加环境变量文件忽略规则

#### 文档文件
- **`docs/database-config.md`**: 完整的数据库配置说明
- **`docs/deployment.md`**: 生产环境部署指南
- **`scripts/README.md`**: 脚本使用说明

#### 工具脚本
- **`scripts/migrate-sqlite-to-mysql.ts`**: SQLite 到 MySQL 的数据迁移脚本
- **`scripts/test-db-connection.ts`**: 数据库连接测试脚本

### 3. 文档更新

- **`README.md`**: 添加数据库配置说明
- **`CLAUDE.md`**: 更新数据库相关章节

## 📦 新增依赖

```json
{
  "dependencies": {
    "dotenv": "^16.4.7",      // 环境变量加载
    "mysql2": "^3.11.5"       // MySQL 驱动
  },
  "devDependencies": {
    "tsx": "^4.19.2"          // TypeScript 脚本执行器
  }
}
```

## 🚀 使用方法

### 开发环境（SQLite）

1. 复制并使用默认配置：
   ```bash
   cp .env.example .env
   npm install
   npm run db:push
   npm run dev
   ```

### 生产环境（MySQL）

1. 创建 MySQL 数据库
2. 复制并修改 `.env` 文件：
   ```bash
   cp .env.example .env
   # 编辑 .env 文件
   ```
   ```env
   DATABASE_TYPE=mysql
   MYSQL_URL=mysql://user:password@host:3306/database
   ```
3. 初始化并启动：
   ```bash
   npm install
   npm run db:push
   npm run build
   npm start
   ```

## 🛠 可用命令

| 命令 | 说明 |
|------|------|
| `npm run db:test` | 测试数据库连接 |
| `npm run db:generate` | 生成数据库迁移文件 |
| `npm run db:push` | 应用数据库变更 |
| `npm run db:studio` | 打开数据库管理界面 |
| `npm run db:migrate` | 从 SQLite 迁移到 MySQL |

## 🔧 环境变量

### SQLite（开发环境）

```env
DATABASE_TYPE=sqlite
SQLITE_DB_PATH=./data/ppt.db
```

### MySQL（生产环境）

**方式 1: 连接字符串（推荐）**
```env
DATABASE_TYPE=mysql
MYSQL_URL=mysql://user:password@host:3306/database
```

**方式 2: 独立参数**
```env
DATABASE_TYPE=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=hongguanai
```

## 📝 特性说明

### 自动识别数据库类型

应用启动时会根据 `DATABASE_TYPE` 环境变量自动选择数据库：
- `sqlite`（默认）: 使用 SQLite
- `mysql`: 使用 MySQL

启动日志会显示当前使用的数据库类型：
```
📊 Database: SQLite connected at /path/to/ppt.db
```
或
```
📊 Database: MySQL connected
```

### 连接池

MySQL 使用连接池管理连接，自动优化性能。

### 兼容性

代码完全兼容 SQLite 和 MySQL，无需修改业务逻辑代码。

## 🔒 安全建议

1. **不要提交敏感文件**: `.env` 文件已添加到 `.gitignore`，请勿提交到版本控制
2. **使用强密码**: 生产环境的数据库密码应足够复杂
3. **限制访问**: 仅允许应用服务器 IP 访问数据库
4. **定期备份**: 设置自动备份计划

## 📚 相关文档

- [数据库配置详细说明](./database-config.md)
- [生产环境部署指南](./deployment.md)
- [项目 README](../README.md)

## 🐛 故障排查

### 测试数据库连接

```bash
npm run db:test
```

### 常见问题

1. **连接失败**: 检查数据库服务是否运行，验证连接信息
2. **权限错误**: 确保数据库用户有足够的权限
3. **表不存在**: 运行 `npm run db:push` 创建表
4. **端口占用**: 检查 MySQL 端口是否被其他应用占用

## ✨ 下一步

1. 安装依赖：`npm install`
2. 测试连接：`npm run db:test`
3. 开发环境：`npm run dev`
4. 生产部署：参考 [deployment.md](./deployment.md)

