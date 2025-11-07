# Todo List 后端 API 开发文档（实现细节、接口说明、测试与部署）

本开发文档与《后端API集成技术方案》保持一致，记录了具体实现细节、接口说明、测试用例与部署指南，确保团队成员能够复现与维护。

---

## 1. 代码实现细节

- 路由位置
  - 文件：`src/app/tools/todo-list/api/route.ts`
  - 技术：Next.js App Router 的 Route Handlers，导出 `GET` 与 `POST`。

- 依赖与初始化
  - `import { PrismaClient } from '@prisma/client'`：在服务端路由中初始化 Prisma 客户端。
  - `const prisma = new PrismaClient();`：创建实例用于查询与修改数据。

- GET 逻辑
  - `prisma.todo.findMany({ orderBy: { createdAt: 'desc' } })`：按创建时间倒序。
  - 成功返回 `NextResponse.json(todos)`；异常返回 `{ error: '获取任务失败' }` + 500。

- POST 逻辑（通过 `action` 分派）
  - 请求体格式：`{ action: string, data: Record<string, any> }`
  - `create`：校验 `title` 非空 → `prisma.todo.create({ data: { title } })`
  - `update`：支持 `done` 与 `title` 更新
    - 校验 `id` 存在且为字符串
    - `done` 为布尔类型时更新完成状态
    - `title` 为字符串时按规则校验（非空、<=100）后更新标题
    - 若无任何更新字段，返回 400：`未提供更新字段`
    - 更新：`prisma.todo.update({ where: { id }, data: updateData })`
  - `delete`：校验 `id` 后执行 `prisma.todo.delete({ where: { id } })`
  - 返回错误时包含 `{ error: string }` 与对应状态码（400/500）。

- 类型修复
  - `updateData` 类型替换为 `{ done?: boolean; title?: string }`，避免 `any`。

---

## 2. 前端集成与数据同步

- 页面位置：`src/app/tools/todo-list/page.tsx`
- 关键改造点：
  - 定义 `ServerTodo` 类型与 `toClient` 映射（后端 `done` → 前端 `completed`）。
  - 封装 `fetchServerTodos/createServerTodo/updateServerTodoDone/updateServerTodoTitle/deleteServerTodo`。
  - 首次渲染：先读取本地缓存，随后调用 `fetchServerTodos()` 覆盖为服务器最新数据。
  - 交互：添加/完成切换/删除/编辑均调用服务器接口，并使用“乐观更新 + 失败回滚”。
  - 本地缓存：每次状态变化仍写入 `localStorage`，提高刷新后的体验，但以服务器数据为真值。

---

## 3. API 接口说明（最终版）

- 基础路径：`/tools/todo-list/api`

- `GET`
  - 功能：获取全部 Todo（desc by `createdAt`）
  - 响应：`ServerTodo[]` → `{ id, title, done, createdAt }[]`

- `POST`
  - 请求体：`{ action: 'create'|'update'|'delete'|'clear', data: {...} }`
  - `create`
    - `data: { title: string }`
    - 错误：400 `{ error: '任务内容不能为空' }`
    - 成功：返回新建 `ServerTodo`
  - `update`
    - `data: { id: string, done?: boolean, title?: string }`
    - 错误：400 `{ error: '缺少有效 id'|'任务内容不能为空'|'任务内容长度不能超过 100 字'|'未提供更新字段' }`
    - 成功：返回更新后的 `ServerTodo`
  - `delete`
    - `data: { id: string }`
    - 成功：`{ success: true }`
  - `clear`
    - `data: {}`
    - 成功：`{ success: true, deleted: number }`

---

## 4. 测试用例

- 环境准备
  - `.env`：确保 `DATABASE_URL` 指向可访问的 PostgreSQL（已在本仓库配置）。
  - `npx prisma validate` / `npx prisma migrate dev`：确保 schema 与数据库同步。

- 手工测试（浏览器）
  - 访问：`http://localhost:3000/tools/todo-list`
  - 场景：
    - 首屏加载：应显示服务器返回的 Todo 列表（若为空显示空态）。
    - 新增：输入非空、<=100 的标题 → 列表新增；服务器成功写入。
    - 完成切换：点击切换完成状态 → 列表更新；如服务器失败，提示并回滚。
    - 删除：点击删除 → 列表移除；如服务器失败，提示并回滚。
    - 编辑：双击或触发编辑后改标题 → 列表更新；如服务器失败，提示并回滚。
  - 清空：点击“清空任务”→ 调用后端删除全部当前任务 → 列表为空。

- API 层测试（curl 示例）
  - `GET`
    - `curl -s http://localhost:3000/tools/todo-list/api | jq .`
  - `create`
    - `curl -s -X POST http://localhost:3000/tools/todo-list/api -H 'Content-Type: application/json' -d '{"action":"create","data":{"title":"写文档"}}' | jq .`
  - `update (done)`
    - `curl -s -X POST http://localhost:3000/tools/todo-list/api -H 'Content-Type: application/json' -d '{"action":"update","data":{"id":"<ID>","done":true}}' | jq .`
  - `update (title)`
    - `curl -s -X POST http://localhost:3000/tools/todo-list/api -H 'Content-Type: application/json' -d '{"action":"update","data":{"id":"<ID>","title":"新标题"}}' | jq .`
  - `delete`
    - `curl -s -X POST http://localhost:3000/tools/todo-list/api -H 'Content-Type: application/json' -d '{"action":"delete","data":{"id":"<ID>"}}' | jq .`

---

## 5. 部署指南

- 环境变量
  - 在生产环境（如 Vercel）配置 `DATABASE_URL`，与开发环境不同的连接字符串。
  - 保持 `prisma.config.ts` 顶部 `import "dotenv/config";`，以确保在构建/运行时正确加载本地 `.env`（在 CI/CD 场景下通常依赖平台注入的环境变量）。

- 数据库迁移
  - 初次部署：运行 `npx prisma migrate deploy` 应用所有迁移。
  - 变更 schema：本地 `npx prisma migrate dev` 生成迁移并推送到仓库，生产环境按上一步部署。

- 构建与启动
  - 构建：`npm run build`
  - 启动：`npm run start`
  - 平台（Vercel）：确保项目环境变量配置完整，构建日志无错误，部署后访问 `/tools/todo-list` 验证。

- 监控与错误排查
  - 观察平台日志与 Next.js 服务器日志，定位 API 异常（连接失败、约束冲突等）。
  - 若有唯一约束或其他规则，更新错误处理为更具体的状态码（如 409）。

---

## 6. 维护与扩展建议

- 可扩展字段：`updatedAt`（自动更新）、`order`（拖拽排序）、`userId`（多用户隔离）。
- 服务端校验：引入 Zod/Valibot 做结构化校验，减少魔法字符串。
- 错误展示：将 `alert` 替换为更友好的 UI（Toast、Inline Error）。
- 测试自动化：引入 Playwright 做端到端测试，覆盖关键交互与 API 成功/失败路径。

---

文档到此完成。如需我继续完善自动化测试或部署脚本的细节，我可以根据你的平台与流程补充具体配置。