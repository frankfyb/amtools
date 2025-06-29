# AMTools Backend 完整部署指南 - 新手版

> 🎯 **本指南专为第一次部署的新手用户设计，包含详细的步骤说明和故障排除方法**

## 📋 目录

1. [部署概述](#部署概述)
2. [环境准备](#环境准备)
3. [GitHub 配置](#github-配置)
4. [服务器配置](#服务器配置)
5. [自动部署设置](#自动部署设置)
6. [手动部署方法](#手动部署方法)
7. [验证和测试](#验证和测试)
8. [监控和维护](#监控和维护)
9. [故障排除](#故障排除)

---

## 🎯 部署概述

### 部署架构图

```
GitHub 仓库 → GitHub Actions → Docker 镜像 → 远程服务器
     ↓              ↓              ↓              ↓
   代码推送      自动构建        镜像仓库        容器运行
```

### 部署方式对比

| 方式 | 适用场景 | 难度 | 自动化程度 |
|------|----------|------|------------|
| **GitHub Actions** | 生产环境 | ⭐⭐⭐ | 🤖 全自动 |
| **Docker Compose** | 开发/测试 | ⭐⭐ | 🔧 半自动 |
| **手动部署** | 学习/调试 | ⭐ | 👨‍💻 手动 |

---

## 🛠️ 环境准备

### 1. 本地开发环境

#### 必需软件
- **Git**: 版本控制
- **Node.js**: 18.x 或更高版本
- **Docker**: 20.10+ (可选，用于本地测试)

#### 安装验证
```bash
# 检查版本
git --version          # 应显示 git version 2.x.x
node --version         # 应显示 v18.x.x 或更高
npm --version          # 应显示 8.x.x 或更高
docker --version       # 应显示 Docker version 20.x.x (可选)
```

### 2. 远程服务器要求

#### 最低配置
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **内存**: 2GB RAM (推荐 4GB+)
- **存储**: 20GB 可用空间 (推荐 50GB+)
- **网络**: 公网 IP 地址
- **端口**: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (应用)

#### 推荐配置
- **CPU**: 2 核心或更多
- **内存**: 4GB RAM 或更多
- **存储**: SSD 硬盘
- **带宽**: 10Mbps 或更高

---

## 🔧 GitHub 配置

### 1. 创建 GitHub 仓库

#### 步骤 1: 创建新仓库
1. 登录 [GitHub](https://github.com)
2. 点击右上角 "+" → "New repository"
3. 填写仓库信息：
   - **Repository name**: `amtools`
   - **Description**: `AMTools 企业级多工具平台`
   - **Visibility**: Private (推荐) 或 Public
4. 点击 "Create repository"

#### 步骤 2: 推送代码到 GitHub
```bash
# 在项目根目录执行
cd /path/to/your/amtools-backend

# 初始化 Git 仓库 (如果还没有)
git init

# 添加远程仓库 (替换为您的仓库地址)
git remote add origin https://github.com/YOUR_USERNAME/amtools.git

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit: AMTools backend with Docker deployment"

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 2. 配置 GitHub Container Registry

#### 启用 Container Registry
1. 进入仓库页面
2. 点击 "Settings" 标签
3. 在左侧菜单找到 "Actions" → "General"
4. 向下滚动到 "Workflow permissions"
5. 选择 "Read and write permissions"
6. 勾选 "Allow GitHub Actions to create and approve pull requests"
7. 点击 "Save"

### 3. 配置 GitHub Secrets

#### 必需的 Secrets
进入仓库 Settings → Secrets and variables → Actions，添加以下 secrets：

| Secret 名称 | 说明 | 示例值 |
|-------------|------|--------|
| `REMOTE_HOST` | 服务器 IP 地址 | `123.456.789.012` |
| `REMOTE_USER` | SSH 用户名 | `ubuntu` 或 `root` |
| `REMOTE_SSH_KEY` | SSH 私钥 | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `REMOTE_PORT` | SSH 端口 (可选) | `22` |

#### 生成 SSH 密钥对
```bash
# 在本地电脑执行
ssh-keygen -t rsa -b 4096 -C "github-actions@amtools" -f ~/.ssh/amtools_deploy

# 查看公钥 (需要添加到服务器)
cat ~/.ssh/amtools_deploy.pub

# 查看私钥 (需要添加到 GitHub Secrets)
cat ~/.ssh/amtools_deploy
```

---

## 🖥️ 服务器配置

### 1. 连接到服务器

#### 使用 SSH 连接
```bash
# 替换为您的服务器 IP 和用户名
ssh username@your-server-ip

# 如果使用密钥文件
ssh -i ~/.ssh/your-key.pem username@your-server-ip
```

### 2. 安装必需软件

#### 更新系统 (Ubuntu/Debian)
```bash
sudo apt update && sudo apt upgrade -y
```

#### 安装 Docker
```bash
# 下载 Docker 安装脚本
curl -fsSL https://get.docker.com -o get-docker.sh

# 执行安装
sudo sh get-docker.sh

# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER

# 重新登录或执行以下命令
newgrp docker

# 验证安装
docker --version
docker run hello-world
```

#### 安装 Docker Compose
```bash
# 下载 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

### 3. 配置 SSH 密钥

#### 添加公钥到服务器
```bash
# 在服务器上执行
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 将您的公钥内容添加到 authorized_keys
echo "YOUR_PUBLIC_KEY_CONTENT" >> ~/.ssh/authorized_keys

# 设置正确的权限
chmod 600 ~/.ssh/authorized_keys
```

### 4. 创建应用目录

```bash
# 创建应用目录
sudo mkdir -p /opt/amtools/{logs,uploads,nginx,backups}

# 设置目录所有者
sudo chown -R $USER:$USER /opt/amtools

# 设置目录权限
chmod -R 755 /opt/amtools
```

### 5. 配置防火墙

#### Ubuntu/Debian (UFW)
```bash
# 启用防火墙
sudo ufw enable

# 允许 SSH
sudo ufw allow 22/tcp

# 允许 HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 允许应用端口 (可选，如果直接访问)
sudo ufw allow 3000/tcp

# 查看状态
sudo ufw status
```

#### CentOS/RHEL (firewalld)
```bash
# 启动防火墙
sudo systemctl start firewalld
sudo systemctl enable firewalld

# 允许服务
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3000/tcp

# 重新加载配置
sudo firewall-cmd --reload
```

---

## 🚀 自动部署设置

### 1. 配置环境变量文件

#### 创建生产环境配置
```bash
# 在服务器上创建环境配置文件
nano /opt/amtools/.env
```

#### 环境配置内容 (.env)
```bash
# 应用配置
NODE_ENV=production
PORT=3000

# 数据库配置 (请替换为实际值)
DB_TYPE=postgres
DB_HOST=localhost  # 或您的数据库服务器地址
DB_PORT=5432
DB_NAME=amtools
DB_USERNAME=amtools_user
DB_PASSWORD=your_secure_database_password
DB_LOGGING=false
DB_SYNCHRONIZE=false
DB_DROP_SCHEMA=false
DB_MIGRATIONS_RUN=true

# JWT配置 (请生成新的密钥)
JWT_SECRET=your_super_secret_jwt_key_change_in_production_min_32_chars
JWT_EXPIRES_IN=2h
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production_min_32_chars
JWT_REFRESH_EXPIRES_IN=14d

# Redis配置
REDIS_HOST=localhost  # 或您的 Redis 服务器地址
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_redis_password
REDIS_DB=0
REDIS_KEY_PREFIX=amtools:prod:

# 邮件服务配置 (请替换为实际值)
EMAIL_ENABLED=true
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@qq.com
SMTP_PASS=your_email_app_password
EMAIL_FROM_NAME=AMTools
EMAIL_FROM_ADDRESS=your_email@qq.com

# 验证码配置
VERIFICATION_CODE_EXPIRES=600
VERIFICATION_CODE_LENGTH=6

# 存储配置
USE_MEMORY_CACHE=false
FORCE_REDIS=true

# 前端URL配置 (请替换为实际域名)
FRONTEND_URL=https://your-domain.com

# CORS 配置 (请替换为实际域名)
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com

# 日志配置
LOG_LEVEL=info
LOG_FILE_PATH=logs/app.log
```

### 2. 生成安全密钥

#### 生成 JWT 密钥
```bash
# 生成 32 字符的随机密钥
openssl rand -hex 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. 触发自动部署

#### 推送代码触发部署
```bash
# 在本地项目目录执行
git add .
git commit -m "feat: add production deployment configuration"
git push origin main
```

#### 查看部署进度
1. 进入 GitHub 仓库页面
2. 点击 "Actions" 标签
3. 查看最新的工作流运行状态
4. 点击具体的运行记录查看详细日志

### 4. 部署状态检查

#### GitHub Actions 工作流状态
- ✅ **绿色**: 部署成功
- ❌ **红色**: 部署失败
- 🟡 **黄色**: 部署进行中

#### 常见部署阶段
1. **Test**: 运行测试用例
2. **Build and Push**: 构建 Docker 镜像并推送
3. **Deploy**: 部署到远程服务器

---

## 🔧 手动部署方法

### 方法 1: 使用部署脚本

#### 在服务器上执行
```bash
# 下载部署脚本
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/amtools/main/amtools-backend/scripts/deploy.sh

# 添加执行权限
chmod +x deploy.sh

# 执行部署 (latest 是镜像标签)
./deploy.sh latest
```

### 方法 2: 使用 Docker Compose

#### 下载 docker-compose.yml
```bash
# 在服务器上创建项目目录
mkdir -p /opt/amtools-docker
cd /opt/amtools-docker

# 下载 docker-compose.yml
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/amtools/main/amtools-backend/docker-compose.yml

# 启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f amtools-backend
```

### 方法 3: 直接使用 Docker

#### 拉取并运行镜像
```bash
# 登录到 GitHub Container Registry
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# 拉取镜像
docker pull ghcr.io/YOUR_USERNAME/amtools-backend:latest

# 运行容器
docker run -d \
  --name amtools-backend \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file /opt/amtools/.env \
  -v /opt/amtools/logs:/app/logs \
  -v /opt/amtools/uploads:/app/uploads \
  ghcr.io/YOUR_USERNAME/amtools-backend:latest
```

---

## ✅ 验证和测试

### 1. 检查容器状态

```bash
# 查看运行中的容器
docker ps

# 查看容器日志
docker logs amtools-backend

# 查看容器详细信息
docker inspect amtools-backend
```

### 2. 健康检查

#### 基本健康检查
```bash
# 检查应用是否响应
curl http://localhost:3000/api/v1/health

# 预期响应
{
  "status": "ok",
  "timestamp": "2025-06-29T10:00:00.000Z",
  "uptime": 123.456
}
```

#### 详细 API 测试
```bash
# 测试发送验证码接口
curl -X POST http://localhost:3000/api/v1/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "type": "register"}'

# 测试用户注册接口
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPassword123!",
    "confirmPassword": "TestPassword123!",
    "verificationCode": "123456",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 3. 性能测试

#### 基本性能检查
```bash
# 检查内存使用
docker stats amtools-backend --no-stream

# 检查磁盘使用
df -h /opt/amtools

# 检查网络连接
netstat -tlnp | grep :3000
```

---

## 📊 监控和维护

### 1. 日志管理

#### 查看应用日志
```bash
# 实时查看容器日志
docker logs -f amtools-backend

# 查看应用文件日志
tail -f /opt/amtools/logs/app.log

# 查看最近 100 行日志
docker logs --tail 100 amtools-backend
```

#### 日志轮转配置
```bash
# 创建日志轮转配置
sudo tee /etc/logrotate.d/amtools > /dev/null <<EOF
/opt/amtools/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        docker kill -s USR1 amtools-backend 2>/dev/null || true
    endscript
}
EOF
```

### 2. 备份策略

#### 自动备份脚本
```bash
# 创建备份脚本
cat > /opt/amtools/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/amtools/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份应用数据
tar -czf $BACKUP_DIR/amtools_data_$DATE.tar.gz \
  /opt/amtools/logs \
  /opt/amtools/uploads \
  /opt/amtools/.env

# 备份数据库 (如果使用本地数据库)
if docker ps | grep -q postgres; then
  docker exec amtools-postgres pg_dump -U amtools amtools > $BACKUP_DIR/database_$DATE.sql
fi

# 清理 30 天前的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete

echo "备份完成: $DATE"
EOF

# 添加执行权限
chmod +x /opt/amtools/backup.sh

# 添加到定时任务 (每天凌晨 2 点执行)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/amtools/backup.sh") | crontab -
```

### 3. 更新和升级

#### 更新应用
```bash
# 拉取最新镜像
docker pull ghcr.io/YOUR_USERNAME/amtools-backend:latest

# 停止旧容器
docker stop amtools-backend

# 删除旧容器
docker rm amtools-backend

# 启动新容器
docker run -d \
  --name amtools-backend \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file /opt/amtools/.env \
  -v /opt/amtools/logs:/app/logs \
  -v /opt/amtools/uploads:/app/uploads \
  ghcr.io/YOUR_USERNAME/amtools-backend:latest

# 验证更新
curl http://localhost:3000/api/v1/health
```

#### 系统维护
```bash
# 清理未使用的 Docker 资源
docker system prune -f

# 清理未使用的镜像
docker image prune -f

# 更新系统包
sudo apt update && sudo apt upgrade -y

# 重启服务器 (如需要)
sudo reboot
```

### SSH 密钥配置

1. **生成 SSH 密钥对**：
```bash
ssh-keygen -t rsa -b 4096 -C "github-actions@amtools"
```

2. **将公钥添加到服务器**：
```bash
# 在服务器上执行
mkdir -p ~/.ssh
echo "your-public-key" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

3. **将私钥添加到 GitHub Secrets**：
   - 复制私钥内容到 `REMOTE_SSH_KEY`

### 自动部署流程

1. **推送代码到 main 分支**：
```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

2. **GitHub Actions 自动执行**：
   - ✅ 运行测试
   - ✅ 构建 Docker 镜像
   - ✅ 推送到 GitHub Container Registry
   - ✅ 部署到远程服务器

## 🐳 手动 Docker 部署

### 1. 服务器准备

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 创建应用目录
sudo mkdir -p /opt/amtools
sudo chown $USER:$USER /opt/amtools
```

### 2. 配置环境变量

```bash
# 复制环境配置模板
cp .env.docker /opt/amtools/.env

# 编辑配置文件
nano /opt/amtools/.env
```

### 3. 使用部署脚本

```bash
# 赋予执行权限
chmod +x scripts/deploy.sh

# 执行部署
./scripts/deploy.sh latest
```

### 4. 使用 Docker Compose

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f amtools-backend
```

## 🔧 服务器配置

### Nginx 配置

1. **安装 Nginx**：
```bash
sudo apt update
sudo apt install nginx
```

2. **配置 SSL 证书**：
```bash
# 使用 Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

3. **复制 Nginx 配置**：
```bash
sudo cp nginx/nginx.conf /etc/nginx/sites-available/amtools
sudo ln -s /etc/nginx/sites-available/amtools /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 防火墙配置

```bash
# 开放必要端口
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 系统服务配置

```bash
# 创建 systemd 服务
sudo tee /etc/systemd/system/amtools.service > /dev/null <<EOF
[Unit]
Description=AMTools Backend
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/amtools
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# 启用服务
sudo systemctl enable amtools
sudo systemctl start amtools
```

## 📊 监控和维护

### 健康检查

```bash
# 检查应用状态
curl http://localhost:3000/api/v1/health

# 检查容器状态
docker ps
docker logs amtools-backend
```

### 日志管理

```bash
# 查看应用日志
tail -f /opt/amtools/logs/app.log

# 查看容器日志
docker logs -f amtools-backend

# 日志轮转配置
sudo tee /etc/logrotate.d/amtools > /dev/null <<EOF
/opt/amtools/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 amtools amtools
}
EOF
```

### 备份策略

```bash
# 数据库备份
docker exec amtools-postgres pg_dump -U amtools amtools > backup-$(date +%Y%m%d).sql

# 应用数据备份
tar -czf amtools-backup-$(date +%Y%m%d).tar.gz /opt/amtools
```

## 🔍 故障排除

### 常见问题

1. **容器启动失败**：
```bash
docker logs amtools-backend
docker inspect amtools-backend
```

2. **数据库连接失败**：
```bash
docker exec -it amtools-postgres psql -U amtools -d amtools
```

3. **Redis 连接失败**：
```bash
docker exec -it amtools-redis redis-cli
```

### 回滚部署

```bash
# 查看镜像历史
docker images ghcr.io/frankfyb/amtools-backend

# 回滚到指定版本
./scripts/deploy.sh <previous-tag>
```

## 📈 性能优化

### Docker 优化

```bash
# 限制容器资源
docker update --memory=1g --cpus=1 amtools-backend

# 清理未使用的资源
docker system prune -f
```

### 数据库优化

```sql
-- PostgreSQL 性能调优
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
SELECT pg_reload_conf();
```

---

## 🔍 故障排除

### 常见问题及解决方案

#### 1. GitHub Actions 部署失败

**问题**: Actions 工作流显示红色 ❌

**排查步骤**:
```bash
# 1. 检查 GitHub Secrets 是否正确配置
# 进入仓库 Settings → Secrets and variables → Actions

# 2. 检查 SSH 连接是否正常
ssh -i ~/.ssh/amtools_deploy username@your-server-ip

# 3. 查看 Actions 日志
# 在 GitHub 仓库页面点击 Actions → 选择失败的工作流 → 查看详细日志
```

**常见错误及解决**:
- `Permission denied (publickey)`: SSH 密钥配置错误
- `Connection refused`: 服务器防火墙或 SSH 服务问题
- `Docker command not found`: 服务器未安装 Docker

#### 2. 容器启动失败

**问题**: 容器无法启动或立即退出

**排查步骤**:
```bash
# 查看容器状态
docker ps -a

# 查看容器日志
docker logs amtools-backend

# 查看容器详细信息
docker inspect amtools-backend

# 检查端口占用
netstat -tlnp | grep :3000
```

**常见错误及解决**:
```bash
# 端口被占用
sudo lsof -i :3000
sudo kill -9 <PID>

# 环境变量文件不存在
ls -la /opt/amtools/.env
chmod 644 /opt/amtools/.env

# 目录权限问题
sudo chown -R $USER:$USER /opt/amtools
chmod -R 755 /opt/amtools
```

#### 3. 数据库连接失败

**问题**: 应用无法连接到数据库

**排查步骤**:
```bash
# 检查数据库服务状态
docker ps | grep postgres

# 测试数据库连接
docker exec -it amtools-postgres psql -U amtools -d amtools

# 检查数据库日志
docker logs amtools-postgres

# 测试网络连接
telnet localhost 5432
```

**解决方案**:
```bash
# 重启数据库容器
docker restart amtools-postgres

# 检查环境变量配置
grep DB_ /opt/amtools/.env

# 重置数据库密码
docker exec -it amtools-postgres psql -U postgres -c "ALTER USER amtools PASSWORD 'new_password';"
```

#### 4. 健康检查失败

**问题**: `/api/v1/health` 接口无响应

**排查步骤**:
```bash
# 检查应用是否启动
curl -v http://localhost:3000/api/v1/health

# 检查应用日志
docker logs amtools-backend --tail 50

# 检查容器内部
docker exec -it amtools-backend sh
```

**解决方案**:
```bash
# 重启应用容器
docker restart amtools-backend

# 检查应用配置
docker exec amtools-backend cat /app/.env

# 检查应用进程
docker exec amtools-backend ps aux
```

### 紧急回滚步骤

#### 快速回滚到上一个版本
```bash
# 1. 查看可用的镜像版本
docker images ghcr.io/YOUR_USERNAME/amtools-backend

# 2. 停止当前容器
docker stop amtools-backend
docker rm amtools-backend

# 3. 启动上一个版本
docker run -d \
  --name amtools-backend \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file /opt/amtools/.env \
  -v /opt/amtools/logs:/app/logs \
  -v /opt/amtools/uploads:/app/uploads \
  ghcr.io/YOUR_USERNAME/amtools-backend:PREVIOUS_TAG

# 4. 验证回滚
curl http://localhost:3000/api/v1/health
```

### 获取帮助

#### 收集诊断信息
```bash
# 创建诊断脚本
cat > /tmp/amtools_diagnostic.sh << 'EOF'
#!/bin/bash
echo "=== AMTools 诊断信息 ==="
echo "时间: $(date)"
echo "服务器: $(hostname)"
echo ""

echo "=== 系统信息 ==="
uname -a
cat /etc/os-release
echo ""

echo "=== Docker 信息 ==="
docker --version
docker-compose --version
docker ps
echo ""

echo "=== 容器日志 (最近50行) ==="
docker logs --tail 50 amtools-backend
echo ""

echo "=== 系统资源 ==="
free -h
df -h
echo ""

echo "=== 网络状态 ==="
netstat -tlnp | grep :3000
echo ""

echo "=== 环境配置 ==="
ls -la /opt/amtools/
echo ""
EOF

chmod +x /tmp/amtools_diagnostic.sh
/tmp/amtools_diagnostic.sh > /tmp/amtools_diagnostic.log 2>&1

echo "诊断信息已保存到: /tmp/amtools_diagnostic.log"
```

---

## 🎉 部署完成

恭喜！您已经成功完成了 AMTools Backend 的部署。

### 下一步建议

1. **配置域名和 SSL 证书**
2. **设置监控和告警**
3. **配置自动备份**
4. **优化性能参数**
5. **编写运维文档**

### 访问您的应用

- **API 文档**: `http://your-server-ip:3000/api-docs`
- **健康检查**: `http://your-server-ip:3000/api/v1/health`
- **API 基础路径**: `http://your-server-ip:3000/api/v1`

**🚀 您的 AMTools Backend 现在已经在生产环境中运行了！**
