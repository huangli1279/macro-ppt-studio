# Docker 相关文件总览

本文档列出了所有与 Docker 部署相关的文件及其用途。

## 📁 文件清单

### 核心配置文件

| 文件 | 位置 | 用途 | 是否必需 |
|------|------|------|---------|
| `Dockerfile` | 项目根目录 | Docker 镜像构建配置（多阶段构建） | ✅ 必需 |
| `.dockerignore` | 项目根目录 | 排除不必要的文件，减小镜像大小 | ✅ 必需 |
| `docker-compose.yml` | 项目根目录 | 本地开发/测试环境配置（含 MySQL） | 🔧 推荐 |
| `.env.docker.example` | 项目根目录 | Docker 环境变量模板 | 🔧 推荐 |

### 文档文件

| 文件 | 位置 | 内容 |
|------|------|------|
| `docker-deployment.md` | `docs/` | 完整的 Docker 部署指南（20+ 章节） |
| `DOCKER-QUICK-REF.md` | `docs/` | Docker 快速参考（命令速查表） |
| `DOCKER-FILES-OVERVIEW.md` | `docs/` | 本文档（文件总览） |

### 工具脚本

| 文件 | 位置 | 用途 | 使用方法 |
|------|------|------|---------|
| `Makefile` | 项目根目录 | 快捷命令集合 | `make <command>` |
| `test-docker.sh` | `scripts/` | Docker 配置测试脚本 | `./scripts/test-docker.sh` |

### CI/CD 配置

| 文件 | 位置 | 用途 |
|------|------|------|
| `docker-build.yml` | `.github/workflows/` | GitHub Actions 自动构建和测试 |
| `docker-security-scan.yml` | `.github/workflows/` | 定期安全漏洞扫描 |

### Kubernetes 配置

| 文件 | 位置 | 用途 |
|------|------|------|
| `deployment.yaml` | `k8s/` | K8s 完整部署配置 |
| `README.md` | `k8s/` | K8s 部署指南 |

### 应用代码

| 文件 | 位置 | 用途 | 备注 |
|------|------|------|------|
| `route.ts` | `src/app/api/health/` | 健康检查 API | Docker 容器健康监控 |
| `next.config.ts` | 项目根目录 | Next.js 配置 | 已启用 `output: "standalone"` |

## 🚀 快速开始路径

### 路径 1: 本地 Docker Compose（最简单）

```bash
# 只需这 3 个文件即可启动
1. docker-compose.yml
2. .env.docker (从 .env.docker.example 复制)
3. Makefile (可选，提供便捷命令)

# 命令
make dev-up
```

### 路径 2: 单独 Docker 镜像

```bash
# 只需这 2 个文件
1. Dockerfile
2. .dockerignore

# 命令
docker build -t hongguanai4:latest .
docker run -d -p 3000:3000 -e DATABASE_TYPE=mysql -e MYSQL_URL="..." hongguanai4:latest
```

### 路径 3: Kubernetes 部署

```bash
# 需要这些文件
1. Dockerfile (构建镜像)
2. k8s/deployment.yaml (K8s 配置)

# 命令
docker build -t registry.example.com/hongguanai4:latest .
docker push registry.example.com/hongguanai4:latest
kubectl apply -f k8s/deployment.yaml
```

## 📖 文档结构

### 新手入门

1. **README.md** (主文档)
   - 包含 Docker 快速开始章节
   - 指向详细文档

2. **docs/DOCKER-QUICK-REF.md**
   - 3 分钟快速部署
   - 常用命令速查表
   - 快速故障诊断

### 详细部署

3. **docs/docker-deployment.md**
   - 完整部署指南
   - 生产环境配置
   - 故障排查
   - 性能优化
   - 安全最佳实践

### 高级部署

4. **k8s/README.md**
   - Kubernetes 部署指南
   - 高可用配置
   - 自动扩缩容
   - 监控和日志

## 🔧 Makefile 命令总览

### 开发环境

```bash
make dev-up        # 启动开发环境
make dev-down      # 停止开发环境
make logs-app      # 查看应用日志
make logs-db       # 查看数据库日志
make shell         # 进入容器 shell
make db-shell      # 进入数据库 shell
make health        # 健康检查
make rebuild       # 重新构建并启动
```

### 数据库操作

```bash
make backup-db     # 备份数据库
make restore-db    # 恢复数据库
```

### 镜像操作

```bash
make build         # 构建镜像
make test-build    # 测试构建
make clean-all     # 清理所有资源
```

### 监控

```bash
make ps            # 查看容器状态
make stats         # 查看资源占用
```

完整命令列表：`make help`

## 🧪 测试脚本功能

`scripts/test-docker.sh` 包含以下测试：

1. ✅ 检查系统依赖（docker, docker-compose）
2. ✅ 验证 Dockerfile 语法
3. ✅ 验证 docker-compose.yml 配置
4. ✅ 检查环境变量文件
5. ✅ 验证健康检查端点
6. ✅ 可选：测试镜像构建

## 📊 文件依赖关系

```
Dockerfile
├── 依赖: next.config.ts (standalone 模式)
├── 依赖: package.json (依赖列表)
└── 使用: .dockerignore (排除文件)

docker-compose.yml
├── 依赖: Dockerfile (构建镜像)
├── 依赖: .env.docker (环境变量)
└── 创建: mysql 服务

Makefile
└── 使用: docker-compose.yml

k8s/deployment.yaml
├── 需要: Docker 镜像（已构建并推送）
└── 创建: K8s 资源（Deployment, Service, Ingress 等）

.github/workflows/docker-build.yml
└── 使用: Dockerfile (CI/CD 构建)
```

