# Todo List：useEffect 教学与实践

本文以 `/src/app/tools/todo-list/page.tsx` 为例，帮助新手理解 React 中 `useEffect` 的常见用法、依赖数组的含义、挂载与卸载时机，以及如何在真实页面中做本地持久化（localStorage）。

## 为什么需要 useEffect？
- `useState` 负责存储组件的状态（如 todos 列表、输入框文本）。
- `useEffect` 负责处理“副作用”（不直接参与渲染，但影响外部世界/需要在某个时机执行）：
  - 例如：从 `localStorage` 恢复数据、在数据变化时保存到本地、订阅事件、手动更新标题等。

## 基础语法
```tsx
useEffect(() => {
  // 这里写副作用逻辑
  return () => {
    // （可选）清理逻辑：组件卸载时运行
  };
}, [deps]);
```
- `deps` 是依赖数组：只有当数组里的值变化时，副作用函数才会再次执行。
- 如果传入 `[]`（空数组），副作用只在“组件挂载”时执行一次；卸载时执行清理函数。

## 页面中的两个教学示例
在 `todo-list/page.tsx` 中，我们演示了两个典型的 useEffect 场景：

1) 首次挂载：恢复或填充初始数据
```tsx
useEffect(() => {
  console.log('[useEffect] 页面挂载：尝试从 localStorage 恢复 todos');
  try {
    const raw = localStorage.getItem('todos:v1');
    if (raw) {
      const parsed = JSON.parse(raw) as Todo[];
      if (Array.isArray(parsed)) {
        setTodos(parsed);
      }
    } else {
      // 无历史数据，填充示例任务，便于新手理解页面初始状态
      setTodos([
        { id: '1', title: '学习 useState 存储列表' },
        { id: '2', title: '学习 useEffect 初始化数据' },
      ]);
    }
  } catch (err) {
    console.warn('恢复 todos 失败：', err);
  }
  return () => {
    console.log('[useEffect] 页面卸载');
  };
}, []);
```
- 依赖数组为 `[]`，只在挂载时尝试恢复 `todos`；无数据则填充两条示例。
- 返回的函数会在页面卸载时打印日志，演示清理阶段。

2) 依赖变化：持久化到 localStorage
```tsx
useEffect(() => {
  try {
    localStorage.setItem('todos:v1', JSON.stringify(todos));
  } catch (err) {
    console.warn('保存 todos 失败：', err);
  }
}, [todos]);
```
- 依赖数组为 `[todos]`，每次 `todos` 变化（新增/删除/编辑）都会保存到本地。

## 常见坑与规范
- 避免在组件主体中直接调用 `setState`（如 `setTodos(...)`）。这会在每次渲染时触发更新，形成无限循环。应将初始化逻辑放入 `useEffect`。
- 所有 `import` 必须在文件顶部，不可写在函数内部。
- 尽量保证 `useEffect` 内的数据访问是安全的（如 `JSON.parse` 需要 `try/catch`）。
- 若副作用包含订阅（如 `addEventListener`），记得在返回的清理函数中解绑，防止内存泄漏。

## 练习建议（可扩展）
- 完成状态：为 `Todo` 增加 `done: boolean` 字段，并在 UI 上切换完成状态。
- 删除任务：增加“删除”按钮，点击后将该任务从列表移除。
- 编辑任务：点击任务文字进入编辑态，保存后更新。
- 本地持久化：继续使用 `[todos]` 依赖保存数据，保证刷新后不丢失。
- 后端联动：使用 `fetch` 在挂载时从后端拉取任务列表，依赖变化时将变更同步到后端（可配合 Next.js API 路由）。

## 完整文件位置
- 页面文件：`/src/app/tools/todo-list/page.tsx`
- 文档文件：`/docs/工具文档/todo-list/useEffect-教学.md`

如需将示例扩展为组件（如 `TodoItem`、`TodoInput`），建议提取为独立文件，保持清晰的职责边界与更佳的可维护性。