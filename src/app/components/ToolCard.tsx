'use client';

import { memo, useCallback, type ReactNode } from 'react';
import type { Tool } from '@/types';

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

const ToolCard = memo(function ToolCard({
  tool,
  logo,
  showStats = true,
  ctaLabel = '立即访问',
  onOpen,
  className = '',
  renderBadges,
  ariaLabel,
}: ToolCardProps) {
  const handleOpen = useCallback(() => {
    if (onOpen) {
      onOpen(tool);
    } else {
      window.open(tool.url, '_blank');
    }
  }, [onOpen, tool]);

  return (
    <div
      className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 p-6 group hover:border-indigo-200 hover:-translate-y-1 cursor-pointer ${className}`}
      role="article"
      aria-label={ariaLabel ?? `${tool.name} - ${tool.description}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpen();
        }
      }}
    >
      {/* 卡片头部 */}
      <div className="flex items-center justify-between mb-5">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all duration-300">
          {logo ?? (
            <span className="text-white font-bold text-base sm:text-lg">
              {tool.name.charAt(0)}
            </span>
          )}
        </div>
        {showStats && tool.visits && (
          <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="font-semibold">{tool.visits}</span>
          </div>
        )}
      </div>

      {/* 工具名称和描述 */}
      <div className="mb-5">
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 group-hover:text-indigo-700 transition-colors duration-200 line-clamp-1 leading-tight">
          {tool.name}
        </h3>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed line-clamp-2 sm:line-clamp-3">
          {tool.description}
        </p>
      </div>

      {/* 标签区域 */}
      <div className="flex flex-wrap gap-2.5 mb-5">
        <span className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
          {tool.category}
        </span>
        {tool.hot && (
          <span className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-semibold rounded-lg shadow-sm">
            🔥 热门
          </span>
        )}
        {tool.new && (
          <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm">
            ✨ 新品
          </span>
        )}
        {renderBadges?.(tool)}
      </div>

      {/* 访问按钮 */}
      <button
        className="w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 text-white text-sm font-semibold py-3 sm:py-3.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 active:scale-95 group-hover:shadow-indigo-500/40"
        onClick={handleOpen}
        aria-label={`访问${tool.name}工具`}
      >
        {ctaLabel}
      </button>
    </div>
  );
});

export default ToolCard;