## 🎯 使用场景推荐

### 场景 1: 本地开发测试

**推荐文件**:
- `docker-compose.yml`
- `Makefile`
- `.env.docker.example`

**命令**:
```bash
cp .env.docker.example .env.docker
make dev-up
```

### 场景 2: 快速部署到云服务器

**推荐文件**:
- `Dockerfile`
- `.dockerignore`
- `docker-compose.yml`

**命令**:
```bash
# 服务器上
git clone <repo>
cd hongguanai4
cp .env.docker.example .env.docker
# 修改 .env.docker
docker-compose up -d
```

### 场景 3: 容器化部署（腾讯云/阿里云）

**推荐文件**:
- `Dockerfile`
- `.dockerignore`

**命令**:
```bash
docker build -t registry.example.com/hongguanai4:latest .
docker push registry.example.com/hongguanai4:latest
# 在云平台控制台选择镜像部署
```

### 场景 4: Kubernetes 生产环境

**推荐文件**:
- `Dockerfile`
- `k8s/deployment.yaml`
- `k8s/README.md`

**命令**:
```bash
# 参考 k8s/README.md
kubectl apply -f k8s/deployment.yaml
```

### 场景 5: CI/CD 自动部署

**推荐文件**:
- `.github/workflows/docker-build.yml`
- `.github/workflows/docker-security-scan.yml`

**说明**:
推送代码到 GitHub 后自动构建和测试 Docker 镜像。

## ⚙️ 配置优先级

### 环境变量优先级（高到低）

1. `docker run -e` 命令行参数
2. `docker-compose.yml` 中的 `environment`
3. `.env.docker` 文件
4. `.env` 文件（默认）
5. 应用默认值

### 数据库配置

| 环境 | 推荐配置 | 配置文件 |
|------|---------|---------|
| 本地开发 | SQLite | `.env` |
| Docker 开发 | MySQL (compose) | `.env.docker` + `docker-compose.yml` |
| 容器化生产 | MySQL (外部) | 环境变量注入 |
| K8s 生产 | MySQL (RDS/云数据库) | K8s Secret |

## 🔒 安全注意事项

### ⚠️ 不要提交到 Git

以下文件包含敏感信息，已在 `.gitignore` 中配置：

- `.env`
- `.env.local`
- `.env.docker`
- `data/` 目录（数据库文件）

### ✅ 可以提交的文件

- `.env.example`
- `.env.docker.example`
- 所有配置文件（Dockerfile, docker-compose.yml 等）
- 所有文档文件

## 📚 学习路径

### 初学者

1. 阅读 `README.md` 的 Docker 部署章节
2. 运行 `./scripts/test-docker.sh` 验证配置
3. 执行 `make dev-up` 启动服务
4. 参考 `docs/DOCKER-QUICK-REF.md` 学习常用命令

### 进阶用户

1. 阅读 `docs/docker-deployment.md` 了解详细配置
2. 学习 `Makefile` 中的命令实现
3. 自定义 `docker-compose.yml` 配置
4. 配置生产环境部署

### 专家用户

1. 研究 `Dockerfile` 多阶段构建优化
2. 配置 K8s 部署 (`k8s/`)
3. 自定义 CI/CD 流程 (`.github/workflows/`)
4. 实现监控和日志系统

## 🆘 获取帮助

### 命令行帮助

```bash
# Makefile 命令列表
make help

# Docker Compose 帮助
docker-compose --help

# 测试脚本
./scripts/test-docker.sh
```

### 文档索引

- 🚀 快速开始: `README.md` → Docker 部署章节
- 📖 完整指南: `docs/docker-deployment.md`
- 🔍 命令速查: `docs/DOCKER-QUICK-REF.md`
- 🎯 文件说明: `docs/DOCKER-FILES-OVERVIEW.md` (本文档)
- ☸️ K8s 部署: `k8s/README.md`

### 故障排查

1. 运行测试脚本: `./scripts/test-docker.sh`
2. 查看健康状态: `make health`
3. 查看日志: `make logs-app`
4. 参考故障排查文档: `docs/DOCKER-QUICK-REF.md` → 故障排查章节

## 📝 更新日志

### v1.0.0 (当前版本)

- ✅ Dockerfile 多阶段构建
- ✅ Docker Compose 本地开发环境
- ✅ Makefile 快捷命令
- ✅ 完整文档（20+ 章节）
- ✅ 测试脚本
- ✅ GitHub Actions CI/CD
- ✅ Kubernetes 部署配置
- ✅ 健康检查端点
- ✅ 安全扫描配置

## 🎉 总结

本项目提供了完整的 Docker 部署解决方案，涵盖：

- 📦 **开发环境**: Docker Compose 一键启动
- 🚀 **生产部署**: 优化的 Dockerfile 和详细文档
- ☸️ **企业级**: Kubernetes 配置和高可用方案
- 🔄 **自动化**: CI/CD 流程和安全扫描
- 📚 **文档**: 从入门到精通的完整指南

**建议新用户从 `README.md` 开始，按照快速开始步骤操作！**

