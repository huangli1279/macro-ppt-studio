# Docker 容器环境变量配置指南

## 问题背景

在容器化部署中，`.env` 文件**不应该**提交到 Git 仓库（因为包含敏感信息），但这样在从 Git 仓库构建容器时就无法直接使用这些配置。

## 解决方案概述

对于 **Next.js 应用**，环境变量分为两类：

1. **构建时环境变量** (`NEXT_PUBLIC_*`) - 打包到客户端代码中
2. **运行时环境变量** - 服务端运行时读取

本项目的数据库配置 (`MYSQL_URL`) 是**运行时环境变量**，所以：
- ✅ **不需要**在构建阶段传入
- ✅ **需要**在运行阶段传入

## 三种部署方式的环境变量配置

### 1. Docker Compose 部署（本地开发/测试）

**已配置完成** ✅ - 参考 `docker-compose.yml`

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      # 直接在这里配置运行时环境变量
      MYSQL_URL: mysql://hongguanai4:password_change_me@mysql:3306/hongguanai4
      NODE_ENV: production
```

**使用方式：**

```bash
# 启动服务（会自动使用 docker-compose.yml 中的环境变量）
docker-compose up -d

# 或者使用外部 .env 文件（不推荐，因为包含敏感信息）
docker-compose --env-file .env.production up -d
```

---

### 2. Kubernetes 部署（生产环境）

**已配置完成** ✅ - 参考 `k8s/deployment.yaml`

使用 **ConfigMap**（非敏感配置）和 **Secret**（敏感配置）：

```yaml
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: hongguanai4-config
  namespace: hongguanai4
data:
  NODE_ENV: "production"
  PORT: "3000"

---
apiVersion: v1
kind: Secret
metadata:
  name: hongguanai4-secret
  namespace: hongguanai4
type: Opaque
stringData:
  # 敏感信息存储在 Secret 中
  MYSQL_URL: "mysql://hongguanai4:CHANGE_ME@mysql:3306/hongguanai4"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hongguanai4-app
spec:
  template:
    spec:
      containers:
        - name: app
          env:
            # 从 ConfigMap 读取
            - name: NODE_ENV
              valueFrom:
                configMapKeyRef:
                  name: hongguanai4-config
                  key: NODE_ENV
            # 从 Secret 读取
            - name: MYSQL_URL
              valueFrom:
                secretKeyRef:
                  name: hongguanai4-secret
                  key: MYSQL_URL
```

**部署步骤：**

```bash
# 1. 创建 Secret（推荐使用命令行，不要写在 YAML 文件中）
kubectl create secret generic hongguanai4-secret \
  --from-literal=MYSQL_URL='mysql://user:pass@host:3306/db' \
  --namespace=hongguanai4

# 2. 应用配置
kubectl apply -f k8s/deployment.yaml

# 3. 验证环境变量
kubectl exec -it deployment/hongguanai4-app -n hongguanai4 -- env | grep MYSQL
```

---

### 3. 公司 CI/CD 构建（从 Git 仓库直接构建）

这是你提出的核心问题。推荐方案：

#### 方案 A：构建时不传入，运行时注入（推荐）⭐

**Dockerfile 不需要修改**（当前的 Dockerfile 已经是正确的）

```dockerfile
# ✅ 当前 Dockerfile 正确 - 不在构建时处理环境变量
FROM your-company-registry/nodejs:22 AS runner
# ... 其他配置 ...

# 不需要 ARG 或 ENV 定义数据库连接
# Next.js standalone 模式会在运行时从环境变量读取

CMD ["node", "server.js"]
```

**CI/CD Pipeline 配置示例：**

```yaml
# 示例：GitLab CI
stages:
  - build
  - deploy

build:
  stage: build
  script:
    # 构建镜像（不需要传入环境变量）
    - docker build -t myregistry/hongguanai4:${CI_COMMIT_SHA} .
    - docker push myregistry/hongguanai4:${CI_COMMIT_SHA}

deploy:
  stage: deploy
  script:
    # 部署时传入环境变量
    - |
      docker run -d \
        -e MYSQL_URL="${MYSQL_URL}" \
        -e NODE_ENV="production" \
        -p 3000:8080 \
        myregistry/hongguanai4:${CI_COMMIT_SHA}
  # 从 CI/CD Variables 读取敏感信息
