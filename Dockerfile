# 宏观经济报告 PPT Studio - Docker 配置
# 支持 Next.js 16 + Puppeteer + MySQL
# 基于 Rocky Linux 9 (CentOS 继任者)

# ============================================
# Stage 1: 依赖安装
# ============================================
FROM rockylinux:9 AS deps

# 安装 Node.js 22 和基础工具
RUN yum install -y epel-release && \
    yum module reset nodejs -y && \
    curl -fsSL https://rpm.nodesource.com/setup_22.x | bash - && \
    yum install -y nodejs && \
    yum clean all && \
    rm -rf /var/cache/yum

# 安装 Puppeteer 所需的系统依赖
RUN yum install -y \
    alsa-lib \
    atk \
    at-spi2-atk \
    at-spi2-core \
    cairo \
    cups-libs \
    dbus-libs \
    expat \
    fontconfig \
    glib2 \
    gtk3 \
    libX11 \
    libX11-xcb \
    libXcomposite \
    libXcursor \
    libXdamage \
    libXext \
    libXfixes \
    libXi \
    libXrandr \
    libXrender \
    libXScrnSaver \
    libXtst \
    libdrm \
    libgbm \
    mesa-libgbm \
    nspr \
    nss \
    pango \
    xdg-utils \
    wget \
    ca-certificates \
    && yum clean all && \
    rm -rf /var/cache/yum

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖（生产模式）
RUN npm ci --omit=dev

# ============================================
# Stage 2: 构建阶段
# ============================================
FROM rockylinux:9 AS builder

# 安装 Node.js 22
RUN yum install -y epel-release && \
    yum module reset nodejs -y && \
    curl -fsSL https://rpm.nodesource.com/setup_22.x | bash - && \
    yum install -y nodejs && \
    yum clean all && \
    rm -rf /var/cache/yum

WORKDIR /app

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
FROM rockylinux:9 AS runner

# 安装 Node.js 22
RUN yum install -y epel-release && \
    yum module reset nodejs -y && \
    curl -fsSL https://rpm.nodesource.com/setup_22.x | bash - && \
    yum install -y nodejs && \
    yum clean all && \
    rm -rf /var/cache/yum

# 安装 Puppeteer 运行时依赖和中文字体
RUN yum install -y \
    alsa-lib \
    atk \
    at-spi2-atk \
    at-spi2-core \
    cairo \
    cups-libs \
    dbus-libs \
    expat \
    fontconfig \
    glib2 \
    gtk3 \
    libX11 \
    libX11-xcb \
    libXcomposite \
    libXcursor \
    libXdamage \
    libXext \
    libXfixes \
    libXi \
    libXrandr \
    libXrender \
    libXScrnSaver \
    libXtst \
    libdrm \
    libgbm \
    mesa-libgbm \
    nspr \
    nss \
    pango \
    xdg-utils \
    wget \
    ca-certificates \
    google-noto-cjk-fonts \
    liberation-fonts \
    && yum clean all && \
    rm -rf /var/cache/yum

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
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
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# 启动应用
CMD ["node", "server.js"]

