# 02 JavaScript 核心概念

本章围绕异步、错误处理、数据结构与函数式思维，结合工具页与 API 的真实逻辑讲解。

## 1. 异步与 Promise
- `fetch` 返回 Promise；使用 `async/await` 编写可读的异步代码。
- 前端拉取远端数据：
```tsx
const fetchFeishu = async (forceRefresh = false) => {
  try {
    setApi('connecting')
    const url = `/api/feishu/classic-quotes${forceRefresh ? '?refresh=1' : ''}`
    const resp = await fetch(url, { cache: 'no-store' })
    const data = await resp.json()
    if (!resp.ok || (data && data.error)) throw new Error((data && data.error) || 'Feishu API error')
    // ...映射逻辑
    setApi('ok')
  } catch (e) {
    console.error(e)
    setApi('error')
  }
}
```
最佳实践：
- 任何可能失败的异步调用都要有 `try/catch` 与 UI 反馈。

## 2. 错误处理与容错
- 服务端：统一返回结构 `{ error }` 或 `{ quotes }`，便于前端判断。
- 前端：判断 `resp.ok` 与 `data.error`，避免静默失败。
- 容错示例：服务端避免对 `undefined` 调用 `toLowerCase`，提供安全的 `lower()`。
```ts
const lower = (v: unknown) => {
  return typeof v === 'string' ? v.toLowerCase() : ''
}
```

## 3. 数据结构与映射
- 后端从飞书返回复杂 `records`，需映射为统一 `quotes`：
```ts
const quotes = toQuotes(records, fields)
// 统一结构：{ id, text, author, category }
```
- 前端将远端 `quotes` 转为显示用 `Quote[]`，确保 `text` 不为空。
```ts
const list = Array.isArray(data.quotes) ? data.quotes : []
const mapped: Quote[] = list.map((it, i) => ({
  id: typeof it.id === 'number' ? it.id : (typeof it.id === 'string' ? Number(it.id) || i + 1 : i + 1),
  text: String(it.text ?? ''),
  author: String(it.author ?? ''),
  category: String(it.category ?? ''),
})).filter(q => q.text.length > 0)
```

## 4. 函数式思维与纯函数
- 将复杂逻辑拆分成小的纯函数，便于测试与复用。
- 示例：服务端 `toQuotes(records, fields)` 纯粹处理数据，不产生副作用。

## 5. 数组与对象操作
- 常用方法：`map`、`filter`、`reduce`。
- 示例：取优先数据源 `filtered()` 并过滤空文本。
```ts
const filtered = () => (remoteQuotes && remoteQuotes.length ? remoteQuotes : QUOTES)
```

## 6. 时间与状态
- 使用 `new Date().toLocaleString()` 在前端显示更新时刻。
- 服务端写入 `updatedAt: new Date().toISOString()` 便于持久化与排序。

---
**要点回顾**
- 异步流程统一用 `async/await`，配合 `try/catch` 与标准返回结构。
- 服务端与前端共同承担容错，保证用户体验。
- 通过映射与纯函数整理复杂数据，维持清晰、稳定的结构。