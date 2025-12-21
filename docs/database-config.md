# 数据库配置说明

## 快速开始

本项目使用 MySQL 数据库。复制环境变量模板并根据需要修改：

```bash
cp .env.example .env
```

## MySQL 数据库配置

### 1. 准备 MySQL 数据库

在生产服务器上创建数据库：

```sql
CREATE DATABASE hongguanai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hongguanai_user'@'%' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON hongguanai.* TO 'hongguanai_user'@'%';
FLUSH PRIVILEGES;
```

### 2. 配置环境变量

创建或修改 `.env` 文件：

```env
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
| `MYSQL_URL` | MySQL 连接字符串 | - | `mysql://user:pass@host:3306/db` |
| `MYSQL_HOST` | MySQL 主机地址 | `localhost` | `localhost` 或 `192.168.1.100` |
| `MYSQL_PORT` | MySQL 端口 | `3306` | `3306` |
| `MYSQL_USER` | MySQL 用户名 | `root` | `hongguanai_user` |
| `MYSQL_PASSWORD` | MySQL 密码 | - | `your_secure_password` |
| `MYSQL_DATABASE` | MySQL 数据库名 | `hongguanai` | `hongguanai` |

## 数据备份与恢复

### 备份数据

使用 Drizzle Studio 或 mysqldump 导出数据：

```bash
# 使用 Drizzle Studio 可视化导出
npm run db:studio

# 使用 mysqldump 命令行导出
mysqldump -u hongguanai_user -p hongguanai > backup.sql
```

### 恢复数据

```bash
# 恢复 SQL 备份
mysql -u hongguanai_user -p hongguanai < backup.sql
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
4. **性能**：建议根据实际负载调整 MySQL 配置参数
5. **日志**：应用启动时会在控制台输出数据库连接状态

