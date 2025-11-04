'use client';

import { memo, type ReactNode } from 'react';

export interface FooterNavItem {
  label: string;
  href: string;
}

export interface SocialLink {
  label: string;
  href: string;
  icon?: ReactNode;
}

export interface FooterProps {
  logo?: ReactNode;
  navItems?: FooterNavItem[];
  socialLinks?: SocialLink[];
  copyright?: string;
  className?: string;
}

const Footer = memo(function Footer({
  logo,
  navItems = [],
  socialLinks = [],
  copyright = `© ${new Date().getFullYear()} AI工具导航. 保留所有权利.`,
  className = '',
}: FooterProps) {
  return (
    <footer className={`bg-gradient-to-br from-slate-50 via-white to-slate-50 border-t border-slate-200/60 mt-16 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 分割线与内容包裹 */}
        <div className="border-t border-gray-200/50 pt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-6 md:space-y-0">
            {/* 左侧标识与导航 */}
            <div className="flex items-center space-x-4">
              {logo && (
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-sm">
                  {logo}
                </div>
              )}
              {navItems.length > 0 && (
                <nav className="hidden sm:flex items-center space-x-6">
                  {navItems.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="text-slate-700 hover:text-indigo-600 font-medium transition-all duration-200 hover:scale-105"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              )}
            </div>

            {/* 版权信息 */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
              <p className="text-gray-500 text-sm">{copyright}</p>
            </div>

            {/* 右侧社交链接 */}
            {socialLinks.length > 0 && (
              <div className="flex items-center space-x-4">
                {socialLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-slate-600 hover:text-indigo-600 transition-colors"
                    aria-label={item.label}
                  >
                    {item.icon ?? (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
});

export default Footer;