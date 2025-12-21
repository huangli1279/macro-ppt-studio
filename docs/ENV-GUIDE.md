# 环境变量快速指南

## 📁 文件说明

- **`.env.example`** - 环境变量模板（提交到 Git）
- **`.env`** - 实际使用的配置文件（不提交到 Git）

## 🚀 快速开始

### 1. 复制模板

```bash
cp .env.example .env
```

### 2. 根据环境修改配置

#### 开发环境（默认 SQLite）

`.env` 文件内容：
```env
DATABASE_TYPE=sqlite
SQLITE_DB_PATH=./data/ppt.db
```

#### 生产环境（MySQL）

`.env` 文件内容：
```env
DATABASE_TYPE=mysql
MYSQL_URL=mysql://user:password@host:3306/database
```

## 🔄 切换数据库

只需修改 `.env` 文件中的 `DATABASE_TYPE` 即可：

```env
# 使用 SQLite
DATABASE_TYPE=sqlite

# 使用 MySQL
DATABASE_TYPE=mysql
```

## ✅ 测试配置

```bash
npm run db:test
```

## 📝 注意事项

1. `.env` 文件已加入 `.gitignore`，不会被提交到版本控制
2. 团队成员需要自行创建 `.env` 文件
3. 生产环境部署时需要在服务器上配置 `.env` 文件