```

**CI/CD 变量配置：**

在 GitLab/Jenkins/GitHub Actions 中配置：

| 变量名 | 值 | 类型 | 保护 |
|--------|-----|------|------|
| `MYSQL_URL` | `mysql://user:pass@host:3306/db` | Secret | ✅ |
| `NODE_ENV` | `production` | Variable | ❌ |

---

#### 方案 B：构建时传入（不推荐，仅用于客户端环境变量）

如果你有 `NEXT_PUBLIC_*` 开头的客户端环境变量（当前项目没有），需要在构建时传入：

```dockerfile
# 添加构建参数
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build
```

CI/CD 构建命令：

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL="https://api.example.com" \
  -t myregistry/hongguanai4:${CI_COMMIT_SHA} \
  .
```

⚠️ **注意：** 不要用这种方式传递敏感信息（如数据库密码）！

---

## 安全最佳实践

### ✅ 推荐做法

1. **不要将 `.env` 文件提交到 Git**
   - 已在 `.gitignore` 中配置

2. **使用 CI/CD 平台的 Secret 管理**
   - GitLab CI Variables (Protected + Masked)
   - GitHub Actions Secrets
   - Jenkins Credentials
   - Azure Key Vault
   - AWS Secrets Manager

3. **运行时注入环境变量**
   - Docker Compose: `environment` 字段
   - Kubernetes: `ConfigMap` + `Secret`
   - 云平台: 环境变量配置

4. **分离敏感和非敏感配置**
   - 非敏感：ConfigMap
   - 敏感：Secret

### ❌ 不推荐做法

1. ❌ 将 `.env` 提交到 Git 仓库
2. ❌ 在 Dockerfile 中硬编码敏感信息
3. ❌ 将敏感信息通过 `ARG` 传递（会留在镜像历史中）
4. ❌ 在 CI/CD 日志中打印敏感信息

---

## 验证环境变量

### 本地开发

```bash
# 检查 .env 文件
cat .env

# 启动应用测试
npm run dev
```

### Docker 容器

```bash
# 进入容器查看环境变量
docker exec -it <container_id> env | grep MYSQL

# 或者使用 docker-compose
docker-compose exec app env | grep MYSQL
```

### Kubernetes

```bash
# 查看 Pod 环境变量
kubectl exec -it <pod-name> -n hongguanai4 -- env | grep MYSQL

# 查看 Secret
kubectl get secret hongguanai4-secret -n hongguanai4 -o yaml

# 解码 Secret 值
kubectl get secret hongguanai4-secret -n hongguanai4 -o jsonpath='{.data.MYSQL_URL}' | base64 -d
```

---

## 常见问题

### Q1: 为什么 Next.js 的 MYSQL_URL 不需要在构建时传入？

**A:** Next.js 16 的 standalone 输出模式会生成一个独立的 Node.js 服务器，该服务器在**运行时**读取环境变量。数据库连接是在请求处理时建立的，不是在构建时。

### Q2: 什么情况下需要在构建时传入环境变量？

**A:** 只有以下情况需要构建时传入：
- `NEXT_PUBLIC_*` 开头的客户端环境变量（会打包到浏览器代码中）
- 构建过程中需要访问外部 API 的情况（如 getStaticProps 调用外部 API）

### Q3: 如何区分开发/测试/生产环境的配置？

**A:** 
- 本地开发：`.env.local`
- Docker 测试：`docker-compose.yml` 的 `environment`
- 生产环境：K8s Secret 或 CI/CD Variables

### Q4: 镜像构建完成后如何更改数据库连接？

**A:** 只需要在启动容器时传入新的 `MYSQL_URL` 环境变量即可，不需要重新构建镜像：

```bash
docker run -e MYSQL_URL="mysql://new-host/new-db" myimage:tag
```

---

## 总结

对于本项目（hongguanai4）：

1. ✅ **Dockerfile 无需修改** - 当前配置已正确
2. ✅ **构建镜像时不需要传入数据库配置**
3. ✅ **运行容器时传入 `MYSQL_URL` 环境变量**
4. ✅ **敏感信息通过 CI/CD Secret 管理**

你的担心是对的 - `.env` 不提交到 Git，但解决方案是**运行时注入**，而不是构建时传入。这样既安全又灵活！


