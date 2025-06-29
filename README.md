# AMTools Backend

> 🚀 **企业级多工具平台后端服务**

## 📋 分支说明

本仓库采用多分支开发模式：

### 🌟 **主要分支**

- **`main`** - 主分支（当前分支）
  - 仅包含项目说明和分支导航
  - 不包含具体代码实现

- **`develop`** - 开发分支
  - 包含最新的开发代码
  - 功能开发和测试的主要分支

- **`user`** - 用户功能分支
  - 包含完整的用户认证系统
  - 包含 GitHub Actions 自动部署配置
  - 包含完整的部署文档和指南

## 🚀 快速开始

### 查看完整代码和部署方案

```bash
# 切换到 user 分支查看完整实现
git checkout user

# 或者直接克隆 user 分支
git clone -b user https://github.com/frankfyb/amtools.git
```

### 部署到生产环境

1. **新手用户** (推荐)：
   - 切换到 `user` 分支
   - 查看 `docs/quick-start-guide.md`
   - 5分钟快速部署指南

2. **高级用户**：
   - 切换到 `user` 分支
   - 查看 `docs/deployment-guide.md`
   - 完整的生产环境部署文档

## 📚 文档导航

所有详细文档都在 `user` 分支中：

- **[新手快速入门](../../tree/user/docs/quick-start-guide.md)** - 5分钟部署指南
- **[完整部署指南](../../tree/user/docs/deployment-guide.md)** - 生产环境配置
- **[部署检查清单](../../tree/user/docs/deployment-checklist.md)** - 确保部署成功
- **[API 文档](../../tree/user/docs/README.md)** - 完整的 API 说明

## 🔧 技术栈

- **Node.js 18+** - 运行时环境
- **TypeScript** - 开发语言
- **Express.js** - Web 框架
- **PostgreSQL/SQLite** - 数据库
- **Redis** - 缓存系统
- **Docker** - 容器化部署
- **GitHub Actions** - CI/CD 自动部署

## 🎯 功能特性

### ✅ 已实现功能 (user 分支)

- **用户认证系统**
  - 用户注册/登录
  - 邮箱验证
  - JWT Token 管理
  - 密码重置

- **部署方案**
  - GitHub Actions 自动部署
  - Docker 容器化
  - 生产环境配置
  - 监控和维护

- **开发工具**
  - Swagger API 文档
  - 完整的测试套件
  - 代码质量检查

### 🔄 开发中功能 (develop 分支)

- 工具分类管理
- 权限控制系统
- 数据统计分析
- 更多业务功能

## 🌐 在线访问

部署完成后，您可以访问：

- **API 服务**: `http://your-domain.com/api/v1`
- **API 文档**: `http://your-domain.com/api-docs`
- **健康检查**: `http://your-domain.com/api/v1/health`

## 🆘 获取帮助

- 📖 **查看文档**: 切换到 `user` 分支查看完整文档
- 🐛 **问题反馈**: 在 GitHub Issues 中提交问题
- 💬 **技术交流**: 查看项目 Wiki 和讨论区

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

**🎯 要查看完整的代码实现和部署方案，请切换到 `user` 分支！**

```bash
git checkout user
```
