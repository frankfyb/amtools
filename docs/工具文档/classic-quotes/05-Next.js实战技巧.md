# 05 Next.js 实战技巧

本章从 API 路由与页面协作出发，讲解 Next.js 在本项目中的关键实践。

## 1. 路由与文件约定
- API 路由：`src/app/api/feishu/classic-quotes/route.ts` 暴露 `GET` 方法。
- 页面路由：`src/app/tools/classic-quotes/page.tsx` 对应 `/tools/classic-quotes`。
- 约定式路由简化了结构与导航，无需显式注册。

## 2. 服务器端的数据拉取与缓存
- 服务端在刷新时从飞书拉取数据并写到工具目录：
```ts
const DATA_FILE = path.join(process.cwd(), 'src', 'app', 'tools', 'classic-quotes', 'classic-quotes.json')
await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8')
```
- 非刷新模式会直接读取本地 JSON，提高响应速度：
```ts
if (!refresh) {
  const buf = await fs.readFile(DATA_FILE, 'utf8')
  const json = JSON.parse(buf)
  return NextResponse.json(json, { status: 200, headers: { 'Cache-Control': 'no-store' } })
}
```

## 3. 环境变量与安全
- 通过 `.env` 注入飞书凭证：`FEISHU_APP_ID`、`FEISHU_APP_SECRET`、`FEISHU_BASE_TOKEN`、`FEISHU_TABLE_ID`、`FEISHU_VIEW_ID`。
- 服务端检查环境变量缺失时返回错误，避免空请求：
```ts
if (!APP_ID || !APP_SECRET || !APP_TOKEN || !TABLE_ID) {
  return NextResponse.json({ error: 'Missing Feishu env' }, { status: 500 })
}
```

## 4. 接口稳定性与响应结构
- 统一响应结构，便于前端消费：
```ts
return NextResponse.json({ source, updatedAt, schema, records, quotes }, { status: 200 })
// 错误时：{ error: string }
```
- 使用 `headers: { 'Cache-Control': 'no-store' }` 保证开发态数据及时刷新。

## 5. 客户端数据获取与错误处理
- 前端通过 `fetch('/api/...')` 获取数据，严格判断错误并映射：
```ts
if (!resp.ok || (data && data.error)) throw new Error((data && data.error) || 'Feishu API error')
```
- 提供手动刷新（`?refresh=1`）与自动刷新（每 60 秒）两种策略。

## 6. 文件系统与工具内聚
- 将数据文件写在工具目录：`src/app/tools/classic-quotes/classic-quotes.json`，实现工具级内聚，方便迁移与维护。
- 使用 `ensureDir` 保证写入路径存在：
```ts
async function ensureDir(filePath: string) {
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })
}
```

## 7. 最佳实践
- 服务端容错要充分（API 失败、字段缺失、分页处理）。
- 前端优先使用远端数据，失败时回退到本地内置语录，保证可用性。
- 清晰的错误提示与稳定的响应结构是联调效率的关键。

---
**要点回顾**
- 利用约定式路由实现 API 与页面协作；本地缓存提高响应速度。
- 环境变量与容错保障服务端稳定；客户端严格判断并映射数据。