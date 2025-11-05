'use client'; // 标记为客户端组件（Next.js 13+ 必需）

import { useState } from 'react';

// 1. 定义任务类型（TypeScript 基础）
type Todo = {
  id: string;
  title: string;
  done: boolean;
};

// 2. 主页面组件（Next.js 页面路由对应组件）
export default function TodoListPage() {
  // 3. 状态管理（React 核心）
  // 任务列表状态
  const [todos, setTodos] = useState<Todo[]>([]);
  // 输入框状态
  const [inputValue, setInputValue] = useState('');

  // 4. 添加任务函数
  const addTodo = () => {
    // 简单验证：输入不为空
    if (!inputValue.trim()) return;

    // 创建新任务
    const newTodo: Todo = {
      id: Date.now().toString(), // 用时间戳作为简单ID
      title: inputValue.trim(),
      done: false,
    };

    // 更新任务列表（不可变数据更新）
    setTodos([newTodo, ...todos]);
    // 清空输入框
    setInputValue('');
  };

  // 5. 处理表单提交（支持 Enter 键提交）
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // 阻止表单默认刷新行为
    addTodo();
  };

  return (
    <div className="max-w-md mx-auto p-4">
      {/* 页面标题（Next.js 页面结构） */}
      <h1 className="text-2xl font-bold mb-4">Next.js TodoList</h1>

      {/* 6. 表单组件（受控组件示例） */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          value={inputValue}
          // 实时更新输入框状态
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="添加任务..."
          className="flex-1 p-2 border rounded"
        />
        <button
          type="button" // 简化为普通按钮（也可保留submit）
          onClick={addTodo}
          className="p-2 bg-blue-500 text-white rounded"
        >
          添加
        </button>
      </form>

      {/* 7. 任务列表渲染（列表渲染基础） */}
      <ul className="space-y-2">
        {todos.length === 0 ? (
          <li className="text-gray-500">暂无任务</li>
        ) : (
          todos.map((todo) => (
            <li key={todo.id} className="p-2 border rounded">
              {todo.title}
            </li>
          ))
        )}
      </ul>

      {/* 学习提示 */}
      <p className="mt-6 text-sm text-gray-500">
        核心知识点：客户端组件、useState状态管理、列表渲染、表单处理
      </p>
    </div>
  );
}