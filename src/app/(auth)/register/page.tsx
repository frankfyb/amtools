"use client";

import { useState } from 'react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password }),
    });
    setLoading(false);
    if (res.ok) {
      alert('注册成功，请登录');
      window.location.href = '/login';
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || '注册失败');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-6">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-center">注册</h1>
        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-neutral-600 mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 outline-none bg-white dark:bg-neutral-800"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 mb-1">用户名（可选）</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 outline-none bg-white dark:bg-neutral-800"
              placeholder="yourname"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 outline-none bg-white dark:bg-neutral-800"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-lg border border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800"
          >
            {loading ? '注册中…' : '注册'}
          </button>
        </form>
        <div className="mt-4 text-sm text-neutral-600 text-center">
          已有账号？ <a href="/login" className="hover:underline">去登录</a>
        </div>
      </div>
    </div>
  );
}