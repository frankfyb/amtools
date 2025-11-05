'use client';

// 本模块负责 Todo 列表的本地持久化：读取、保存、清空
// - 适合初学者理解 JSON 序列化与浏览器 localStorage 的基本用法
// - 注意：仅在浏览器环境可用，SSR/Node 环境没有 window

// Todo 数据的类型定义：每条任务包含唯一 id、文本标题与完成状态
export type Todo = { id: string; title: string; completed: boolean };

// 存储使用的键名：更改此键会导致旧数据无法读取
const STORAGE_KEY = 'todo-list-items';

// 将任意类型的输入（unknown）标准化为 Todo 或返回 null
// - 关键逻辑：把可能缺失的字段安全地转成字符串/布尔值
// - 过滤掉标题为空的无效项，避免污染列表
function normalize(item: unknown): Todo | null {
  if (typeof item !== 'object' || item === null) return null;
  const it = item as { id?: unknown; title?: unknown; completed?: unknown };
  const id = String(it.id ?? '');
  const title = String(it.title ?? '');
  const completed = Boolean(it.completed ?? false);
  if (!title) return null;
  return { id, title, completed };
}

// 从 localStorage 读取 Todo 列表
// - 步骤：读取字符串 -> JSON.parse -> 类型标准化 -> 过滤无效项
// - 注意：JSON.parse 可能抛错，因此用 try/catch 兜底为 []
export function getTodos(): Todo[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    const normalized = (data as unknown[])
      .map((item) => normalize(item))
      .filter((t): t is Todo => t !== null);
    return normalized;
  } catch (e) {
    // 常见问题：
    // - 存储被手动改坏导致 JSON.parse 失败
    // 处理方式：返回空数组，避免页面崩溃
    return [];
  }
}

// 将 Todo 列表保存到 localStorage
// - 仅保存必要字段，避免写入额外对象方法或循环引用
// - 注意：在隐私模式或存储空间满时可能失败，需容错
export function saveTodos(todos: Todo[]) {
  if (typeof window === 'undefined') return;
  try {
    const payload = todos.map(({ id, title, completed }) => ({ id, title, completed }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    // 静默失败：不打断用户操作（也可在此做提示）
  }
}

// 清空本地存储的 Todo 列表
// - 逻辑：直接移除对应键，页面状态由外层组件清空
export function clearTodos() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // 静默失败：一般发生在存储不可写或被禁用
  }
}