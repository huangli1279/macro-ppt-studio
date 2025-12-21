# 生产环境部署指南

本指南将帮助你将应用部署到生产环境。

## 前提条件

- Node.js 18+ 已安装
- MySQL 8.0+ 已安装并运行
- 生产服务器访问权限

## 部署步骤

### 1. 准备生产服务器

```bash
# 克隆代码仓库
git clone <your-repo-url>
cd hongguanai4

# 安装依赖
npm install
```

### 2. 配置 MySQL 数据库

登录 MySQL 并创建数据库：

```sql
CREATE DATABASE hongguanai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hongguanai_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON hongguanai.* TO 'hongguanai_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 配置环境变量

创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入正确的数据库连接信息：

```env
DATABASE_TYPE=mysql
MYSQL_URL=mysql://hongguanai_user:your_secure_password@localhost:3306/hongguanai
```

### 4. 初始化数据库

```bash
# 生成并推送数据库表结构
npm run db:push
```

### 5. 构建生产版本

```bash
npm run build
```

### 6. 启动应用

```bash
# 直接启动
npm start

# 或使用 PM2 管理进程（推荐）
npm install -g pm2
pm2 start npm --name "hongguanai" -- start
pm2 save
pm2 startup
```

### 7. 配置反向代理（可选）

使用 Nginx 作为反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

重启 Nginx：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 数据迁移（如果从 SQLite 迁移）

如果你有开发环境的 SQLite 数据需要迁移到生产环境：

1. 将 SQLite 数据库文件（`data/ppt.db`）复制到生产服务器

2. 在生产服务器上配置好 MySQL 连接信息（`.env`）

3. 运行迁移脚本：

```bash
npm run db:migrate
```

## 使用 Docker 部署

### 1. 创建 Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
```

### 2. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: hongguanai
      MYSQL_USER: hongguanai_user
      MYSQL_PASSWORD: hongguanai_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  app:
    build: .
    restart: always
    environment:
      DATABASE_TYPE: mysql
      MYSQL_URL: mysql://hongguanai_user:hongguanai_password@mysql:3306/hongguanai
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      mysql:
        condition: service_healthy

volumes:
  mysql_data:
```

### 3. 启动容器

```bash
docker-compose up -d
```

### 4. 初始化数据库

```bash
docker-compose exec app npm run db:push
```

## 环境变量说明

生产环境支持以下环境变量：

| 变量 | 说明 | 必需 | 示例 |
|------|------|------|------|
| `DATABASE_TYPE` | 数据库类型 | 是 | `mysql` |
| `MYSQL_URL` | MySQL 连接字符串 | 是* | `mysql://user:pass@host:3306/db` |
| `MYSQL_HOST` | MySQL 主机 | 是** | `localhost` |
| `MYSQL_PORT` | MySQL 端口 | 是** | `3306` |
| `MYSQL_USER` | MySQL 用户名 | 是** | `hongguanai_user` |
| `MYSQL_PASSWORD` | MySQL 密码 | 是** | `your_password` |
| `MYSQL_DATABASE` | MySQL 数据库名 | 是** | `hongguanai` |
| `NODE_ENV` | Node 环境 | 否 | `production` |

\* 使用 `MYSQL_URL` 时，不需要配置其他 MYSQL_* 变量  
\** 不使用 `MYSQL_URL` 时需要配置这些变量

## 监控和日志

### 使用 PM2

```bash
# 查看日志
pm2 logs hongguanai

# 查看状态
pm2 status

# 重启应用
pm2 restart hongguanai

# 停止应用
pm2 stop hongguanai
```

### 使用 Docker

```bash
# 查看日志
docker-compose logs -f app

# 查看状态
docker-compose ps

# 重启应用
docker-compose restart app

# 停止应用
docker-compose down
```

## 备份和恢复

### 备份 MySQL 数据库

```bash
# 自动备份脚本
mysqldump -u hongguanai_user -p hongguanai > backup_$(date +%Y%m%d_%H%M%S).sql

# 或使用 crontab 定时备份
# 每天凌晨 2 点备份
0 2 * * * mysqldump -u hongguanai_user -p'password' hongguanai > /backups/hongguanai_$(date +\%Y\%m\%d).sql
```

### 恢复数据库

```bash
mysql -u hongguanai_user -p hongguanai < backup_20231221_020000.sql
```

## 性能优化

### 1. MySQL 配置优化

编辑 MySQL 配置文件（`/etc/mysql/my.cnf`）：

```ini
[mysqld]
# 连接池大小
max_connections = 200

# 查询缓存
query_cache_size = 64M
query_cache_type = 1

# InnoDB 缓冲池大小（建议设置为物理内存的 70-80%）
innodb_buffer_pool_size = 2G

# 日志文件大小
innodb_log_file_size = 256M
```

### 2. 添加数据库索引

```sql
-- 为 create_time 字段添加索引（用于按时间排序查询）
CREATE INDEX idx_create_time ON ppt_reports(create_time DESC);
```

### 3. Next.js 优化

在 `next.config.ts` 中启用压缩和优化：

```typescript
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  // 启用 SWC 压缩
  swcMinify: true,
};
```

## 故障排查

### 数据库连接失败

1. 检查 MySQL 服务状态：
   ```bash
   systemctl status mysql
   ```

2. 检查防火墙设置：
   ```bash
   sudo ufw status
   sudo ufw allow 3306
   ```

3. 检查 MySQL 用户权限：
   ```sql
   SHOW GRANTS FOR 'hongguanai_user'@'localhost';
   ```

### 应用启动失败

1. 查看日志：
   ```bash
   pm2 logs hongguanai --lines 100
   ```

2. 检查环境变量：
   ```bash
   cat .env.production
   ```

3. 检查端口占用：
   ```bash
   lsof -i :3000
   ```

### 性能问题

1. 监控数据库查询：
   ```sql
   SHOW PROCESSLIST;
   ```

2. 启用 MySQL 慢查询日志：
   ```sql
   SET GLOBAL slow_query_log = 'ON';
   SET GLOBAL long_query_time = 2;
   ```

3. 检查应用内存使用：
   ```bash
   pm2 monit
   ```

## 安全建议

1. **使用强密码**：为 MySQL 用户设置强密码
2. **限制数据库访问**：仅允许应用服务器 IP 访问数据库
3. **启用 HTTPS**：使用 Let's Encrypt 免费证书
4. **定期备份**：每天自动备份数据库
5. **更新依赖**：定期运行 `npm audit` 检查安全漏洞
6. **环境变量保护**：不要将 `.env.production` 提交到 Git

## 更新部署

```bash
# 拉取最新代码
git pull

# 安装新依赖（如果有）
npm install

# 应用数据库迁移（如果有）
npm run db:push

# 重新构建
npm run build

# 重启应用
pm2 restart hongguanai
# 或
docker-compose restart app
```

## 支持

如有问题，请参考：
- [数据库配置文档](./database-config.md)
- [项目 README](../README.md)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [Next.js 文档](https://nextjs.org/docs)

