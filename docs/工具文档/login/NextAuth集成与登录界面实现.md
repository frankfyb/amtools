# NextAuth 集成与登录界面实现（配置、代码、注意事项、测试）

本文档指导在本项目中集成 NextAuth.js 并实现登录界面，确保与现有风格一致且具备凭证与 OAuth 登录能力。

## 一、配置步骤
- 安装依赖：`npm i next-auth @auth/prisma-adapter bcryptjs @types/bcryptjs`
- 更新环境变量（参考 `.env.example`）：
  - `NEXTAUTH_URL`、`NEXTAUTH_SECRET`
  - `GITHUB_ID`/`GITHUB_SECRET`、`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`（可选）
- 扩展 Prisma 模型（`prisma/schema.prisma`）：新增 `User/Account/Session/VerificationToken` 模型。
- 生成与迁移：
  - `npx prisma generate`
  - `npx prisma migrate dev --name auth_init`

## 二、关键代码片段
- Prisma 单例：`src/app/lib/prisma.ts`
- NextAuth 路由：`src/app/api/auth/[...nextauth]/route.ts`
  - 提供者：`credentials`、`github`（可选）、`google`（可选）
  - 会话策略：`session.strategy = 'jwt'`
  - 回调：在 `jwt` 中保留用户 `id`，在 `session` 中暴露 `session.user.id`
- 注册接口：`src/app/api/register/route.ts`
  - 校验邮箱唯一、`bcrypt` 加密密码
- Provider 包装器：`src/app/providers.tsx`，在 `src/app/layout.tsx` 中包裹
- 中间件保护：`src/middleware.ts`（保护 `/back/*` 路由）
- 登录页面：`src/app/(auth)/login/page.tsx`
- 注册页面：`src/app/(auth)/register/page.tsx`

## 三、安全注意事项
- 强随机 `NEXTAUTH_SECRET`，生产环境保密。
- 凭证登录必须存储哈希密码（`bcrypt.hash`），绝不明文。
- 限制暴露的会话字段，不在客户端暴露敏感信息。
- OAuth 回调 URL 必须列入提供商白名单。
- 避免在服务端环境打印用户敏感数据到日志。

## 四、测试方案
- 本地启动：`npm run dev`，访问 `http://localhost:3000/login`
- 凭证登录：
  - 先注册：`POST /api/register { email, name?, password }`
  - 登录：在登录页输入 `邮箱或用户名` + `密码`
- OAuth 登录：
  - 在 `.env` 中配置提供商 Client ID/Secret
  - 点击登录页的 GitHub/Google 登录按钮
- 受保护路由验证：访问 `/back`，未登录应跳转到登录页；登录后可访问。

## 五、常见问题
- 架构说明：本项目使用 Next.js App Router、Prisma、PostgreSQL；NextAuth 采用 `JWT` 会话，适合无状态部署。
- Prisma 客户端：采用单例 `src/app/lib/prisma.ts`，避免开发模式多连接问题。
- 环境变量加载：`prisma.config.ts` 顶部 `import "dotenv/config";` 已处理。

如需继续扩展：支持“忘记密码”邮件链接、邮箱验证、用户资料页等，我可以按你的需求迭代实现。