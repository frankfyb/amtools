**问题概述**
- 客户端报错 `CLIENT_FETCH_ERROR`：`/api/auth/session` 返回 HTML（500 错误页），导致 JSON 解析失败。
- 服务端堆栈指向 `@prisma/client did not initialize yet`，说明 Prisma Client 未生成或运行时未正确加载。
- 出现 `Cannot find module './996.js'` 与多条 `net::ERR_ABORTED`，属于构建产物/开发服务状态不一致引发的静态 chunk 加载中断与导航取消。

**根因定位**
- 路由：`src/app/api/auth/[...nextauth]/route.ts` 通过 `NextAuth(authOptions)` 提供接口；核心配置在 `src/app/lib/auth.ts`。
- Prisma 单例：`src/app/lib/prisma.ts:5-10` 仅使用 `DIRECT_URL` 作为数据源；与推荐的运行时池化连接（`DATABASE_URL`）不完全一致。
- Prisma 配置：`prisma.config.ts:10-13` 在迁移阶段使用 `DIRECT_URL`（5432）是合理的；但运行时建议优先 `DATABASE_URL`（6543，pgbouncer）。
- 模式：`prisma/schema.prisma` 已包含 NextAuth 所需模型，环境变量在 `.env:12-15` 均就绪。

**修复方案**
1) 生成 Prisma Client 并自检
- 执行：`rm -rf node_modules/.prisma && npx prisma generate`
- 用脚本验证：
  - `node -e 'const {PrismaClient}=require("@prisma/client"); (async()=>{ const p=new PrismaClient(); await p.$connect(); console.log("client ok"); await p.$disconnect(); })().catch(e=>{ console.error(e); process.exit(1); });'`

2) 调整运行时数据源选择（代码改动）
- 更新 `src/app/lib/prisma.ts`：优先 `process.env.DATABASE_URL`，回退 `process.env.DIRECT_URL`；缺失时显式抛错。
- 保持开发环境单例缓存，避免热重载多连接。
- 代码示意：
  - `const datasourceUrl = process.env.DATABASE_URL ?? process.env.DIRECT_URL;`
  - `if (!datasourceUrl) throw new Error('Missing DATABASE_URL or DIRECT_URL');`
  - `new PrismaClient({ datasources: { db: { url: datasourceUrl } } })`

3) 清理并重启开发/产物
- 清理产物：`rm -rf .next`
- 启动本地服务：
  - 释放端口：`lsof -i :3000 -t | xargs -r kill -9`
  - 重启：`npm run dev`

4) 会话接口与页面验证
- `curl -sS -D - http://localhost:3000/api/auth/session` 应返回 200/204 JSON（不再是 HTML）。
- 访问 `/login`、首页，观察控制台不再出现 `net::ERR_ABORTED` 与缺失模块错误。

5) 兜底与版本一致性
- 如仍报 500：执行 `npx prisma migrate deploy` 或（开发态）`npx prisma db push`，确保表结构已创建。
- 同步版本（如提示）：`npm i --save-dev prisma@latest && npm i @prisma/client@latest`，再执行 `prisma generate`。

**验证标准**
- `/api/auth/session` 返回 JSON，无 `Unexpected token '<'`。
- 浏览器不再出现静态 chunk `net::ERR_ABORTED`；登录跳转正常。
- 控制台无 `@prisma/client did not initialize yet` 或缺失模块相关错误。