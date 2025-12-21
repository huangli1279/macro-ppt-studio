# Kubernetes 部署配置

本目录包含在 Kubernetes 集群上部署宏观经济报告 PPT Studio 的配置文件。

## 文件说明

- `deployment.yaml`: 完整的 K8s 部署配置，包含：
  - Namespace（命名空间）
  - ConfigMap（配置）
  - Secret（敏感信息）
  - MySQL 数据库部署
  - 应用程序部署
  - Service（服务）
  - Ingress（入口）
  - HorizontalPodAutoscaler（自动扩缩容）

## 部署前准备

### 1. 修改配置

编辑 `deployment.yaml`，修改以下内容：

```yaml
# Secret 中的密码（强烈建议使用 kubectl create secret 或 sealed-secrets）
stringData:
  MYSQL_URL: "mysql://hongguanai4:YOUR_PASSWORD@mysql:3306/hongguanai4"
  MYSQL_ROOT_PASSWORD: "YOUR_ROOT_PASSWORD"
  MYSQL_PASSWORD: "YOUR_PASSWORD"

# Ingress 中的域名
spec:
  rules:
    - host: your-domain.com  # 替换为实际域名
```

### 2. 构建并推送镜像

```bash
# 构建镜像
docker build -t your-registry/hongguanai4:latest .

# 推送到镜像仓库
docker push your-registry/hongguanai4:latest

# 更新 deployment.yaml 中的镜像地址
spec:
  template:
    spec:
      containers:
        - name: app
          image: your-registry/hongguanai4:latest  # 替换此处
```

### 3. 配置 Ingress Controller

确保集群已安装 Ingress Controller（如 Nginx Ingress）：

```bash
# 如果使用 Helm 安装 Nginx Ingress
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx
```

## 部署步骤

### 方式一：一键部署

```bash
kubectl apply -f deployment.yaml
```

### 方式二：分步部署

```bash
# 1. 创建命名空间
kubectl apply -f deployment.yaml --selector=app.kubernetes.io/component=namespace

# 2. 创建配置和密钥
kubectl apply -f deployment.yaml --selector=app.kubernetes.io/component=config

# 3. 创建持久卷声明
kubectl apply -f deployment.yaml --selector=app.kubernetes.io/component=storage

# 4. 部署 MySQL
kubectl apply -f deployment.yaml --selector=app=mysql

# 5. 等待 MySQL 就绪
kubectl wait --for=condition=ready pod -l app=mysql -n hongguanai4 --timeout=300s

# 6. 部署应用
kubectl apply -f deployment.yaml --selector=app=hongguanai4-app

# 7. 配置 Ingress
kubectl apply -f deployment.yaml --selector=app.kubernetes.io/component=ingress
```

## 验证部署

### 1. 检查 Pod 状态

```bash
kubectl get pods -n hongguanai4
```

预期输出：
```
NAME                               READY   STATUS    RESTARTS   AGE
hongguanai4-app-xxxxxxxxxx-xxxxx   1/1     Running   0          2m
hongguanai4-app-xxxxxxxxxx-xxxxx   1/1     Running   0          2m
mysql-xxxxxxxxxx-xxxxx             1/1     Running   0          3m
```

### 2. 检查服务

```bash
kubectl get svc -n hongguanai4
```

### 3. 检查 Ingress

```bash
kubectl get ingress -n hongguanai4
```

### 4. 查看日志

```bash
# 查看应用日志
kubectl logs -f -l app=hongguanai4-app -n hongguanai4

# 查看 MySQL 日志
kubectl logs -f -l app=mysql -n hongguanai4
```

### 5. 健康检查

```bash
# 端口转发到本地
kubectl port-forward svc/hongguanai4-app 3000:80 -n hongguanai4

# 在另一个终端测试
curl http://localhost:3000/api/health
```

## 常用操作

### 扩容/缩容

```bash
# 手动扩容到 5 个副本
kubectl scale deployment hongguanai4-app --replicas=5 -n hongguanai4

# 查看 HPA 状态（自动扩缩容）
kubectl get hpa -n hongguanai4
```

### 更新应用

```bash
# 更新镜像
kubectl set image deployment/hongguanai4-app app=your-registry/hongguanai4:v2 -n hongguanai4

# 查看更新状态
kubectl rollout status deployment/hongguanai4-app -n hongguanai4

# 回滚到上一版本
kubectl rollout undo deployment/hongguanai4-app -n hongguanai4
```

