'use client';

import { signIn, signOut, getSession } from 'next-auth/react';
import type { Session } from 'next-auth';

export type AuthSignInResult = {
  ok: boolean;
  error?: string;
};

export async function getSessionOnce(): Promise<Session | null> {
  try {
    return await getSession();
  } catch {
    return null;
  }
}

export async function signInWithCredentials(identifier: string, password: string): Promise<AuthSignInResult> {
  const res = await signIn('credentials', {
    redirect: false,
    identifier,
    password,
  });
  const ok = !!res?.ok;
  const error = res?.error ?? undefined; // 规范为 string | undefined
  return { ok, error };
}

export function signInWithOAuth(provider: 'github' | 'google', callbackUrl: string = '/?login=ok') {
  return signIn(provider, { callbackUrl });
}

export function signOutWithCallback(callbackUrl: string = '/?logout=ok') {
  return signOut({ callbackUrl });
}

export function getDisplayName(session: Session | null): string | null {
  const name = session?.user?.name ?? null;
  const email = session?.user?.email ?? null;
  // 优先展示用户名，其次邮箱
  return name || email || null;
}

export function getInitialFromName(name: string | null): string {
  if (!name) return 'U';
  const t = name.trim();
  if (!t) return 'U';
  return t[0].toUpperCase();
}

export function parseAuthMessageFromUrl(search: string): { type: 'login' | 'logout' | null; text?: string } {
  try {
    const params = new URLSearchParams(search);
    if (params.get('login') === 'ok') {
      return { type: 'login', text: '登录成功' };
    }
    if (params.get('logout') === 'ok') {
      return { type: 'logout', text: '已退出登录' };
    }
    return { type: null };
  } catch {
    return { type: null };
  }
}