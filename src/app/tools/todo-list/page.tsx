'use client'; // 标记为客户端组件（Next.js 13+ 必需）


// TodoPage 页面：整合表单、列表与本地持久化逻辑
// 作用：
// - 作为状态源（todos），通过回调驱动子组件交互
// - 使用 useEffect 初始化与持久化到 localStorage
// 重要变量：
// - todos：当前的任务数组（包含 id/title/completed）
// 核心流程：
// 1) 首次渲染：从 localStorage 读取（若无则填充示例）
// 2) todos 每次变化：保存到 localStorage，实现持久化
// 3) 用户交互：添加/清空/完成切换/删除/编辑，统一在此更新状态
// 注意事项：
// - 该页面为客户端组件，必须有 'use client' 以使用 useEffect/useState
// - 持久化采用浅数据结构，避免复杂对象导致 JSON 序列化问题

import { useEffect, useState } from 'react';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';
import { Todo as StorageTodo, clearTodos, getTodos, saveTodos } from './utils/localStorage';

type Todo = StorageTodo;

// 服务端 Todo 类型与转换（服务器使用 done，前端使用 completed）
type ServerTodo = { id: string; title: string; done: boolean; createdAt?: string };
const toClient = (t: ServerTodo): Todo => ({ id: t.id, title: t.title, completed: t.done });

// 统一封装 API 调用
async function fetchServerTodos(): Promise<Todo[]> {
  const res = await fetch('/tools/todo-list/api');
  if (!res.ok) throw new Error('获取服务器数据失败');
  const data: ServerTodo[] = await res.json();
  return data.map(toClient);
}

async function createServerTodo(title: string): Promise<Todo> {
  const res = await fetch('/tools/todo-list/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', data: { title } }),
  });
  if (!res.ok) throw new Error('创建任务失败');
  const data: ServerTodo = await res.json();
  return toClient(data);
}

async function updateServerTodoDone(id: string, done: boolean): Promise<Todo> {
  const res = await fetch('/tools/todo-list/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', data: { id, done } }),
  });
  if (!res.ok) throw new Error('更新完成状态失败');
  const data: ServerTodo = await res.json();
  return toClient(data);
}

async function updateServerTodoTitle(id: string, title: string): Promise<Todo> {
  const res = await fetch('/tools/todo-list/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', data: { id, title } }),
  });
  if (!res.ok) throw new Error('更新标题失败');
  const data: ServerTodo = await res.json();
  return toClient(data);
}

async function deleteServerTodo(id: string): Promise<void> {
  const res = await fetch('/tools/todo-list/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', data: { id } }),
  });
  if (!res.ok) throw new Error('删除任务失败');
}

// 新增：批量清空服务器端 Todos
async function clearServerTodos(): Promise<{ success: true; deleted: number }> {
  const res = await fetch('/tools/todo-list/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'clear', data: {} }),
  });
  if (!res.ok) throw new Error('清空任务失败');
  return res.json();
}

export default function TodoPage() {
  // 页面状态：所有任务数据由此管理，子组件通过回调请求更新
  const [todos, setTodos] = useState<Todo[]>([]);

  // 初始化：尝试从本地恢复；若无数据，填充教学示例并立即保存
  useEffect(() => {
    const restored = getTodos();
    if (restored.length > 0) {
      setTodos(restored);
    } else {
      const sample: Todo[] = [
        { id: '1', title: '学习 useState 存储列表', completed: false },
        { id: '2', title: '学习 useEffect 初始化数据', completed: false },
      ];
      setTodos(sample);
      saveTodos(sample);
    }
    // 从服务器同步覆盖最新数据
    fetchServerTodos()
      .then((server) => {
        setTodos(server);
        saveTodos(server);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  // 持久化：每当 todos 变化时写入 localStorage
  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  // 添加：生成唯一 id，将新任务插入列表头部
  // 添加：调用服务器创建后更新本地（服务器为真值）
  const handleAdd = async (title: string) => {
    try {
      const created = await createServerTodo(title);
      const next = [created, ...todos];
      setTodos(next);
    } catch (e) {
      alert('创建任务失败，请稍后重试');
    }
  };

  // 清空：删除服务器全部任务后清空本地
  const handleClear = async () => {
    try {
      await clearServerTodos();
      clearTodos();
      setTodos([]);
    } catch (e) {
      alert('清空失败，请稍后重试');
    }
  };

  // 完成切换：乐观更新，失败回滚
  const handleToggle = async (id: string) => {
    const prev = todos;
    const next = prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    setTodos(next);
    try {
      const updatedServer = await updateServerTodoDone(id, next.find((t) => t.id === id)!.completed);
      setTodos((curr) => curr.map((t) => (t.id === id ? updatedServer : t)));
    } catch (e) {
      alert('更新状态失败，已回滚');
      setTodos(prev);
    }
  };

  // 删除：乐观更新，失败回滚
  const handleDelete = async (id: string) => {
    const prev = todos;
    const next = prev.filter((t) => t.id !== id);
    setTodos(next);
    try {
      await deleteServerTodo(id);
    } catch (e) {
      alert('删除失败，已回滚');
      setTodos(prev);
    }
  };

  // 编辑：乐观更新，失败回滚
  const handleEdit = async (id: string, title: string) => {
    const prev = todos;
    const next = prev.map((t) => (t.id === id ? { ...t, title } : t));
    setTodos(next);
    try {
      const updatedServer = await updateServerTodoTitle(id, title);
      setTodos((curr) => curr.map((t) => (t.id === id ? updatedServer : t)));
    } catch (e) {
      alert('编辑失败，已回滚');
      setTodos(prev);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-center">Todo 列表（教学版）</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center mt-2">按 Enter 快速添加，数据自动本地保存</p>

        {/* 表单：负责输入与校验，成功后调用 onAdd，清空调用 onClearAll */}
        <TodoForm onAdd={handleAdd} onClearAll={handleClear} maxLength={100} existingTitles={todos.map((t) => t.title)} />
        {/* 列表：展示任务数、空态、子项并转发交互回调 */}
        <TodoList todos={todos} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEdit} />
      </div>
    </div>
  );
}