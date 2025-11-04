'use client';

import { useCallback, useMemo, useState } from 'react';

type Todo = {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
};

export default function TodoListPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');

  const canAdd = useMemo(() => input.trim().length > 0, [input]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!canAdd) return;
      const newTodo: Todo = {
        id: crypto.randomUUID(),
        title: input.trim(),
        done: false,
        createdAt: Date.now(),
      };
      setTodos((prev) => [newTodo, ...prev]);
      setInput('');
    },
    [input, canAdd]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <section className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <header className="mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-indigo-700 to-blue-600 bg-clip-text text-transparent">
              极简 TodoList
            </h1>
            <p className="text-slate-600 mt-2">添加任务并在列表中显示，适合新手逐步扩展。</p>
          </header>

          <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入任务内容，例如：学习 React 基础"
              aria-label="任务内容"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            />
            <button
              type="submit"
              disabled={!canAdd}
              className="px-5 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
            >
              添加
            </button>
          </form>

          <ul className="space-y-3">
            {todos.length === 0 ? (
              <li className="text-slate-500 text-sm">暂无任务，添加你的第一条吧。</li>
            ) : (
              todos.map((todo) => (
                <li
                  key={todo.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <span className="text-slate-800">{todo.title}</span>
                </li>
              ))
            )}
          </ul>
        </section>

        <footer className="mt-6 text-xs text-slate-500">
          <p>
            下一步可扩展：完成状态、删除任务、持久化、本地存储或接入 API。
          </p>
        </footer>
      </main>
    </div>
  );
}