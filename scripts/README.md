# API 测试脚本

本目录包含用于测试 AMTools Backend API 接口可用性的 JavaScript 脚本。

## 🚀 快速开始

### 1. 启动服务器
```bash
npm run dev
```

### 2. 运行测试
```bash
# 快速测试（推荐）
npm run test:api:quick

# 认证API快速测试（新增）
npm run test:auth:quick

# 认证API完整测试（新增）
npm run test:auth

# 基于 Swagger 的完整测试
npm run test:swagger

# 详细的 API 测试
npm run test:api
```

## 📋 脚本说明

### `quick-test.js` - 快速测试
- **用途**: 快速验证关键接口
- **时间**: ~5秒
- **命令**: `npm run test:api:quick`

### `test-swagger.js` - Swagger 测试
- **用途**: 基于 Swagger 规范的自动化测试
- **时间**: ~15秒
- **命令**: `npm run test:swagger`

### `test-api.js` - 完整测试
- **用途**: 全面的 API 功能测试
- **时间**: ~30秒
- **命令**: `npm run test:api`

### `quick-api-test.js` - 认证API快速测试 🆕
- **用途**: 快速验证5个认证API接口是否已实现
- **测试**: 登录、登出、刷新令牌、获取用户信息、重置密码
- **时间**: ~10秒
- **命令**: `npm run test:auth:quick`

### `test-auth-apis.js` - 认证API完整测试 🆕
- **用途**: 完整的认证流程测试，包括正常和错误场景
- **测试**: 详细的认证功能验证和错误处理测试
- **时间**: ~20秒
- **命令**: `npm run test:auth`

## 🔧 配置选项

### 环境变量
```bash
# 自定义服务器地址
API_BASE_URL=http://localhost:3001

# 自定义 API 前缀
API_PREFIX=/api/v2
```

### 使用示例
```bash
# 测试不同端口的服务器
API_BASE_URL=http://localhost:3001 npm run test:api:quick

# 测试生产环境
API_BASE_URL=https://api.amtools.com npm run test:api
```

## 📊 测试结果示例

### 成功输出
```
🚀 快速 API 可用性测试
✅ 服务器健康检查 - 状态码: 200
✅ Swagger 文档 - 状态码: 200
✅ 邮箱可用性检查 - 状态码: 200
✅ 用户名可用性检查 - 状态码: 200
📊 结果: 4/4 通过
🎉 所有关键接口正常！
```

### 失败输出
```
❌ 服务器健康检查 - 网络错误: 无法连接到服务器
💡 提示: 请确保服务器正在运行在 http://localhost:3000
```

## 🛠️ 故障排除

### 常见问题

1. **连接失败**
   - 确保服务器正在运行
   - 检查端口配置是否正确

2. **测试超时**
   - 检查网络连接
   - 确认服务器响应正常

3. **意外状态码**
   - 查看服务器日志
   - 检查 API 实现是否正确

### 调试技巧
```bash
# 查看详细日志
DEBUG=* npm run test:api

# 测试单个接口
curl http://localhost:3000/api/v1/auth/health
```

## 📈 集成到 CI/CD

### GitHub Actions 示例
```yaml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run dev &
      - run: sleep 10
      - run: npm run test:api:quick
```

## 📝 添加新测试

### 修改测试用例
编辑 `test-api.js` 中的 `testCases` 数组：

```javascript
{
  name: '新接口测试',
  method: 'GET',
  url: '/new-endpoint',
  expectedStatus: 200,
  description: '测试新增的接口'
}
```

### 自定义测试数据
修改 `generateSampleData` 函数来为新接口生成测试数据。

## 🔗 相关文档

- [API 测试指南](../docs/api-testing-guide.md)
- [Swagger 集成总结](../docs/swagger-integration-summary.md)
- [项目架构文档](../docs/)

---

**维护者**: AMTools Team  
**最后更新**: 2025-06-29
