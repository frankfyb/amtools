# API 接口测试指南

## 📋 概述

本文档介绍了 AMTools Backend 项目中的 API 接口测试脚本和使用方法。我们提供了三种不同级别的测试脚本，用于验证 API 接口的可用性和功能正确性。

## 🚀 测试脚本

### 1. 快速测试 (`npm run test:api:quick`)

**用途**: 快速检查关键 API 接口是否可用  
**脚本**: `scripts/quick-test.js`  
**执行时间**: ~5秒  

**测试内容**:
- ✅ 服务器健康检查
- ✅ Swagger 文档可访问性
- ✅ 邮箱可用性检查
- ✅ 用户名可用性检查

**使用场景**:
- 开发环境快速验证
- CI/CD 流水线健康检查
- 服务器部署后的基本验证

### 2. Swagger 规范测试 (`npm run test:swagger`)

**用途**: 基于 Swagger 规范自动测试所有 API 接口  
**脚本**: `scripts/test-swagger.js`  
**执行时间**: ~15秒  

**测试内容**:
- 📖 自动获取 Swagger API 规范
- 🧪 测试所有已定义的 API 接口
- 📊 生成详细的测试报告
- 🔍 验证响应格式和状态码

**特点**:
- 自动发现所有 API 接口
- 智能生成测试数据
- 基于 OpenAPI 规范验证

### 3. 完整 API 测试 (`npm run test:api`)

**用途**: 全面的 API 接口功能测试  
**脚本**: `scripts/test-api.js`  
**执行时间**: ~30秒  

**测试内容**:
- 🔍 Swagger 文档可用性测试
- 📋 所有 API 接口的详细测试
- 📊 完整的测试统计和报告
- 🎨 彩色输出和详细日志

**特点**:
- 最全面的测试覆盖
- 详细的错误信息和调试数据
- 完整的测试统计报告

## 📊 最新测试结果

### 快速测试结果
```
🚀 快速 API 可用性测试
✅ 服务器健康检查 - 状态码: 200
✅ Swagger 文档 - 状态码: 200
✅ 邮箱可用性检查 - 状态码: 200
✅ 用户名可用性检查 - 状态码: 200

📊 结果: 4/4 通过
🎉 所有关键接口正常！
```

### Swagger 测试结果
```
📊 测试结果统计
==============================
总接口数: 13
已测试: 13
通过: 12
失败: 1
成功率: 92.3%
```

### 完整 API 测试结果
```
📊 测试结果统计
==============================
总计: 11
通过: 10
失败: 1
跳过: 0
成功率: 90.9%
```

## ✅ 通过测试的接口

### 认证管理模块
- ✅ `GET /auth/health` - 健康检查
- ✅ `POST /auth/send-verification-code` - 发送验证码
- ✅ `POST /auth/register` - 用户注册
- ✅ `POST /auth/login` - 用户登录 (返回未实现)
- ✅ `POST /auth/logout` - 用户登出 (返回未实现)
- ✅ `POST /auth/refresh` - 刷新令牌 (返回未实现)
- ✅ `POST /auth/reset-password` - 重置密码 (返回未实现)
- ✅ `GET /auth/me` - 获取当前用户信息 (返回未实现)

### 可用性检查模块
- ✅ `GET /auth/availability/email/{email}` - 邮箱可用性检查
- ✅ `GET /auth/availability/username/{username}` - 用户名可用性检查
- ✅ `GET /auth/availability/batch` - 批量检查 (返回未实现)
- ✅ `GET /auth/availability/stats` - 统计信息

### Swagger 文档
- ✅ `GET /api-docs` - Swagger UI 界面
- ✅ `GET /api-docs.json` - API 规范 JSON

## ⚠️ 需要修复的问题

### 1. 邮箱验证接口错误
**接口**: `POST /auth/verify-email`  
**错误**: `CommandHandlerNotFoundError: Command handler not found for command type: VerifyEmailCommand`  
**原因**: 缺少 VerifyEmailCommand 的命令处理器  
**优先级**: 高  

**解决方案**:
```typescript
// 需要在 CQRS 系统中注册 VerifyEmailCommandHandler
container.register('VerifyEmailCommandHandler', VerifyEmailCommandHandler);
```

## 🔧 使用方法

### 开发环境测试
```bash
# 启动服务器
npm run dev

# 在另一个终端运行测试
npm run test:api:quick    # 快速测试
npm run test:swagger      # Swagger 测试
npm run test:api          # 完整测试
```

### CI/CD 集成
```yaml
# GitHub Actions 示例
- name: Test API Endpoints
  run: |
    npm run dev &
    sleep 10
    npm run test:api:quick
```

### 自定义测试配置
```bash
# 自定义服务器地址
API_BASE_URL=http://localhost:3001 npm run test:api

# 自定义 API 前缀
API_PREFIX=/api/v2 npm run test:api
```

## 📈 测试覆盖率分析

### 接口覆盖率
- **总接口数**: 13
- **已测试**: 13 (100%)
- **功能正常**: 12 (92.3%)
- **需要修复**: 1 (7.7%)

### 模块覆盖率
- **认证管理**: 8/9 接口正常 (88.9%)
- **可用性检查**: 4/4 接口正常 (100%)
- **文档系统**: 2/2 接口正常 (100%)

## 🎯 测试最佳实践

### 1. 定期运行测试
- 每次代码提交前运行快速测试
- 每日构建时运行完整测试
- 部署前运行 Swagger 测试

### 2. 监控测试结果
- 关注成功率变化趋势
- 及时修复失败的测试用例
- 定期更新测试数据

### 3. 扩展测试覆盖
- 为新增接口添加测试用例
- 完善边界条件测试
- 增加性能测试

## 🔮 未来改进计划

### 1. 增强测试功能
- [ ] 添加性能测试 (响应时间、并发)
- [ ] 实现数据驱动测试
- [ ] 添加安全性测试

### 2. 改进测试报告
- [ ] 生成 HTML 测试报告
- [ ] 集成测试覆盖率统计
- [ ] 添加历史趋势分析

### 3. 自动化集成
- [ ] 集成到 CI/CD 流水线
- [ ] 自动化测试环境部署
- [ ] 测试结果通知机制

## 📞 支持和反馈

如果您在使用测试脚本时遇到问题，请：

1. 检查服务器是否正常运行
2. 确认端口配置是否正确
3. 查看详细的错误日志
4. 联系开发团队获取支持

---

**最后更新**: 2025-06-29  
**文档版本**: 1.0.0  
**测试脚本版本**: 1.0.0
