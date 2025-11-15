# 04 React 框架应用

本章结合 `page.tsx` 的真实逻辑讲解 React 在本工具中的应用：状态管理、生命周期、交互与渲染。

## 1. 组件与状态
- 使用 `useState` 管理 UI 状态：
```tsx
const [api, setApi] = useState<'connecting'|'ok'|'error'>('connecting')
const [loading, setLoading] = useState(false)
const [favIds, setFavIds] = useState<number[]>([])
const [remoteQuotes, setRemoteQuotes] = useState<Quote[] | null>(null)
```
- 状态语义清晰，便于 UI 映射（如错误提示、加载指示）。

## 2. 生命周期与副作用
- `useEffect` 控制初始化拉取与定时刷新：
```tsx
useEffect(() => { fetchFeishu(false) }, [])
useEffect(() => { const t = window.setInterval(() => fetchFeishu(true), 60000); return () => window.clearInterval(t) }, [])
```
- 副作用需在卸载时清理（定时器/监听器）。

## 3. 事件与交互
- 点击按钮触发随机语录：
```tsx
const fetchQuote = () => {
  setLoading(true)
  const arr = filtered()
  if (!arr.length) { setErr('📭 暂无语录数据'); setLoading(false); return }
  const picked = arr[Math.floor(Math.random()*arr.length)]
  setQ(picked)
  setLoading(false)
}
```
- 收藏按钮切换选中态（高亮），并写入本地存储。

## 4. 条件渲染与占位
- 根据 `api`、`loading`、`err` 显示不同 UI：加载动画、错误提示、空数据占位。
- 最佳实践：避免在数据未准备好时渲染依赖数据的组件。

## 5. 列表渲染与键值
- 渲染收藏列表时使用稳定的 `key`（例如 `quote.id`）。
- 从当前数据源 `filtered()` 中筛选收藏，避免远端与本地数据不一致。

## 6. 动画与可用性
- 使用 `gsap` 控制卡片动画句柄，防重复创建与内存泄漏。
- 在加载时间超过阈值时显示“网络较慢”的提示，提升体验。

## 7. 组件内的最佳实践
- 将数据源选择与映射抽出来（`filtered()`），避免重复逻辑。
- 将错误与加载态置于交互函数的最前面，保证逻辑完整。
- 在状态较多时分层处理：数据（quotes）、UI（loading/err）、行为（fetchQuote/fetchFeishu）。

---
**要点回顾**
- 用状态表达 UI 语义，用副作用控制生命周期行为。
- 交互函数中优先处理边界与反馈，保证用户体验一致。