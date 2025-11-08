'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getDisplayName, getInitialFromName, parseAuthMessageFromUrl, signOutWithCallback } from '@/utils/authService';

export default function AuthStatus() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [menuOpen, setMenuOpen] = useState(false);
  const [banner, setBanner] = useState<{ type: 'login' | 'logout'; text: string } | null>(null);

  const isAuthenticated = status === 'authenticated';
  const displayName = useMemo(() => getDisplayName(session), [session]);
  const initial = useMemo(() => getInitialFromName(displayName), [displayName]);

  // 展示一次性提示（登录成功、退出成功），随后清理 URL 查询参数
  useEffect(() => {
    const msg = parseAuthMessageFromUrl(searchParams.toString());
    if (msg.type) {
      setBanner({ type: msg.type, text: msg.text ?? '' });
      const timer = setTimeout(() => {
        setBanner(null);
        // 清理URL中的一次性提示参数
        router.replace(pathname);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router, pathname]);

  if (status === 'loading') {
    return (
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative flex items-center">
      {banner && (
        <div className={`absolute -top-9 right-0 px-2 py-1 rounded-lg text-xs shadow-sm ${banner.type === 'login' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
          {banner.text}
        </div>
      )}

      {isAuthenticated ? (
        <div className="relative">
          <button
            className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 hover:scale-105 active:scale-95"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 text-white font-bold shadow-sm">
              {initial}
            </span>
            <span className="text-sm font-medium max-w-[160px] truncate">
              {displayName ?? '用户'}
            </span>
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-50"
            >
              <button
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setMenuOpen(false);
                  signOutWithCallback('/?logout=ok');
                }}
              >
                退出登录
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 transition-all duration-200 hover:scale-105 active:scale-95"
          onClick={() => router.push(`/login?from=${encodeURIComponent(pathname)}`)}
        >
          登录
        </button>
      )}
    </div>
  );
}