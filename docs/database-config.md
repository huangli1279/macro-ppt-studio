# 数据库配置说明

## 快速开始

复制环境变量模板并根据需要修改：

```bash
cp .env.example .env
```

## 开发环境（SQLite）

开发环境默认使用 SQLite 数据库，无需额外配置。

### 配置文件：`.env`

```env
DATABASE_TYPE=sqlite
SQLITE_DB_PATH=./data/ppt.db
```

### 初始化数据库

```bash
# 生成迁移文件
npm run db:generate

# 推送到数据库
npm run db:push
```

## 生产环境（MySQL）

生产环境使用 MySQL 数据库。

### 1. 准备 MySQL 数据库

在生产服务器上创建数据库：

```sql
CREATE DATABASE hongguanai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hongguanai_user'@'%' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON hongguanai.* TO 'hongguanai_user'@'%';
FLUSH PRIVILEGES;
```

### 2. 配置环境变量

在生产服务器上创建或修改 `.env` 文件：

```env
# 使用 MySQL
DATABASE_TYPE=mysql

# 方式 1: 使用连接字符串（推荐）
MYSQL_URL=mysql://hongguanai_user:your_secure_password@localhost:3306/hongguanai

# 方式 2: 使用单独的连接参数
# MYSQL_HOST=localhost
# MYSQL_PORT=3306
# MYSQL_USER=hongguanai_user
# MYSQL_PASSWORD=your_secure_password
# MYSQL_DATABASE=hongguanai
```

### 3. 安装依赖

```bash
npm install
```

### 4. 生成并应用数据库迁移

```bash
# 生成 MySQL 迁移文件
npm run db:generate

# 推送表结构到 MySQL
npm run db:push
```

### 5. 启动应用

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 环境变量说明

| 变量名 | 说明 | 默认值 | 示例 |
|--------|------|--------|------|
| `DATABASE_TYPE` | 数据库类型 | `sqlite` | `sqlite` 或 `mysql` |
| `SQLITE_DB_PATH` | SQLite 数据库文件路径 | `./data/ppt.db` | `./data/ppt.db` |
| `MYSQL_URL` | MySQL 连接字符串 | - | `mysql://user:pass@host:3306/db` |
| `MYSQL_HOST` | MySQL 主机地址 | `localhost` | `localhost` 或 `192.168.1.100` |
| `MYSQL_PORT` | MySQL 端口 | `3306` | `3306` |
| `MYSQL_USER` | MySQL 用户名 | `root` | `hongguanai_user` |
| `MYSQL_PASSWORD` | MySQL 密码 | - | `your_secure_password` |
| `MYSQL_DATABASE` | MySQL 数据库名 | `hongguanai` | `hongguanai` |

## 数据迁移

### 从 SQLite 迁移到 MySQL

如果需要将开发环境的 SQLite 数据迁移到生产环境的 MySQL：

#### 方法 1: 使用 Drizzle Studio

```bash
# 1. 在开发环境导出数据
npm run db:studio
# 手动导出数据

# 2. 切换到 MySQL 配置
# 修改 .env.local 中的 DATABASE_TYPE=mysql

# 3. 导入数据到 MySQL
npm run db:studio
# 手动导入数据
```

#### 方法 2: 编写迁移脚本

创建一个迁移脚本来读取 SQLite 数据并写入 MySQL：

```typescript
// scripts/migrate-sqlite-to-mysql.ts
import { drizzle as sqliteDrizzle } from "drizzle-orm/better-sqlite3";
import { drizzle as mysqlDrizzle } from "drizzle-orm/mysql2";
import Database from "better-sqlite3";
import mysql from "mysql2/promise";
import * as schema from "../src/lib/db/schema";

async function migrate() {
  // 连接 SQLite
  const sqlite = new Database("./data/ppt.db");
  const sqliteDb = sqliteDrizzle(sqlite, { schema });

  // 连接 MySQL
  const mysqlConnection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "hongguanai",
  });
  const mysqlDb = mysqlDrizzle(mysqlConnection, { schema });

  // 读取 SQLite 数据
  const reports = await sqliteDb.select().from(schema.pptReports).all();

  // 写入 MySQL
  for (const report of reports) {
    await mysqlDb.insert(schema.pptReports).values(report);
  }

  console.log(`Migrated ${reports.length} reports successfully!`);
  
  sqlite.close();
  await mysqlConnection.end();
}

migrate().catch(console.error);
```

运行迁移：

```bash
npx tsx scripts/migrate-sqlite-to-mysql.ts
```

## Docker 部署（可选）

如果使用 Docker 部署，可以使用以下 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: hongguanai
      MYSQL_USER: hongguanai_user
      MYSQL_PASSWORD: hongguanai_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  app:
    build: .
    environment:
      DATABASE_TYPE: mysql
      MYSQL_URL: mysql://hongguanai_user:hongguanai_password@mysql:3306/hongguanai
    ports:
      - "3000:3000"
    depends_on:
      - mysql

volumes:
  mysql_data:
```

## 故障排查

### 连接失败

1. 检查 MySQL 服务是否运行：
   ```bash
   systemctl status mysql
   ```

2. 检查防火墙设置：
   ```bash
   sudo ufw allow 3306
   ```

3. 检查 MySQL 用户权限：
   ```sql
   SHOW GRANTS FOR 'hongguanai_user'@'%';
   ```

### 字符编码问题

确保数据库使用 UTF-8 编码：

```sql
ALTER DATABASE hongguanai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 性能优化

对于生产环境的 MySQL，建议添加索引：

```sql
-- 添加创建时间索引（如果需要频繁按时间查询）
CREATE INDEX idx_create_time ON ppt_reports(create_time);
```

## 注意事项

1. **安全性**：`.env` 文件包含敏感信息，不要提交到 Git 仓库（已在 .gitignore 中配置）
2. **备份**：定期备份 MySQL 数据库
3. **连接池**：MySQL 客户端已配置连接池，无需额外配置
4. **性能**：生产环境建议使用 MySQL 而非 SQLite，以支持更高并发
5. **日志**：应用启动时会在控制台输出当前使用的数据库类型

