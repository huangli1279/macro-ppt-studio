# Docker 快速参考

## 🚀 快速开始（3分钟部署）

```bash
# 1. 克隆项目
git clone <repository-url>
cd hongguanai4

# 2. 配置环境变量
cp .env.docker.example .env.docker
# 编辑 .env.docker，修改数据库密码

# 3. 启动服务
make dev-up

# 4. 访问应用
open http://localhost:3000
```

## 📋 常用命令速查

### Makefile 命令（推荐）

| 命令 | 说明 | 用途 |
|------|------|------|
| `make dev-up` | 启动开发环境 | 首次部署、开发测试 |
| `make dev-down` | 停止开发环境 | 暂停服务 |
| `make logs-app` | 查看应用日志 | 调试问题 |
| `make logs-db` | 查看数据库日志 | 数据库问题排查 |
| `make shell` | 进入容器终端 | 深度调试 |
| `make db-shell` | 进入数据库终端 | 查询数据 |
| `make health` | 健康检查 | 验证服务状态 |
| `make rebuild` | 重新构建并启动 | 代码更新后 |
| `make backup-db` | 备份数据库 | 数据备份 |
| `make clean-all` | 清理所有资源 | 完全重置 |

### Docker Compose 命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 查看日志
docker-compose logs -f

# 查看服务状态
docker-compose ps

# 重启应用
docker-compose restart app

# 进入应用容器
docker exec -it hongguanai4-app sh

# 进入数据库
docker exec -it hongguanai4-mysql mysql -u root -p
```

### Docker 原生命令

```bash
# 构建镜像
docker build -t hongguanai4:latest .

# 运行容器
docker run -d --name hongguanai4-app -p 3000:3000 hongguanai4:latest

# 查看日志
docker logs -f hongguanai4-app

# 停止容器
docker stop hongguanai4-app

# 删除容器
docker rm hongguanai4-app

# 删除镜像
docker rmi hongguanai4:latest
```

## 🔧 环境变量配置

### 最小配置（.env.docker）

```env
# 数据库配置
DATABASE_TYPE=mysql
MYSQL_URL=mysql://hongguanai4:your_password@mysql:3306/hongguanai4

# MySQL 配置
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_DATABASE=hongguanai4
MYSQL_USER=hongguanai4
MYSQL_PASSWORD=your_password
```

### 完整配置选项

```env
# 应用配置
NODE_ENV=production
PORT=3000

# 数据库配置
DATABASE_TYPE=mysql|sqlite
MYSQL_URL=mysql://user:pass@host:3306/db
SQLITE_DB_PATH=./data/ppt.db

# Puppeteer 配置
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
```

## 🏥 健康检查

### API 端点

```bash
# 检查服务健康
curl http://localhost:3000/api/health

# 预期响应（正常）
{
  "status": "healthy",
  "timestamp": "2025-12-21T10:00:00.000Z",
  "service": "hongguanai4",
  "database": "connected"
}

# 预期响应（异常）
{
  "status": "unhealthy",
  "timestamp": "2025-12-21T10:00:00.000Z",
  "service": "hongguanai4",
  "database": "disconnected",
  "error": "Connection refused"
}
```

### 使用 Makefile

```bash
# 一键健康检查
make health
```

## 🗄️ 数据库操作

### 备份

```bash
# 使用 Makefile（推荐）
make backup-db

# 手动备份
docker exec hongguanai4-mysql mysqldump -u root -p hongguanai4 > backup.sql

# 自动备份（定时任务）
0 2 * * * cd /path/to/hongguanai4 && make backup-db
```

### 恢复

```bash
# 交互式恢复
make restore-db

# 手动恢复
docker exec -i hongguanai4-mysql mysql -u root -p hongguanai4 < backup.sql
```

### 查询数据

```bash
# 进入数据库终端
make db-shell

# 或
docker exec -it hongguanai4-mysql mysql -u root -p hongguanai4

# SQL 查询示例
SELECT * FROM ppt_reports ORDER BY create_time DESC LIMIT 10;
```

## 🐛 故障排查

### 1. 容器无法启动

```bash
# 查看详细日志
docker-compose logs app

# 检查容器状态
docker-compose ps

