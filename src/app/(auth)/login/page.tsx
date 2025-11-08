"use client";

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn('credentials', {
      redirect: false,
      identifier,
      password,
    });
    setLoading(false);
    if (res?.ok) {
      window.location.href = '/';
    } else {
      alert(res?.error || '登录失败，请检查账号密码');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-6">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-center">登录</h1>
        <form onSubmit={handleCredentialsLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-neutral-600 mb-1">用户名或邮箱</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 outline-none bg-white dark:bg-neutral-800"
              placeholder="yourname 或 you@example.com"
              required
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
            {loading ? '登录中…' : '登录'}
          </button>
        </form>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            className="px-4 py-2 rounded-lg border border-neutral-300 bg-neutral-100 hover:bg-neutral-200"
            onClick={() => signIn('github')}
          >
            GitHub 登录
          </button>
          <button
            className="px-4 py-2 rounded-lg border border-neutral-300 bg-neutral-100 hover:bg-neutral-200"
            onClick={() => signIn('google')}
          >
            Google 登录
          </button>
        </div>

        <div className="mt-4 text-sm text-neutral-600 flex justify-between">
          <a href="/forgot-password" className="hover:underline">忘记密码</a>
          <a href="/register" className="hover:underline">注册账号</a>
        </div>
      </div>
    </div>
  );
}