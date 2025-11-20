## 目标
- 将 Todo List 工具（`src/app/tools/todo-list`）与用户登录状态集成，实现「用户登录后，仅访问/操作自己的 Todos，并存储到数据库」。

## 数据模型调整
- 在 `prisma/schema.prisma` 的 `Todo` 模型中新增用户关联：
  - `userId String`
  - `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`
  - `@@index([userId])`
- 在 `User` 模型新增反向关联：`todos Todo[]`
- 执行迁移（使用直连 5432）：
  ```bash
  DIRECT_URL="postgresql://...:5432/postgres?sslmode=require" npx prisma migrate dev --name todo_user_link
  ```

## 服务端 API 改造
- 路径：`src/app/tools/todo-list/api/route.ts`
- 要点：
  - 使用 `getServerSession` 获取当前用户（NextAuth）
  - GET：按 `userId` 查询当前用户 Todos
  - POST：create/update/delete/clear 均检查登录态，并限定 `userId`
  - 未登录返回 `401` 或空列表

## 客户端页面改造
- 路径：`src/app/tools/todo-list/page.tsx`
- 要点：
  - 所有 `fetch` 请求加上 `credentials: 'include'`，携带会话 Cookie
  - 初次加载从服务器获取并覆盖本地，保持单一真值来源（服务器）
  - 失败时保留本地体验并提示

## 安全与一致性
- 服务端严格校验登录态，不信任前端传入的 `userId`
- 删除与清空均限定在当前用户数据范围
- 通过外键 `onDelete: Cascade` 保证用户删除时自动清理其 Todos

## 依赖与配置
- NextAuth 已配置于：`src/app/api/auth/[...nextauth]/route.ts`
- Prisma 客户端运行时容错：`src/app/lib/prisma.ts`（缺 `DATABASE_URL` 时回退 `DIRECT_URL`）
- 环境变量：`.env` 同时配置池化与直连 URL

## 回归测试
1. 未登录访问 Todo API：GET 返回 `[]`，POST 返回 `401`
2. 登录后：
   - 创建 Todo：`userId` 为当前用户
   - 查询 Todo：仅返回当前用户数据
   - 更新/删除/清空：只能操作自己的数据
3. 切换用户登录：列表应随用户变化

## 代码位置索引
- `prisma/schema.prisma: Todo.userId/user, User.todos`
- `prisma/migrations/20251119151446_todo_user_link/migration.sql`
- `src/app/tools/todo-list/api/route.ts`（会话集成与鉴权）
- `src/app/tools/todo-list/page.tsx`（携带 Cookie 发起请求）