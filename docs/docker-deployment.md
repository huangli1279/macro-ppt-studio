# Docker 部署指南

## 概述

本项目提供了完整的 Docker 部署方案，支持：

- ✅ **Next.js 16** 应用容器化
- ✅ **Puppeteer** PDF 导出功能
- ✅ **MySQL** 数据库支持
- ✅ 多阶段构建优化镜像大小
- ✅ 健康检查和自动重启
- ✅ 非 root 用户运行（安全性）

## 文件说明

### `Dockerfile`
多阶段构建配置，包含三个阶段：
1. **deps**: 安装依赖和 Puppeteer 系统库
2. **builder**: 构建 Next.js 应用
3. **runner**: 精简的生产运行环境

### `.dockerignore`
排除不必要的文件，减小镜像大小和构建时间。

### `docker-compose.yml`
用于本地开发和测试，包含：
- MySQL 8.0 数据库服务
- Next.js 应用服务
- 网络和数据卷配置

### `.env.docker.example`
Docker 环境变量模板，需复制并修改。

## 快速开始

### 方式一：使用 Docker Compose（推荐）

1. **创建环境变量文件**

```bash
cp .env.docker.example .env.docker
# 编辑 .env.docker，修改密码等敏感信息
```

2. **启动服务**

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 停止服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

3. **访问应用**

打开浏览器访问 http://localhost:3000

### 方式二：只构建应用镜像

1. **构建镜像**

```bash
docker build -t hongguanai4:latest .
```

2. **运行容器**

```bash
docker run -d \
  --name hongguanai4-app \
  -p 3000:3000 \
  -e DATABASE_TYPE=mysql \
  -e MYSQL_URL="mysql://user:password@host:3306/database" \
  hongguanai4:latest
```

## 配置说明

### 环境变量

#### 必需环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_TYPE` | 数据库类型 | `mysql` 或 `sqlite` |
| `MYSQL_URL` | MySQL 连接字符串 | `mysql://user:pass@host:3306/db` |

#### 可选环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 应用端口 | `3000` |
| `NODE_ENV` | Node 环境 | `production` |
| `PUPPETEER_EXECUTABLE_PATH` | Chromium 路径 | 自动检测 |

### 端口映射

- **3000**: Next.js 应用端口
- **3306**: MySQL 数据库端口（仅 docker-compose）

### 数据持久化

#### MySQL 数据（docker-compose）

数据存储在 Docker 卷 `mysql_data` 中，会自动持久化。

```bash
# 查看卷
docker volume ls | grep hongguanai4

# 备份数据
docker exec hongguanai4-mysql mysqldump -u root -p hongguanai4 > backup.sql

# 恢复数据
docker exec -i hongguanai4-mysql mysql -u root -p hongguanai4 < backup.sql
```

#### SQLite 数据（不推荐生产环境）

如果使用 SQLite，需要挂载数据目录：

```bash
docker run -d \
  --name hongguanai4-app \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e DATABASE_TYPE=sqlite \
  -e SQLITE_DB_PATH=./data/ppt.db \
  hongguanai4:latest
```

## 生产环境部署

### 1. 云平台部署

#### 腾讯云容器服务（TKE）

```bash
# 构建并推送镜像
docker build -t ccr.ccs.tencentyun.com/namespace/hongguanai4:latest .
docker push ccr.ccs.tencentyun.com/namespace/hongguanai4:latest

# 使用 TKE 控制台或 kubectl 部署
kubectl apply -f k8s-deployment.yaml
```

#### 阿里云容器服务（ACK）

```bash
# 构建并推送镜像
docker build -t registry.cn-hangzhou.aliyuncs.com/namespace/hongguanai4:latest .
docker push registry.cn-hangzhou.aliyuncs.com/namespace/hongguanai4:latest
```

### 2. Docker Swarm

```bash
# 初始化 Swarm
docker swarm init

# 部署服务
docker stack deploy -c docker-compose.yml hongguanai4
```

### 3. Kubernetes

参考 `k8s/` 目录下的配置文件（需要单独创建）。

## 健康检查

应用提供健康检查端点：

```bash
# 检查应用健康状态
curl http://localhost:3000/api/health

# 响应示例（正常）
{
  "status": "healthy",
  "timestamp": "2025-12-21T10:00:00.000Z",
  "service": "hongguanai4",
  "database": "connected"
}

# 响应示例（异常）
{
  "status": "unhealthy",
  "timestamp": "2025-12-21T10:00:00.000Z",
  "service": "hongguanai4",
  "database": "disconnected",
  "error": "Connection refused"
}
```

