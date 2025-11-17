# Next.js 特性与应用（围绕登录与受限路由）

## 学习目标
- 掌握 App Router、客户端/服务端组件、路由、中间件、API 路由、`next-auth` 集成。

## 核心特性
- App Router 目录结构：`src/app` 下基于文件系统路由；`page.tsx`、`layout.tsx` 等约定。
- 客户端组件：含交互/浏览器 API 的组件必须在顶部写 `'use client'`。
- 中间件：在 `src/middleware.ts` 中运行于边缘，处理请求前逻辑（如认证重定向）。
- API 路由：在 `src/app/api/*` 下编写后端接口；本项目用 `[...nextauth]` 集成 NextAuth。

## 与本项目的应用点
- 会话上下文：`src/app/providers.tsx` 使用 `SessionProvider` 包裹应用。
- 认证配置：`src/app/api/auth/[...nextauth]/route.ts` 定义 Credentials/GitHub/Google 提供商与 Prisma 适配器。
- 中间件保护：`src/middleware.ts` 导出 `next-auth/middleware` 并配置 `config.matcher = ['/back/:path*']`。
- 受限页：`src/back/page.tsx` 作为受限内容示例。

## 中间件与回跳
- 当访问受限路径且未登录：NextAuth 中间件会重定向到 `/login?callbackUrl=<原路径>`。
- 登录成功后：使用 `callbackUrl` 返回原路径，并在 URL 中追加 `login=ok` 展示提示。

## 路由与导航
- 在客户端使用 `useRouter` 的 `replace`/`push` 控制导航；服务端组件使用链接或重定向工具。

## 常见问题
- 端口被占用：开发服务器会切换到备用端口（如 3001），预览地址需更新。
- 客户端组件遗漏导致报错：检查是否使用浏览器 API 或 Hooks。

## 练习建议
- 扩展受限路径：在 `src/middleware.ts` 中添加更多 matcher，如 `'/tools/:path*'`。
- 封装 `safeCallbackUrl`，校验并保留原查询参数。