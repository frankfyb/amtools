'use client';

import { memo, useState, type ReactNode, Suspense } from 'react';
import AuthStatus from './AuthStatus';

export interface HeaderNavItem {
  label: string;
  href: string;
}

export interface HeaderProps {
  logo?: ReactNode;
  title?: string;
  subtitle?: string;
  navItems?: HeaderNavItem[];
  showSubmitButton?: boolean;
  onSubmit?: () => void;
  sticky?: boolean;
}

const DefaultLogo = () => (
  <svg className="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const Header = memo(function Header({
  logo,
  title,
  subtitle,
  navItems = [],
  showSubmitButton = true,
  onSubmit,
  sticky = true,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const stickyClass = sticky ? 'sticky top-0 z-40' : '';

  return (
    <header className={`bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm ${stickyClass} transition-all duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* 品牌标识 */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105 cursor-pointer">
              {logo ?? <DefaultLogo />}
            </div>
            <div className="hidden sm:block">
              {title && (
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 via-indigo-700 to-blue-600 bg-clip-text text-transparent">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-xs lg:text-sm text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          {/* 桌面端导航 */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-slate-700 hover:text-indigo-600 font-medium transition-all duration-200 hover:scale-105 relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
          </nav>

          {/* 用户操作区 */}
          <div className="flex items-center space-x-3 lg:space-x-4">
            {showSubmitButton && (
              <button
                onClick={onSubmit}
                className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 text-white px-4 py-2 lg:px-5 lg:py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm lg:text-base">提交工具</span>
              </button>
            )}

            {/* 认证状态组件 */}
            <Suspense fallback={<div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />}> 
              <AuthStatus />
            </Suspense>

            {/* 移动端菜单按钮 */}
            {navItems.length > 0 && (
              <button
                className="lg:hidden p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                aria-expanded={mobileOpen}
                aria-controls="header-mobile-menu"
                onClick={() => setMobileOpen((o) => !o)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 移动端导航菜单 */}
      {mobileOpen && navItems.length > 0 && (
        <div
          id="header-mobile-menu"
          className="lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/60 shadow-sm"
          role="dialog"
          aria-label="移动端导航菜单"
        >
          <div className="px-4 sm:px-6 py-3">
            <div className="flex space-x-3 overflow-x-auto">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex-shrink-0 px-4 py-2.5 text-sm rounded-xl transition-all duration-300 font-medium whitespace-nowrap transform hover:scale-105 active:scale-95 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-md"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
});

export default Header;