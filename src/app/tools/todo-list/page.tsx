'use client';

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
  }, []);

  // 持久化：每当 todos 变化时写入 localStorage
  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  // 添加：生成唯一 id，将新任务插入列表头部
  const handleAdd = (title: string) => {
    const newTodo: Todo = { id: Date.now().toString(), title, completed: false };
    const next = [newTodo, ...todos];
    setTodos(next);
  };

  // 清空：移除本地存储键并清空状态
  const handleClear = () => {
    clearTodos();
    setTodos([]);
  };

  // 完成切换：根据 id 翻转 completed 状态
  const handleToggle = (id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  // 删除：过滤移除指定 id 的任务
  const handleDelete = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  // 编辑：更新指定 id 的标题文本
  const handleEdit = (id: string, title: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, title } : t)));
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