# 检查端口占用
lsof -i :3000
```

### 2. 数据库连接失败

```bash
# 检查 MySQL 是否就绪
docker-compose logs mysql

# 测试数据库连接
docker exec -it hongguanai4-mysql mysql -u root -p

# 检查网络
docker exec -it hongguanai4-app ping mysql
```

### 3. Puppeteer 错误

```bash
# 检查 Chromium
docker exec -it hongguanai4-app which google-chrome
docker exec -it hongguanai4-app google-chrome --version

# 查看 PDF 导出日志
docker-compose logs app | grep -i puppeteer
```

### 4. 端口已被占用

```bash
# 查找占用端口的进程
lsof -i :3000

# 修改端口（docker-compose.yml）
ports:
  - "8080:3000"  # 使用 8080 端口
```

### 5. 磁盘空间不足

```bash
# 清理 Docker 缓存
docker system prune -a

# 清理项目资源
make clean-all

# 查看磁盘占用
docker system df
```

## 📊 性能监控

### 查看资源占用

```bash
# 实时监控
docker stats hongguanai4-app hongguanai4-mysql

# 使用 Makefile
make stats
```

### 设置资源限制

修改 `docker-compose.yml`:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## 🔄 更新部署

### 代码更新后重新部署

```bash
# 方式一：完整重建（推荐）
git pull
make rebuild

# 方式二：仅重启
git pull
docker-compose restart app

# 方式三：重新构建镜像
docker-compose build --no-cache
docker-compose up -d
```

### 数据库迁移

```bash
# 1. 进入容器
docker exec -it hongguanai4-app sh

# 2. 运行迁移
npm run db:push
```

## 🌐 生产环境部署

### 云平台快速部署

```bash
# 1. 构建生产镜像
docker build -t hongguanai4:prod .

# 2. 推送到镜像仓库
docker tag hongguanai4:prod registry.example.com/hongguanai4:latest
docker push registry.example.com/hongguanai4:latest

# 3. 在云平台拉取并运行
docker pull registry.example.com/hongguanai4:latest
docker run -d \
  --name hongguanai4-app \
  -p 3000:3000 \
  -e DATABASE_TYPE=mysql \
  -e MYSQL_URL="mysql://user:pass@host/db" \
  registry.example.com/hongguanai4:latest
```

### 使用外部 MySQL

```bash
# 修改 docker-compose.yml，移除 mysql 服务
# 或直接运行应用容器
docker run -d \
  --name hongguanai4-app \
  -p 3000:3000 \
  -e DATABASE_TYPE=mysql \
  -e MYSQL_URL="mysql://user:pass@rds.example.com:3306/hongguanai4" \
  hongguanai4:latest
```

## 📚 相关文档

- 📖 [完整 Docker 部署指南](./docker-deployment.md)
- 🔧 [数据库配置文档](./database-config.md)
- 🚀 [生产环境部署](./deployment.md)
- 💻 [开发环境设置](./SETUP.md)

## 💡 最佳实践

1. ✅ **使用 Makefile 命令**：更简洁、更易记
2. ✅ **定期备份数据**：设置定时任务自动备份
3. ✅ **监控日志**：使用 `make logs-app` 观察异常
4. ✅ **健康检查**：部署后运行 `make health` 验证
5. ✅ **资源限制**：生产环境设置 CPU 和内存限制
6. ✅ **使用外部数据库**：生产环境使用云数据库（如 RDS）
7. ✅ **环境变量安全**：不要提交 `.env.docker` 到 Git
8. ✅ **镜像扫描**：定期扫描镜像漏洞

## 🆘 获取帮助

```bash
# 查看所有可用命令
make help

# 运行测试脚本
./scripts/test-docker.sh

# 查看详细文档
cat docs/docker-deployment.md
```

## 📝 快速故障诊断流程

```bash
# 1. 检查服务状态
make ps

# 2. 查看应用日志
make logs-app

# 3. 健康检查
make health

# 4. 如果有问题，进入容器调试
make shell

# 5. 最后手段：完全重置
make clean-all
make dev-up
```

---

**提示**: 大部分操作都可以通过 `make` 命令完成，输入 `make help` 查看所有可用命令。

