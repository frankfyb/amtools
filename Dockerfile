# AMTools Backend Dockerfile
# 多阶段构建，优化镜像大小

# 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖（包括开发依赖）
RUN npm ci --only=production --silent

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM node:18-alpine AS production

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S amtools -u 1001

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production --silent && \
    npm cache clean --force

# 从构建阶段复制构建产物
COPY --from=builder /app/dist ./dist

# 创建必要的目录
RUN mkdir -p logs uploads && \
    chown -R amtools:nodejs /app

# 切换到非 root 用户
USER amtools

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 启动应用
CMD ["node", "dist/main.js"]
