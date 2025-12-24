# 宏观经济报告 PPT Studio - Docker 配置
# 支持 Next.js 16 + Puppeteer + MySQL
# 基于 Node.js Docker 官方镜像

# ============================================
# Stage 1: 依赖安装
# ============================================
# 使用 Node.js 官方镜像（Debian Slim 版本）
FROM node:22-slim AS deps

# 安装 Puppeteer 所需的系统依赖
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    wget \
    xdg-utils \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 配置 npm 镜像源（使用淘宝镜像加速）
RUN npm config set registry https://registry.npmmirror.com

# 复制 package 文件
COPY package*.json ./

# 安装依赖（生产模式）
RUN npm ci --omit=dev

# ============================================
# Stage 2: 构建阶段
# ============================================
# 使用 Node.js 官方镜像（Debian Slim 版本）
FROM node:22-slim AS builder

WORKDIR /app

# 配置 npm 镜像源（使用淘宝镜像加速）
RUN npm config set registry https://registry.npmmirror.com

# 定义构建参数（从 CI/CD 平台传入）
ARG MYSQL_URL

# 将构建参数转换为环境变量供 Next.js 构建时使用
ENV MYSQL_URL=${MYSQL_URL}

# 从 deps 阶段复制 node_modules
COPY --from=deps /app/node_modules ./node_modules

# 复制项目文件
COPY . .

# 设置环境变量（构建时使用）
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 构建 Next.js 应用
RUN npm run build

# ============================================
# Stage 3: 生产运行阶段
# ============================================
# 使用 Node.js 官方镜像（Debian Slim 版本）
FROM node:22-slim AS runner

# 安装 Puppeteer 运行时依赖和中文字体
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    fonts-noto-cjk \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    wget \
    xdg-utils \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# 创建非 root 用户
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/drizzle ./drizzle

# 复制 package.json（用于读取版本信息等）
COPY --from=builder /app/package.json ./package.json

# 创建数据目录
RUN mkdir -p ./data && chown -R nextjs:nodejs ./data

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 8080

# 启动应用
CMD ["node", "server.js"]