Docker 容器会自动使用此端点进行健康监控。

## 故障排查

### 查看日志

```bash
# Docker Compose
docker-compose logs -f app
docker-compose logs -f mysql

# 单独容器
docker logs -f hongguanai4-app
```

### 进入容器调试

```bash
# 进入应用容器
docker exec -it hongguanai4-app sh

# 进入数据库容器
docker exec -it hongguanai4-mysql mysql -u root -p
```

### 常见问题

#### 1. Puppeteer 无法启动

**问题**: PDF 导出失败，日志显示 Chromium 启动错误

**解决**:
```bash
# 确认容器内 Chromium 可用
docker exec -it hongguanai4-app which google-chrome
docker exec -it hongguanai4-app google-chrome --version
```

#### 2. 数据库连接失败

**问题**: 应用启动失败，health check 显示 database disconnected

**解决**:
```bash
# 检查 MySQL 是否就绪
docker-compose logs mysql

# 检查网络连接
docker exec -it hongguanai4-app ping mysql

# 验证环境变量
docker exec -it hongguanai4-app env | grep MYSQL
```

#### 3. 权限问题

**问题**: 容器内文件操作失败

**解决**:
```bash
# 确认文件权限
docker exec -it hongguanai4-app ls -la /app/data

# 如果需要，调整权限
docker exec -u root -it hongguanai4-app chown -R nextjs:nodejs /app/data
```

## 性能优化

### 镜像大小优化

当前配置已使用以下优化：
- ✅ 多阶段构建
- ✅ `node:22-slim` 基础镜像
- ✅ `.dockerignore` 排除不必要文件
- ✅ Next.js standalone 输出模式
- ✅ 生产依赖安装（`--omit=dev --omit=optional`）

预期镜像大小：~1.2GB（包含 Chromium）

### 运行时性能

```bash
# 限制内存和 CPU
docker run -d \
  --name hongguanai4-app \
  --memory="1g" \
  --cpus="1" \
  -p 3000:3000 \
  hongguanai4:latest
```

## 安全最佳实践

### 1. 使用非 root 用户

✅ Dockerfile 已配置 `nextjs` 用户运行应用

### 2. 环境变量管理

❌ **不要**将 `.env` 文件提交到 Git
✅ **使用** Docker secrets 或环境变量注入

```bash
# 使用 Docker secrets
echo "mysql://user:pass@host/db" | docker secret create mysql_url -

# 在 docker-compose.yml 中引用
services:
  app:
    secrets:
      - mysql_url
    environment:
      MYSQL_URL_FILE: /run/secrets/mysql_url
```

### 3. 镜像扫描

```bash
# 使用 Trivy 扫描漏洞
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy:latest image hongguanai4:latest
```

### 4. 网络隔离

使用 Docker 网络限制服务间通信：

```yaml
services:
  app:
    networks:
      - frontend
      - backend
  mysql:
    networks:
      - backend  # 仅允许后端访问
```

## CI/CD 集成

### GitHub Actions 示例

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t hongguanai4:${{ github.sha }} .
      
      - name: Push to registry
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker push hongguanai4:${{ github.sha }}
```

## 监控和日志

### 日志收集

```bash
# 使用 Fluentd 收集日志
docker run -d \
  --name fluentd \
  -v $(pwd)/fluentd.conf:/fluentd/etc/fluent.conf \
  fluent/fluentd:latest

# 配置应用发送日志到 Fluentd
docker run -d \
  --name hongguanai4-app \
  --log-driver=fluentd \
  --log-opt fluentd-address=localhost:24224 \
  hongguanai4:latest
```

### 性能监控

推荐使用 Prometheus + Grafana 监控容器性能。

## 参考资料

- [Next.js Docker 部署文档](https://nextjs.org/docs/deployment#docker-image)
- [Puppeteer Docker 配置](https://pptr.dev/troubleshooting#running-puppeteer-in-docker)
- [Docker 最佳实践](https://docs.docker.com/develop/dev-best-practices/)
- [Drizzle ORM with Docker](https://orm.drizzle.team/docs/guides/docker)

## 技术支持

如遇到问题，请：
1. 查看本文档的「故障排查」部分
2. 检查容器日志
3. 访问 GitHub Issues 提交问题

