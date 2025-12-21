# 宏观经济报告 PPT Studio - Docker 部署快捷命令
# 使用 make <command> 执行命令

.PHONY: help build run stop clean logs shell health test-build dev-up dev-down prod-up prod-down

# 默认目标
help:
	@echo "可用命令："
	@echo "  make build        - 构建 Docker 镜像"
	@echo "  make run          - 运行容器（单独运行应用）"
	@echo "  make stop         - 停止容器"
	@echo "  make clean        - 清理容器和镜像"
	@echo "  make logs         - 查看应用日志"
	@echo "  make shell        - 进入容器 shell"
	@echo "  make health       - 检查应用健康状态"
	@echo "  make test-build   - 测试构建（不推送）"
	@echo ""
	@echo "  make dev-up       - 启动开发环境（docker-compose）"
	@echo "  make dev-down     - 停止开发环境"
	@echo "  make prod-up      - 启动生产环境"
	@echo "  make prod-down    - 停止生产环境"

# 构建镜像
build:
	@echo "🔨 构建 Docker 镜像..."
	docker build -t hongguanai4:latest .

# 测试构建（快速验证）
test-build:
	@echo "🧪 测试构建 Docker 镜像..."
	docker build --progress=plain -t hongguanai4:test .

# 运行容器（需要先设置环境变量）
run:
	@echo "🚀 启动应用容器..."
	docker run -d \
		--name hongguanai4-app \
		-p 3000:3000 \
		-e MYSQL_URL=${MYSQL_URL} \
		hongguanai4:latest

# 停止容器
stop:
	@echo "⏸️  停止应用容器..."
	docker stop hongguanai4-app || true
	docker rm hongguanai4-app || true

# 清理所有相关资源
clean:
	@echo "🧹 清理 Docker 资源..."
	docker stop hongguanai4-app || true
	docker rm hongguanai4-app || true
	docker rmi hongguanai4:latest || true
	docker rmi hongguanai4:test || true

# 查看日志
logs:
	@echo "📋 查看应用日志..."
	docker logs -f hongguanai4-app

# 进入容器 shell
shell:
	@echo "🐚 进入容器 shell..."
	docker exec -it hongguanai4-app sh

# 健康检查
health:
	@echo "🏥 检查应用健康状态..."
	@curl -s http://localhost:3000/api/health | jq . || echo "请安装 jq: brew install jq"

# === Docker Compose 命令 ===

# 启动开发环境
dev-up:
	@echo "🚀 启动开发环境（docker-compose）..."
	docker-compose up -d
	@echo "✅ 开发环境已启动！访问 http://localhost:3000"

# 停止开发环境
dev-down:
	@echo "⏸️  停止开发环境..."
	docker-compose down

# 启动生产环境（保留数据卷）
prod-up:
	@echo "🚀 启动生产环境..."
	docker-compose -f docker-compose.yml up -d
	@echo "✅ 生产环境已启动！"

# 停止生产环境（保留数据）
prod-down:
	@echo "⏸️  停止生产环境..."
	docker-compose down

# 完全清理（包括数据卷）
clean-all:
	@echo "🧹 清理所有资源（包括数据）..."
	docker-compose down -v
	docker rmi hongguanai4:latest || true

# 查看 Docker Compose 日志
logs-compose:
	@echo "📋 查看所有服务日志..."
	docker-compose logs -f

# 查看应用日志
logs-app:
	@echo "📋 查看应用日志..."
	docker-compose logs -f app

# 查看数据库日志
logs-db:
	@echo "📋 查看数据库日志..."
	docker-compose logs -f mysql

# 重启服务
restart:
	@echo "🔄 重启应用服务..."
	docker-compose restart app

# 重新构建并启动
rebuild:
	@echo "🔨 重新构建并启动..."
	docker-compose up -d --build

# 数据库备份
backup-db:
	@echo "💾 备份数据库..."
	@mkdir -p backups
	docker exec hongguanai4-mysql mysqldump -u root -proot_password_change_me hongguanai4 > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ 备份完成！"

# 数据库恢复
restore-db:
	@echo "📥 恢复数据库（请确保 backups/ 目录下有备份文件）..."
	@ls -lt backups/ | head -5
	@read -p "请输入要恢复的文件名: " filename; \
	docker exec -i hongguanai4-mysql mysql -u root -proot_password_change_me hongguanai4 < backups/$$filename
	@echo "✅ 恢复完成！"

# 进入数据库 shell
db-shell:
	@echo "🗄️  进入数据库 shell..."
	docker exec -it hongguanai4-mysql mysql -u root -proot_password_change_me hongguanai4

# 查看容器状态
ps:
	@echo "📊 查看容器状态..."
	docker-compose ps

# 查看资源占用
stats:
	@echo "📈 查看资源占用..."
	docker stats hongguanai4-app hongguanai4-mysql --no-stream

