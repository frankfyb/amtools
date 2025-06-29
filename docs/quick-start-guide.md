# AMTools Backend 新手快速入门指南

> 🚀 **5分钟快速部署指南 - 专为新手设计**

## 📋 准备清单

在开始之前，请确保您有：

- [ ] 一台云服务器 (2GB+ RAM, Ubuntu 20.04+)
- [ ] 服务器的 SSH 访问权限
- [ ] GitHub 账户
- [ ] 本地安装了 Git

## 🎯 快速部署 (5步完成)

### 第1步: 准备服务器 (2分钟)

```bash
# 连接到您的服务器
ssh username@your-server-ip

# 安装 Docker (一键安装)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 重新登录使 Docker 权限生效
exit
ssh username@your-server-ip

# 验证 Docker 安装
docker --version
```

### 第2步: 配置 GitHub (1分钟)

1. **Fork 或 Clone 项目**
   - 访问: https://github.com/YOUR_USERNAME/amtools
   - 点击 "Fork" 或下载代码

2. **生成 SSH 密钥**
```bash
# 在本地电脑执行
ssh-keygen -t rsa -b 4096 -f ~/.ssh/amtools_key

# 查看公钥 (复制这个内容)
cat ~/.ssh/amtools_key.pub

# 查看私钥 (稍后需要)
cat ~/.ssh/amtools_key
```

3. **添加公钥到服务器**
```bash
# 在服务器上执行
mkdir -p ~/.ssh
echo "粘贴您的公钥内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 第3步: 配置 GitHub Secrets (1分钟)

进入您的 GitHub 仓库页面:
1. 点击 "Settings" → "Secrets and variables" → "Actions"
2. 点击 "New repository secret" 添加以下内容:

| 名称 | 值 |
|------|-----|
| `REMOTE_HOST` | 您的服务器IP地址 |
| `REMOTE_USER` | SSH用户名 (如: ubuntu) |
| `REMOTE_SSH_KEY` | 私钥内容 (整个文件内容) |

### 第4步: 配置环境变量 (1分钟)

在服务器上创建配置文件:

```bash
# 创建应用目录
sudo mkdir -p /opt/amtools
sudo chown $USER:$USER /opt/amtools

# 创建环境配置文件
cat > /opt/amtools/.env << 'EOF'
# 基本配置
NODE_ENV=production
PORT=3000

# 数据库配置 (使用 SQLite 简化部署)
DB_TYPE=sqlite
DB_DATABASE=/app/data/amtools.db

# JWT 密钥 (请更改为随机字符串)
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-to-random-string-min-32-chars

# Redis 配置 (使用内存模式简化部署)
USE_MEMORY_CACHE=true
FORCE_REDIS=false

# 邮件配置 (可选，用于发送验证码)
EMAIL_ENABLED=false

# 其他配置
VERIFICATION_CODE_EXPIRES=600
LOG_LEVEL=info
EOF
```

### 第5步: 部署应用 (1分钟)

```bash
# 推送代码触发自动部署
git add .
git commit -m "Initial deployment setup"
git push origin main
```

## ✅ 验证部署

### 检查部署状态

1. **查看 GitHub Actions**
   - 进入仓库页面 → "Actions" 标签
   - 查看工作流是否成功 (绿色 ✅)

2. **检查应用状态**
```bash
# 在服务器上执行
docker ps
curl http://localhost:3000/api/v1/health
```

3. **测试 API**
```bash
# 测试发送验证码
curl -X POST http://localhost:3000/api/v1/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "type": "register"}'
```

## 🎉 完成！

如果看到以下响应，说明部署成功：

```json
{
  "status": "ok",
  "timestamp": "2025-06-29T10:00:00.000Z",
  "uptime": 123.456
}
```

## 🔧 常见问题

### Q: GitHub Actions 失败了怎么办？
**A**: 检查 Secrets 配置是否正确，特别是 SSH 密钥格式

### Q: 容器启动失败？
**A**: 检查环境变量文件和目录权限
```bash
ls -la /opt/amtools/.env
sudo chown $USER:$USER /opt/amtools
```

### Q: 无法访问 API？
**A**: 检查防火墙设置
```bash
sudo ufw allow 3000/tcp
```

### Q: 想要使用真实数据库？
**A**: 修改 `/opt/amtools/.env` 中的数据库配置，然后重启容器

## 📚 下一步

部署成功后，您可以：

1. **配置域名**: 将域名指向服务器IP
2. **启用 HTTPS**: 使用 Let's Encrypt 免费证书
3. **配置邮件**: 启用邮件验证功能
4. **监控应用**: 设置日志和监控
5. **扩展功能**: 添加更多业务模块

## 🆘 需要帮助？

- 📖 **详细文档**: [完整部署指南](./deployment-guide.md)
- 🐛 **问题反馈**: 在 GitHub 创建 Issue
- 💬 **技术交流**: 查看项目 README

**🎊 恭喜！您已经成功部署了 AMTools Backend！**
