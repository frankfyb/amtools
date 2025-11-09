'use client';

import type { Tool } from '@/types';
import { memo, useCallback, useEffect, useState, type ReactNode } from 'react';

export interface ToolCardProps {
  tool: Tool;
  logo?: ReactNode; // 自定义卡片头部的标识内容
  showStats?: boolean; // 是否显示访问统计
  ctaLabel?: string; // CTA按钮文案
  onOpen?: (tool: Tool) => void; // 自定义打开行为
  className?: string; // 自定义外层样式
  renderBadges?: (tool: Tool) => ReactNode; // 额外自定义徽章渲染
  ariaLabel?: string; // 可访问性描述
}

// 解析与格式化访问量（支持 "K"/"M"）
function parseVisits(value?: string): number {
  if (!value) return 0;
  const s = value.trim().toUpperCase();
  if (/^\d+(\.\d+)?M$/.test(s)) return Math.round(parseFloat(s) * 1_000_000);
  if (/^\d+(\.\d+)?K$/.test(s)) return Math.round(parseFloat(s) * 1_000);
  const n = parseInt(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}
function formatVisits(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const ToolCard = memo(function ToolCard({
  tool,
  logo,
  showStats = true,
  ctaLabel = '访问',
  onOpen,
  className = '',
  renderBadges,
  ariaLabel,
}: ToolCardProps) {
  const [visits, setVisits] = useState<number | null>(null);

  // 标签：完整展示，容器可自动换行
  const tags = tool.tags ?? [];

  useEffect(() => {
    const key = `tool_visits_${tool.id}`;
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      if (stored && /^\d+$/.test(stored)) {
        setVisits(parseInt(stored, 10));
      } else {
        setVisits(parseVisits(tool.visits));
      }
    } catch {
      setVisits(parseVisits(tool.visits));
    }
  }, [tool.id, tool.visits]);

  const incVisits = useCallback(() => {
    const key = `tool_visits_${tool.id}`;
    setVisits((prev) => {
      const next = (prev ?? 0) + 1;
      try {
        if (typeof window !== 'undefined') window.localStorage.setItem(key, String(next));
      } catch {}
      return next;
    });
  }, [tool.id]);

  const handleOpen = useCallback(() => {
    incVisits();
    if (onOpen) {
      onOpen(tool);
    } else {
      window.open(tool.url, '_blank');
    }
  }, [onOpen, tool, incVisits]);

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-5 group hover:border-indigo-200 hover:-translate-y-0.5 cursor-pointer flex flex-col h-full ${className}`}
      role="article"
      aria-label={ariaLabel ?? `${tool.name} - ${tool.description}`}
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpen();
        }
      }}
    >
      {/* 头部：Logo + 标题 + 标签 */}
      <div className="flex items-start gap-3 sm:gap-3 mb-2.5">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300 flex-shrink-0 ring-4 ring-indigo-50">
          {logo ?? (
            <span className="text-white font-bold text-base sm:text-lg">
              {tool.icon || tool.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 group-hover:text-indigo-700 transition-colors duration-200 leading-tight truncate tracking-tight">
            {tool.name}
          </h3>
          {/* 分类与标签 */}
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap whitespace-normal">
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200/70 break-words max-w-full">{tool.category}</span>
            {tags.map((tag) => (
              <span key={tag} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-100 break-words max-w-full">{tag}</span>
            ))}
            {tool.hot && (
              <span className="px-2.5 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-semibold rounded-md shadow-sm">
                🔥 热门
              </span>
            )}
            {tool.new && (
              <span className="px-2.5 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold rounded-md shadow-sm">
                ✨ 新品
              </span>
            )}
            {renderBadges?.(tool)}
          </div>
        </div>
      </div>

      <p className="text-slate-600 text-sm sm:text-base leading-relaxed line-clamp-2 sm:line-clamp-2 tracking-normal">
        {tool.description}
      </p>

      <div className="border-t border-slate-200 mt-3 mb-2.5"></div>

      {/* 底部：访问量 + CTA */}
      <div className="mt-auto flex items-center justify-between gap-3">
        {showStats && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="font-medium tabular-nums">{formatVisits((visits ?? parseVisits(tool.visits)))}</span>
          </div>
        )}
        <button
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:outline-none text-white text-xs sm:text-sm font-semibold px-3 sm:px-3.5 py-2 rounded-lg shadow-sm transition-colors duration-200 active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            handleOpen();
          }}
          aria-label={`访问${tool.name}工具`}
        >
          {ctaLabel}
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7m0 0v7m0-7L10 14" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H3v7h7v-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
});

export default ToolCard;