'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toolsData } from '@/data/tools';
import type { Tool } from '@/types';
import { filterToolsByCategory, getCategoriesWithCount } from '@/utils/filter';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import ToolCard from '@/components/ToolCard';

// 使用外部类型定义 Tool（见 '@/types'）

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [isLoading, setIsLoading] = useState(true);

  // 模拟加载状态
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // 稳定的分类选择回调
  const handleSelectCategory = useCallback((name: string) => {
    setSelectedCategory(name);
  }, []);

  /* 分类数据由 '@/data/categories' 在工具函数中使用 */

  /* 工具数据由 '@/data/tools' 提供 */

  // 计算每个分类的工具数量（使用共享工具函数 + useMemo）
  const categoriesWithCount = useMemo(() => getCategoriesWithCount(toolsData), [toolsData]);

  // 过滤工具（使用工具函数 + useMemo）
  const filteredTools = useMemo(() => filterToolsByCategory(toolsData, selectedCategory), [selectedCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex flex-col">
      {/* Header */}
      <Header
        title="AI工具导航"
        subtitle="发现优质AI工具"
        navItems={[
          { label: '热门工具', href: '#' },
          { label: '最新工具', href: '#' },
          { label: '分类浏览', href: '#' },
        ]}
        showSubmitButton
        onSubmit={() => {
          // TODO: 跳转提交工具页面或打开对话框
        }}
        sticky
      />
      {/* 主要内容区域 */}
      <main className="flex-1">
        {/* 左侧导航栏 */}
        <div className="hidden lg:block fixed left-0 top-0 w-48 h-full bg-gradient-to-br from-slate-50 via-white to-slate-50 border-r border-slate-200/60 shadow-sm z-30 transition-all duration-300">
          <div className="p-6">
            {/* 导航标题 */}
            <div className="mb-8">
              <h2 className="text-lg font-bold bg-gradient-to-r from-slate-800 via-indigo-700 to-blue-600 bg-clip-text text-transparent">
                工具分类
              </h2>
              <div className="w-12 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 rounded-full transition-all duration-500 hover:w-16"></div>
            </div>

            {/* 分割线 */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-6 opacity-60"></div>

            {/* 分类按钮 */}
            <div className="space-y-2">
              {categoriesWithCount.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleSelectCategory(category.name)}
                  className={`w-full text-left px-4 py-3 text-sm rounded-xl transition-all duration-300 font-medium hover:scale-105 active:scale-95 ${
                    selectedCategory === category.name
                      ? 'bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25'
                      : 'text-slate-700 hover:bg-slate-100 hover:shadow-md'
                  }`}
                  aria-pressed={selectedCategory === category.name}
                  aria-label={`选择${category.name}分类，共${category.count}个工具`}
                  role="button"
                >
                  <span className="transition-all duration-200">{category.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-lg font-medium transition-all duration-200 ${
                    selectedCategory === category.name
                      ? 'bg-white/20 text-white scale-105'
                      : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'
                  }`}>
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 移动端顶部导航 */}
        <div className="lg:hidden bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm p-4 sticky top-0 z-20 transition-all duration-300">
          <div className="mb-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 via-indigo-700 to-blue-600 bg-clip-text text-transparent">
              AI工具导航
            </h1>
            <div className="w-16 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 rounded-full mt-2 transition-all duration-500 hover:w-20"></div>
          </div>

          {/* 移动端分类选择 */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex space-x-3 pb-2 min-w-max">
              {categoriesWithCount.slice(0, 8).map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => handleSelectCategory(category.name)}
                  className={`flex-shrink-0 px-4 py-2.5 text-sm rounded-xl transition-all duration-300 font-medium whitespace-nowrap transform hover:scale-105 active:scale-95 ${
                    selectedCategory === category.name
                      ? 'bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-md'
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                  aria-pressed={selectedCategory === category.name}
                  aria-label={`选择${category.name}分类，共${category.count}个工具`}
                  role="button"
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧内容区 */}
        <div className="lg:ml-48 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* 页面标题 */}
            <div className="mb-8 sm:mb-10 lg:mb-12">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-6">
                <div className="flex-1">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent mb-4 leading-tight">
                    {selectedCategory === '全部' ? '全部工具' : selectedCategory}
                  </h2>
                  <div className="w-20 sm:w-24 h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 rounded-full mb-4"></div>
                  <p className="text-slate-600 text-base sm:text-lg lg:text-xl leading-relaxed max-w-2xl">
                    发现优质AI工具，提升工作效率
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-200/50 shadow-sm">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="font-semibold text-slate-700">共 {filteredTools.length} 个工具</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 工具网格 */}
            {isLoading ? (
              // 加载状态
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                {[...Array(8)].map((_, index) => (
                  <div 
                    key={index} 
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-sm animate-pulse"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animationDuration: '1.5s'
                    }}
                  >
                    {/* 头部骨架 */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl animate-pulse"></div>
                      <div className="w-16 h-6 bg-slate-200 rounded-lg animate-pulse"></div>
                    </div>
                    
                    {/* 标题和描述骨架 */}
                    <div className="mb-5">
                      <div className="h-6 bg-slate-200 rounded-lg mb-3 animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                        <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                      </div>
                    </div>
                    
                    {/* 标签骨架 */}
                    <div className="flex gap-2 mb-5">
                      <div className="w-16 h-6 bg-slate-200 rounded-lg animate-pulse"></div>
                      <div className="w-12 h-6 bg-slate-200 rounded-lg animate-pulse"></div>
                    </div>
                    
                    {/* 按钮骨架 */}
                    <div className="w-full h-12 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : filteredTools.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
                {filteredTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            ) : (
              // 空状态
              <div className="flex flex-col items-center justify-center py-20 sm:py-24">
                <div className="w-24 h-24 sm:w-32 sm:h-32 mb-8 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 rounded-3xl animate-pulse"></div>
                  <div className="absolute inset-4 bg-gradient-to-br from-indigo-100 via-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 text-center">
                  该分类下暂无工具
                </h3>
                <p className="text-slate-600 text-center text-sm sm:text-base max-w-md leading-relaxed mb-8">
                  该分类下暂无工具，敬请期待
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 底部 */}
      <Footer
        navItems={[]}
        socialLinks={[]}
        copyright={`© ${new Date().getFullYear()} AI工具导航. 保留所有权利.`}
      />
    </div>
  );
}
