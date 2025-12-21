# 环境变量快速指南

## 📁 文件说明

- **`.env.example`** - 环境变量模板（提交到 Git）
- **`.env`** - 实际使用的配置文件（不提交到 Git）

## 🚀 快速开始

### 1. 复制模板

```bash
cp .env.example .env
```

### 2. 配置 MySQL 数据库

`.env` 文件内容：
```env
# 使用连接字符串（推荐）
MYSQL_URL=mysql://user:password@host:3306/database

# 或使用单独的连接参数
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=hongguanai
```

## ✅ 测试配置

```bash
npm run db:test
```

## 📝 注意事项

1. `.env` 文件已加入 `.gitignore`，不会被提交到版本控制
2. 团队成员需要自行创建 `.env` 文件
3. 生产环境部署时需要在服务器上配置 `.env` 文件

