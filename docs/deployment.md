# 生产环境部署指南

本指南将帮助你将应用部署到生产环境。本项目使用 Supabase 作为数据库，部署非常简单。

## 推荐部署平台

本应用可以部署到以下平台：

- ✅ **Vercel**（推荐）- 最简单的部署方式
- ✅ **Netlify** - 同样简单
- ✅ **云服务器**（VPS）- 更多控制权

---

## 方案 1: 部署到 Vercel（推荐）

Vercel 是 Next.js 官方推荐的部署平台，部署过程最简单。

### 前提条件

- GitHub/GitLab/Bitbucket 账号
- Vercel 账号（免费）
- Supabase 项目（免费）

### 步骤 1: 准备 Supabase 数据库

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 创建新项目或选择现有项目
3. 获取数据库连接字符串：
   - Settings -> Database
   - Connection string -> Connection pooling
   - 复制连接字符串

### 步骤 2: 推送代码到 Git 仓库

```bash
# 初始化 Git 仓库（如果还没有）
git init
git add .
git commit -m "Initial commit"

# 推送到 GitHub/GitLab/Bitbucket
git remote add origin <your-repo-url>
git push -u origin main
```

### 步骤 3: 在 Vercel 上部署

1. 访问 [Vercel Dashboard](https://vercel.com)
2. 点击 "Import Project"
3. 选择你的 Git 仓库
4. 配置项目：
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`（默认）
   - **Output Directory**: `.next`（默认）

5. 添加环境变量：
   - 点击 "Environment Variables"
   - 添加 `DATABASE_URL`，值为你的 Supabase 连接字符串
   
6. 点击 "Deploy"

### 步骤 4: 初始化数据库表

部署完成后，需要初始化数据库表结构：

**方法 1: 本地运行（推荐）**

在本地配置好 Supabase 连接后运行：

```bash
# 在 .env 中配置 DATABASE_URL
npm run db:push
```

**方法 2: 使用 Supabase SQL 编辑器**

在 Supabase Dashboard 中运行：

```sql
CREATE TABLE IF NOT EXISTS ppt_reports (
  id SERIAL PRIMARY KEY,
  report TEXT,
  create_time TIMESTAMP DEFAULT NOW() NOT NULL
);
```

### 步骤 5: 验证部署

访问 Vercel 提供的 URL（如 `https://your-app.vercel.app`），测试应用功能。

---

## 方案 2: 部署到 Netlify

### 步骤 1: 准备 Supabase 数据库

同 Vercel 方案的步骤 1。

### 步骤 2: 推送代码到 Git 仓库

同 Vercel 方案的步骤 2。

### 步骤 3: 在 Netlify 上部署

1. 访问 [Netlify Dashboard](https://app.netlify.com)
2. 点击 "Add new site" -> "Import an existing project"
3. 选择你的 Git 仓库
4. 配置构建设置：
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Functions directory**: `.netlify/functions`

5. 添加环境变量：
   - 进入 Site settings -> Environment variables
   - 添加 `DATABASE_URL`

6. 点击 "Deploy site"

### 步骤 4: 初始化数据库表

同 Vercel 方案的步骤 4。

---

## 方案 3: 部署到云服务器（VPS）

适合需要更多控制权的场景。

### 前提条件

- Node.js 18+ 已安装
- PM2 或其他进程管理器
- Nginx（可选，用于反向代理）
- Supabase 项目

### 步骤 1: 准备服务器

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PM2
sudo npm install -g pm2

# 安装 Nginx（可选）
sudo apt install -y nginx
```

### 步骤 2: 克隆代码

```bash
# 克隆代码仓库
git clone <your-repo-url>
cd hongguanai4

# 安装依赖
npm install
```

### 步骤 3: 配置环境变量

创建 `.env` 文件：

```bash
cp .env.example .env
nano .env
```

编辑 `.env` 文件：

```env
DATABASE_URL=postgres://postgres.xxxxxxxxxxxx:your_password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### 步骤 4: 初始化数据库

```bash
npm run db:push
```

### 步骤 5: 构建应用

```bash
npm run build
```

### 步骤 6: 使用 PM2 启动应用

```bash
# 启动应用
pm2 start npm --name "hongguanai-ppt" -- start

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs hongguanai-ppt

# 查看状态
pm2 status
```

应用现在运行在 `http://localhost:3000`

### 步骤 7: 配置 Nginx 反向代理（可选）

创建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/hongguanai-ppt
```

添加以下内容：

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

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/hongguanai-ppt /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 步骤 8: 配置 SSL（可选但推荐）

使用 Certbot 获取免费 SSL 证书：

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 环境变量配置

### 必需的环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | Supabase 数据库连接字符串 | `postgres://postgres.xxx:pass@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres` |

### 可选的环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 服务器端口（仅 VPS） | `3000` |

---

## 更新应用

### Vercel/Netlify

推送代码到 Git 仓库，自动触发部署：

```bash
git add .
git commit -m "Update"
git push
```

### VPS

```bash
# 进入项目目录
cd hongguanai4

# 拉取最新代码
git pull

# 安装新依赖（如果有）
npm install

# 重新构建
npm run build

# 重启应用
pm2 restart hongguanai-ppt
```

---

## 数据备份

### Supabase 自动备份

Supabase 提供自动备份功能：

- **免费计划**: 每天备份，保留 7 天
- **Pro 计划**: 每天备份，保留 30 天
- **Enterprise 计划**: 自定义备份策略

在 Supabase Dashboard 中查看备份：
- Settings -> Database -> Backups

### 手动备份

使用 `pg_dump` 工具备份：

```bash
# 设置 DATABASE_URL
export DATABASE_URL="your_supabase_url"

# 备份数据库
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### 恢复备份

```bash
# 恢复数据库
psql $DATABASE_URL < backup_20231215.sql
```

---

## 监控和日志

### Vercel

- 在 Vercel Dashboard 查看部署日志和运行时日志
- 自动提供分析和性能监控

### Netlify

- 在 Netlify Dashboard 查看部署日志
- 可集成第三方监控工具

### VPS

使用 PM2 查看日志：

```bash
# 实时日志
pm2 logs hongguanai-ppt

# 保存日志到文件
pm2 logs hongguanai-ppt > logs.txt

# 清除日志
pm2 flush
```

---

## 故障排查

### 数据库连接失败

1. 检查 `DATABASE_URL` 环境变量是否正确设置
2. 验证密码是否正确（特殊字符需要 URL 编码）
3. 检查 Supabase 项目状态是否为 Active
4. 确认网络可以访问 Supabase 服务器

### 构建失败

1. 检查 Node.js 版本（需要 18+）
2. 删除 `node_modules` 和 `package-lock.json`，重新安装：
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
3. 检查是否有 TypeScript 错误：
   ```bash
   npm run build
   ```

### 应用运行错误

1. 查看日志获取详细错误信息
2. 确认所有环境变量都已正确设置
3. 确认数据库表已创建（运行 `npm run db:push`）

---

## 性能优化

### 1. 启用 Next.js 缓存

Next.js 自动优化静态资源，无需额外配置。

### 2. 使用 CDN

Vercel 和 Netlify 自动使用全球 CDN，无需配置。

### 3. 图片优化

使用 Next.js Image 组件：

```tsx
import Image from 'next/image';

<Image src="/image.png" width={500} height={300} alt="Description" />
```

### 4. 数据库连接池

Supabase Connection Pooling 已启用，提供最佳性能。

---

## 安全最佳实践

1. **保护环境变量**
   - 不要在代码中硬编码敏感信息
   - 使用平台的环境变量功能
   - `.env` 文件不要提交到 Git

2. **定期更新依赖**
   ```bash
   npm audit
   npm update
   ```

3. **使用 HTTPS**
   - Vercel/Netlify 自动提供
   - VPS 使用 Certbot 配置 SSL

4. **限流保护**
   - 在 Vercel/Netlify 中配置边缘功能
   - 在 Nginx 中配置限流

5. **数据库安全**
   - Supabase 自动处理数据库安全
   - 定期备份数据

---

## 相关资源

- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Vercel 文档](https://vercel.com/docs)
- [Netlify 文档](https://docs.netlify.com/)
- [Supabase 文档](https://supabase.com/docs)
- [PM2 文档](https://pm2.keymetrics.io/)

---

## 需要帮助？

如果遇到部署问题：

1. 查看本项目的 [Supabase 设置指南](./supabase-setup.md)
2. 查看平台的官方文档
3. 在项目 GitHub Issues 中提问
