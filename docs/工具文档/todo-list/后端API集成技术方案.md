# Todo List 后端 API 集成技术方案（PostgreSQL 同步版）

适用对象：刚接触 Next.js、Prisma 和 REST API 的新手开发者。
目标：在 `src/app/tools/todo-list` 模块接入后端 API，使用 PostgreSQL 存储数据，并确保本地前端状态与服务器端数据保持一致。

---

## 1. 系统架构设计

- 技术栈与角色
  - `Next.js 15 App Router`：提供页面与 API 路由（服务端 edge/serverless 环境）。
  - `Prisma ORM`：数据库访问层，连接 PostgreSQL，生成类型安全的客户端。
  - `PostgreSQL`：持久化存储 Todo 数据。
  - `React 19（客户端）`：页面交互、状态管理（受控组件）、调用后端 API。

- 模块边界
  - 客户端页面与组件（`src/app/tools/todo-list/*.tsx`）只负责展示与交互，不直接操作数据库。
  - 服务端 API（`src/app/tools/todo-list/api/route.ts`）是唯一的数据入口，负责创建、查询、更新、删除。
  - 数据库访问由 Prisma 统一管理，禁止在客户端引入 `@prisma/client`。

- 数据流方向（单向数据流）
  - 用户在前端发起操作 → 调用统一 API → 服务端执行数据库变更 → 返回规范化数据 → 前端更新本地状态并与远端对齐。

- 环境变量与配置
  - 数据库连接使用 `DATABASE_URL`（示例已写入 `.env.example`）。
  - 由于项目使用 `prisma.config.ts`，必须在其中 `import "dotenv/config";` 以加载 `.env` 变量。

---

## 2. 数据库表结构设计

- 目标：满足基础的 Todo 场景（新增、完成、编辑、删除），并支持排序与唯一标识。

- 表：`Todo`
  - `id`（String, `@id @default(cuid())`）：唯一标识，使用 `cuid()` 自动生成。
  - `title`（String）：任务标题/内容。
  - `done`（Boolean, `@default(false)`）：完成状态，默认未完成。
  - `createdAt`（DateTime, `@default(now())`）：创建时间，用于排序。

- Prisma schema（已存在）
  - 文件：`prisma/schema.prisma`
  - 已包含上述字段定义，迁移 ID 示例：`20251106114845_init_todo`。

- 约束建议（后续可扩展）
  - 可选唯一约束：`@@unique([title])`（若需要确保标题不重复）。
  - 可选长度限制：在 API 层校验 `title` 长度（例如 1~120）。

---

## 3. API 接口规范

- 基础 URL：`/src/app/tools/todo-list/api/route.ts` 暴露 REST 风格接口（Next.js App Router 风格）。
- 返回格式：统一返回 JSON，错误时返回 `{ error: string }` 并设置对应 `status`。

- 接口列表
  - `GET /tools/todo-list/api`
    - 功能：获取所有 Todo，按 `createdAt` 倒序。
    - 响应：`Todo[]` 数组。
    - 成功示例：`[{ id, title, done, createdAt }, ...]`
    - 错误示例：`{ error: "获取任务失败" }`，HTTP 500。

  - `POST /tools/todo-list/api`（通过 `action` 区分操作）
    - 请求体（JSON）：`{ action: string, data: Record<string, any> }`
    - 动作与参数：
      - `action: "create"`
        - `data: { title: string }`
        - 校验：`title` 不能为空、长度在允许范围内；可选去重（服务端或客户端处理）。
        - 响应：新建的 `Todo` 对象。
        - 错误：`{ error: "任务内容不能为空" }`，HTTP 400。
      - `action: "update"`
        - `data: { id: string, done?: boolean, title?: string }`
        - 说明：当前代码示例支持 `done` 更新；如需编辑标题，扩展 `data.title` 更新逻辑。
        - 响应：更新后的 `Todo` 对象。
        - 错误：`{ error: "操作失败" }`，HTTP 500。
      - `action: "delete"`
        - `data: { id: string }`
        - 响应：`{ success: true }`
    - 无效动作：返回 `{ error: "无效操作" }`，HTTP 400。

- 统一约定
  - 所有时间字段均为 ISO 字符串（由 Next.js/Prisma 序列化产生）。
  - 所有错误响应包含 `error` 字段，便于前端统一处理。

---

## 4. 数据同步机制说明

- 同步目标：保证前端展示与服务器数据库一致，避免仅本地存储带来的偏差。

- 推荐策略：乐观更新 + 远端真值
  - 前端在用户操作时，先更新本地状态（提高交互体验）。
  - 同时调用后端 API；若成功，保持状态；若失败，回滚本地状态并提示错误。

- 初始数据加载
  - 页面挂载时调用 `GET` 接口，拉取服务器最新数据，替换本地缓存（如存在）。
  - 如本地 `localStorage` 已有数据，可用于首次渲染的占位；随后用服务器数据覆盖。

- 冲突处理
  - 以服务器返回为准（真值来源）。
  - 更新失败时回滚；编辑冲突可后续引入 `updatedAt` 字段与版本比对（扩展项）。

- 去重与长度限制
  - 前端：在表单提交前做去重与长度校验，减少无效请求。
  - 后端：在 `create` 与 `update` 时做同样校验，保证数据一致性。
  - 如需强约束，数据库层可增加唯一键或检查约束。

- 缓存与持久化
  - 可以保留 `localStorage` 作为离线占位（不作为权威数据源）。
  - 每次成功的变更后，更新本地缓存，保证刷新后仍有数据展示；随后再拉取服务器最新数据做最终一致。

---

## 5. 错误处理方案

- 前端层
  - 表单校验：输入为空、长度超限、重复条目拒绝提交。
  - 统一捕获：对 `fetch` 的响应统一判断 `response.ok`，非 2xx 提示友好错误（如 Toast/消息）。
  - 乐观更新回滚：提交失败时恢复到操作前的状态。

- 服务端 API 层
  - 参数校验：对 `action` 和 `data` 必要字段做验证，缺失返回 400。
  - 异常处理：捕获 Prisma 异常并返回 500，同时记录错误信息（可扩展日志系统）。
  - 错误消息：中文提示简单明确，便于新手理解与用户反馈。

- 数据库层
  - 约束失败：如唯一键冲突（未来可能加入），返回 409 或 400，并携带可读错误描述。
  - 连接错误：检查 `DATABASE_URL` 与网络连通性，必要时重试或提示服务器不可用。

- 调试与诊断
  - 本地执行：`npx prisma validate`、`npx prisma migrate dev` 检查 schema 与迁移。
  - 日志观察：Next.js 开发服务器终端日志、浏览器 Network 面板查看请求与响应。

---

## 附：开发流程建议（无代码实现阶段）

1) 确认 `.env` 配置与 `prisma.config.ts` 的 `dotenv` 引入已完成。
2) 确认数据库已迁移并可连接（已在本项目完成）。
3) 统一前端调用入口（例如在 Page 组件中封装 `fetchTodos`/`createTodo`/`updateTodo`/`deleteTodo`）。
4) 使用上述 API 规范对接页面交互，并落实乐观更新与错误回滚策略。
5) 首次渲染用服务器数据覆盖本地缓存，后续交互保持与服务器同步。

> 说明：本方案暂不提交具体代码改动，聚焦设计与使用规范。后续我可以根据本方案，逐步在 `src/app/tools/todo-list` 中实现调用封装与页面集成。