### 数据库操作

```bash
# 进入 MySQL Pod
kubectl exec -it deployment/mysql -n hongguanai4 -- mysql -u root -p

# 备份数据库
kubectl exec deployment/mysql -n hongguanai4 -- mysqldump -u root -p hongguanai4 > backup.sql

# 恢复数据库
kubectl exec -i deployment/mysql -n hongguanai4 -- mysql -u root -p hongguanai4 < backup.sql
```

### 查看资源使用

```bash
# 查看 Pod 资源使用情况
kubectl top pods -n hongguanai4

# 查看节点资源使用
kubectl top nodes
```

## 安全配置

### 1. 使用 Sealed Secrets（推荐）

```bash
# 安装 Sealed Secrets Controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# 创建 Secret
echo -n 'mysql://user:pass@mysql:3306/db' | kubectl create secret generic hongguanai4-secret \
  --dry-run=client \
  --from-file=MYSQL_URL=/dev/stdin \
  -o yaml | \
  kubeseal -o yaml > sealed-secret.yaml

# 应用 Sealed Secret
kubectl apply -f sealed-secret.yaml -n hongguanai4
```

### 2. 配置 Network Policy

```bash
# 创建网络策略，限制 Pod 间通信
kubectl apply -f network-policy.yaml -n hongguanai4
```

### 3. 配置 RBAC

```bash
# 创建服务账号和角色绑定
kubectl apply -f rbac.yaml -n hongguanai4
```

## 监控和日志

### 使用 Prometheus + Grafana

```bash
# 安装 Prometheus Operator
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack

# 创建 ServiceMonitor
kubectl apply -f monitoring/servicemonitor.yaml
```

### 使用 ELK Stack

```bash
# 安装 Elastic Stack
helm repo add elastic https://helm.elastic.co
helm install elasticsearch elastic/elasticsearch
helm install kibana elastic/kibana
helm install filebeat elastic/filebeat
```

## 高可用配置

### 1. MySQL 高可用（推荐使用云数据库）

生产环境建议使用云数据库服务（如 AWS RDS、阿里云 RDS、腾讯云 CDB）：

```yaml
env:
  - name: MYSQL_URL
    value: "mysql://user:pass@rds.example.com:3306/hongguanai4"
```

### 2. 配置 Pod Disruption Budget

```bash
kubectl apply -f pdb.yaml -n hongguanai4
```

### 3. 配置多可用区部署

```yaml
spec:
  template:
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                topologyKey: topology.kubernetes.io/zone
```

## 故障排查

### Pod 无法启动

```bash
# 查看 Pod 详情
kubectl describe pod <pod-name> -n hongguanai4

# 查看事件
kubectl get events -n hongguanai4 --sort-by='.lastTimestamp'

# 查看日志
kubectl logs <pod-name> -n hongguanai4 --previous
```

### 数据库连接失败

```bash
# 检查 MySQL Service
kubectl get svc mysql -n hongguanai4

# 测试数据库连接
kubectl run -it --rm debug --image=mysql:8.0 --restart=Never -n hongguanai4 -- \
  mysql -h mysql -u root -p
```

### Ingress 无法访问

```bash
# 检查 Ingress Controller
kubectl get pods -n ingress-nginx

# 查看 Ingress 详情
kubectl describe ingress hongguanai4-ingress -n hongguanai4

# 检查 DNS 解析
nslookup your-domain.com
```

## 清理资源

### 删除应用（保留数据）

```bash
kubectl delete deployment hongguanai4-app -n hongguanai4
```

### 删除所有资源

```bash
kubectl delete namespace hongguanai4
```

### 删除持久卷数据

```bash
kubectl delete pvc mysql-pvc -n hongguanai4
```

## 参考资料

- [Kubernetes 官方文档](https://kubernetes.io/docs/)
- [Next.js 部署最佳实践](https://nextjs.org/docs/deployment)
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
- [Prometheus Operator](https://github.com/prometheus-operator/prometheus-operator)

## 技术支持

如遇到问题，请：
1. 查看本文档的「故障排查」部分
2. 检查 Pod 和服务日志
3. 访问项目 GitHub Issues

