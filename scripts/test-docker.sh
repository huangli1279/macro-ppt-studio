#!/bin/bash

# 宏观经济报告 PPT Studio - Docker 部署测试脚本
# 用于验证 Docker 配置是否正确

set -e  # 遇到错误立即退出

echo "======================================"
echo "  Docker 部署测试脚本"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 已安装"
        return 0
    else
        echo -e "${RED}✗${NC} $1 未安装"
        return 1
    fi
}

# 测试步骤
test_build() {
    echo ""
    echo "📦 测试 1: 构建 Docker 镜像"
    echo "-----------------------------------"
    if docker build -t hongguanai4:test . > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} 镜像构建成功"
        return 0
    else
        echo -e "${RED}✗${NC} 镜像构建失败"
        return 1
    fi
}

test_compose_config() {
    echo ""
    echo "🔧 测试 2: 验证 docker-compose.yml"
    echo "-----------------------------------"
    if docker-compose config > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} docker-compose.yml 配置正确"
        return 0
    else
        echo -e "${RED}✗${NC} docker-compose.yml 配置错误"
        return 1
    fi
}

test_env_file() {
    echo ""
    echo "📄 测试 3: 检查环境变量文件"
    echo "-----------------------------------"
    if [ -f ".env.docker.example" ]; then
        echo -e "${GREEN}✓${NC} .env.docker.example 存在"
    else
        echo -e "${RED}✗${NC} .env.docker.example 不存在"
        return 1
    fi
    
    if [ -f ".env.docker" ]; then
        echo -e "${GREEN}✓${NC} .env.docker 已配置"
    else
        echo -e "${YELLOW}⚠${NC} .env.docker 不存在（生产环境需要）"
    fi
    
    return 0
}

test_dockerfile() {
    echo ""
    echo "🐳 测试 4: 验证 Dockerfile"
    echo "-----------------------------------"
    
    if [ -f "Dockerfile" ]; then
        echo -e "${GREEN}✓${NC} Dockerfile 存在"
    else
        echo -e "${RED}✗${NC} Dockerfile 不存在"
        return 1
    fi
    
    # 检查关键配置
    if grep -q "output: \"standalone\"" next.config.ts; then
        echo -e "${GREEN}✓${NC} Next.js standalone 模式已启用"
    else
        echo -e "${YELLOW}⚠${NC} Next.js standalone 模式未启用"
    fi
    
    return 0
}

test_health_endpoint() {
    echo ""
    echo "🏥 测试 5: 检查健康检查端点"
    echo "-----------------------------------"
    
    if [ -f "src/app/api/health/route.ts" ]; then
        echo -e "${GREEN}✓${NC} 健康检查端点已实现"
        return 0
    else
        echo -e "${RED}✗${NC} 健康检查端点不存在"
        return 1
    fi
}

# 主测试流程
main() {
    echo "开始测试..."
    echo ""
    
    # 1. 检查依赖
    echo "检查系统依赖："
    echo "-----------------------------------"
    check_command docker || exit 1
    check_command docker-compose || echo -e "${YELLOW}⚠${NC} docker-compose 未安装（可选）"
    
    # 2. 运行测试
    FAILED=0
    
    test_dockerfile || FAILED=$((FAILED+1))
    test_env_file || FAILED=$((FAILED+1))
    test_compose_config || FAILED=$((FAILED+1))
    test_health_endpoint || FAILED=$((FAILED+1))
    
    # 询问是否执行构建测试
    echo ""
    echo "-----------------------------------"
    read -p "是否执行镜像构建测试？（需要几分钟时间）[y/N] " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        test_build || FAILED=$((FAILED+1))
    else
        echo -e "${YELLOW}⚠${NC} 跳过镜像构建测试"
    fi
    
    # 3. 输出结果
    echo ""
    echo "======================================"
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ 所有测试通过！${NC}"
        echo ""
        echo "下一步操作："
        echo "  1. 复制环境变量: cp .env.docker.example .env.docker"
        echo "  2. 修改 .env.docker 中的数据库密码"
        echo "  3. 启动服务: make dev-up"
        echo "  4. 访问应用: http://localhost:3000"
    else
        echo -e "${RED}✗ $FAILED 个测试失败${NC}"
        echo ""
        echo "请检查上述错误信息并修复问题"
        exit 1
    fi
    echo "======================================"
}

# 运行主函数
main

