'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { signIn } from 'next-auth/react';

function mapOAuthError(code: string | null): string | null {
  if (!code) return null;
  switch (code) {
    case 'OAuthSignin':
    case 'OAuthCallback':
    case 'OAuthCreateAccount':
    case 'Callback':
      return '第三方登录出错，请重试或更换方式';
    case 'CredentialsSignin':
      return '账号或密码错误';
    case 'SessionRequired':
      return '请先登录以访问该页面';
    default:
      return '登录失败，请稍后重试';
  }
}

function LoginInner() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const from = searchParams.get('callbackUrl') || searchParams.get('from') || '/';

  useEffect(() => {
    // 来自中间件或OAuth失败的错误提示
    const oauthError = mapOAuthError(searchParams.get('error'));
    if (oauthError) {
      setError(oauthError);
    } else {
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    setError(null);
  }, [identifier, password]);

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn('credentials', {
      redirect: false,
      identifier,
      password,
    });
    setLoading(false);
    if (res?.ok) {
      router.replace(`${from}?login=ok`);
    } else {
      setError(res?.error || '登录失败，请检查账号密码');
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
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
              {error}
            </div>
          )}
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
            onClick={() => signIn('github', { callbackUrl: `${from}?login=ok` })}
          >
            GitHub 登录
          </button>
          <button
            className="px-4 py-2 rounded-lg border border-neutral-300 bg-neutral-100 hover:bg-neutral-200"
            onClick={() => signIn('google', { callbackUrl: `${from}?login=ok` })}
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" /></div>}>
      <LoginInner />
    </Suspense>
  )
}