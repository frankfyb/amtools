'use client';

import { useEffect, useState } from 'react';

// 工具接口定义
interface Tool {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string; // 工具图标
  category: string; // 所属分类
  visits: string; // 访问量显示
  hot?: boolean;
  new?: boolean;
  // 可选的额外信息
  website?: string; // 官方网站
  publishTime?: string; // 发布时间
  avgVisitTime?: string; // 平均访问时长
  bounceRate?: string; // 跳出率
  monthlyVisits?: string; // 月访问量
  tags?: string[]; // 标签
  highlights?: string[]; // 产品亮点
}

// 分类接口定义
interface Category {
  id: string;
  name: string;
  count: number;
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // 模拟加载状态
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // 模拟搜索延迟
  useEffect(() => {
    if (searchTerm) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [searchTerm]);

  // 分类数据
  const categories = [
    { id: '1', name: '全部' },
    { id: '2', name: 'AI写作' },
    { id: '3', name: 'AI绘画' },
    { id: '4', name: 'AI音频' },
    { id: '5', name: 'AI视频' },
    { id: '6', name: 'AI编程' },
    { id: '7', name: 'AI翻译' },
    { id: '8', name: 'AI设计' },
    { id: '9', name: 'AI营销' },
    { id: '10', name: 'AI办公' },
    { id: '11', name: '安全工具' },
  ];

  // 工具数据
  const toolsData: Tool[] = [
    {
      id: '1',
      name: 'ChatGPT',
      description: '强大的AI对话助手，能够回答问题、协助写作、编程等多种任务。基于GPT-4模型，提供智能、准确的回复。',
      url: 'https://chat.openai.com',
      icon: '🤖',
      category: 'AI写作',
      visits: '1.2M',
      hot: true,
      new: false
    },
    {
      id: '2',
      name: 'Midjourney',
      description: 'AI图像生成工具，通过文字描述创造出令人惊艳的艺术作品和插图。支持多种艺术风格和创意表达。',
      url: 'https://midjourney.com',
      icon: '🎨',
      category: 'AI绘画',
      visits: '890K',
      hot: true,
      new: false
    },
    {
      id: '3',
      name: 'Stable Diffusion',
      description: '开源的AI图像生成模型，可以根据文本提示生成高质量图像。支持本地部署和自定义训练。',
      url: 'https://stability.ai',
      icon: '🖼️',
      category: 'AI绘画',
      visits: '650K',
      hot: false,
      new: true
    },
    {
      id: '4',
      name: 'GitHub Copilot',
      description: 'AI编程助手，为开发者提供智能代码补全和建议。支持多种编程语言，大幅提升编程效率。',
      url: 'https://github.com/features/copilot',
      icon: '💻',
      category: 'AI编程',
      visits: '750K',
      hot: true,
      new: false
    },
    {
      id: '5',
      name: 'ElevenLabs',
      description: 'AI语音合成平台，能够生成逼真的人声。支持多种语言和声音风格，适用于配音、播客等场景。',
      url: 'https://elevenlabs.io',
      icon: '🎵',
      category: 'AI音频',
      visits: '420K',
      hot: false,
      new: true
    },
    {
      id: '6',
      name: 'Runway ML',
      description: 'AI视频编辑和生成工具，提供视频特效、背景移除、风格转换等功能。让视频创作变得简单高效。',
      url: 'https://runwayml.com',
      icon: '🎬',
      category: 'AI视频',
      visits: '380K',
      hot: false,
      new: false
    },
    {
      id: '7',
      name: 'DeepL',
      description: '高质量AI翻译工具，支持多种语言互译。翻译准确度高，保持原文语境和语调。',
      url: 'https://deepl.com',
      icon: '🌐',
      category: 'AI翻译',
      visits: '920K',
      hot: true,
      new: false
    },
    {
      id: '8',
      name: 'Figma AI',
      description: 'AI设计助手，集成在Figma中，提供智能布局建议、颜色搭配、组件生成等功能。',
      url: 'https://figma.com',
      icon: '🎯',
      category: 'AI设计',
      visits: '560K',
      hot: false,
      new: true
    },
    {
      id: '9',
      name: '密码生成器',
      description: '安全可靠的随机密码生成工具，支持自定义长度和字符类型。保护您的数字账户安全，提供密码强度评估。',
      url: '/tools/password-generator',
      icon: '🔐',
      category: '安全工具',
      visits: '125K',
      hot: false,
      new: true
    }
  ];

  // 计算每个分类的工具数量
  const categoriesWithCount = categories.map(category => ({
    ...category,
    count: category.name === '全部' 
      ? toolsData.length 
      : toolsData.filter(tool => tool.category === category.name).length
  }));

  // 过滤工具
  const filteredTools = toolsData.filter(tool => {
    const matchesCategory = selectedCategory === '全部' || tool.category === selectedCategory;
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex flex-col">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* 品牌标识 */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105 cursor-pointer">
                <svg className="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 via-indigo-700 to-blue-600 bg-clip-text text-transparent">
                  AI工具导航
                </h1>
                <p className="text-xs lg:text-sm text-slate-500 mt-0.5">发现优质AI工具</p>
              </div>
            </div>

            {/* 桌面端导航 */}
            <nav className="hidden lg:flex items-center space-x-8">
              <a href="#" className="text-slate-700 hover:text-indigo-600 font-medium transition-all duration-200 hover:scale-105 relative group">
                热门工具
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#" className="text-slate-700 hover:text-indigo-600 font-medium transition-all duration-200 hover:scale-105 relative group">
                最新工具
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#" className="text-slate-700 hover:text-indigo-600 font-medium transition-all duration-200 hover:scale-105 relative group">
                分类浏览
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
            </nav>

            {/* 用户操作区 */}
            <div className="flex items-center space-x-3 lg:space-x-4">
              {/* 搜索按钮 */}
              <button className="p-2 lg:p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95">
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* 收藏按钮 */}
              <button className="p-2 lg:p-2.5 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95">
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              {/* 提交工具按钮 */}
              <button className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 text-white px-4 py-2 lg:px-5 lg:py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 hover:scale-105 active:scale-95">
                <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm lg:text-base">提交工具</span>
              </button>

              {/* 移动端菜单按钮 */}
              <button className="lg:hidden p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

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

            {/* 搜索框 */}
            <div className="mb-8">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="搜索工具..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-300 shadow-sm hover:shadow-md group-hover:border-indigo-300"
                  aria-label="搜索AI工具"
                  aria-describedby="search-description"
                  role="searchbox"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-indigo-200 rounded-full animate-spin border-t-indigo-500"></div>
                  </div>
                )}
              </div>
            </div>

            {/* 分类按钮 */}
            <div className="space-y-2">
              {categoriesWithCount.map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.name)}
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
          
          {/* 移动端搜索框 */}
          <div className="mb-4">
            <div className="relative group">
              <input
                type="text"
                placeholder="搜索工具..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-base bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all duration-300 shadow-sm hover:shadow-md group-hover:border-indigo-300"
                aria-label="搜索AI工具"
                aria-describedby="search-description"
                role="searchbox"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-indigo-200 rounded-full animate-spin border-t-indigo-500"></div>
                </div>
              )}
            </div>
          </div>

          {/* 移动端分类选择 */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex space-x-3 pb-2 min-w-max">
              {categoriesWithCount.slice(0, 8).map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.name)}
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
                    {searchTerm ? `为您找到 ${filteredTools.length} 个相关工具` : `发现优质AI工具，提升工作效率`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-200/50 shadow-sm">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="font-semibold text-slate-700">共 {filteredTools.length} 个工具</span>
                  </div>
                  {searchTerm && (
                    <div className="flex items-center space-x-3 bg-indigo-50/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-indigo-200/50 shadow-sm">
                      <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="font-semibold text-indigo-700">搜索: &ldquo;{searchTerm}&rdquo;</span>
                    </div>
                  )}
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
            ) : isSearching ? (
              // 搜索状态
              <div className="flex items-center justify-center py-16 sm:py-20">
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 relative">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-500"></div>
                  </div>
                  <p className="text-gray-600 font-medium text-sm sm:text-base">正在搜索工具...</p>
                </div>
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
                  {searchTerm ? `未找到包含 "${searchTerm}" 的工具` : '该分类下暂无工具'}
                </h3>
                <p className="text-slate-600 text-center text-sm sm:text-base max-w-md leading-relaxed mb-8">
                  {searchTerm ? '尝试使用其他关键词搜索，或浏览其他分类' : '该分类下暂无工具，敬请期待'}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 hover:from-indigo-600 hover:via-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transform hover:scale-105 active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>清除搜索条件</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 底部 */}
      <footer className="bg-gradient-to-br from-slate-50 via-white to-slate-50 border-t border-slate-200/60 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* 品牌信息 */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 via-indigo-700 to-blue-600 bg-clip-text text-transparent">
                  AI工具导航
                </h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-md">
                发现最优质的AI工具，提升工作效率。我们精心收集和整理各类AI应用，为您的数字化工作流程提供强大支持。
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-slate-100 hover:bg-indigo-100 rounded-xl flex items-center justify-center transition-all duration-200 hover:shadow-md group">
                  <svg className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-slate-100 hover:bg-indigo-100 rounded-xl flex items-center justify-center transition-all duration-200 hover:shadow-md group">
                  <svg className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-slate-100 hover:bg-indigo-100 rounded-xl flex items-center justify-center transition-all duration-200 hover:shadow-md group">
                  <svg className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* 快速链接 */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">快速链接</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    工具分类
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    热门推荐
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    最新工具
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    提交工具
                  </a>
                </li>
              </ul>
            </div>

            {/* 帮助支持 */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">帮助支持</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    使用指南
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    常见问题
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    意见反馈
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm">
                    联系我们
                  </a>
                </li>
              </ul>
            </div>

            {/* 联系信息 */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">联系我们</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-600 text-sm">contact@aitool.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-600 text-sm">中国 · 北京</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-gray-600 text-sm">400-123-4567</span>
                </div>
              </div>
            </div>
          </div>

          {/* 分割线 */}
          <div className="border-t border-gray-200/50 pt-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              {/* 版权信息 */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                <p className="text-gray-500 text-sm">
                  © 2024 AI工具导航. 保留所有权利.
                </p>
                <div className="flex items-center space-x-4">
                  <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors duration-200 text-sm">
                    隐私政策
                  </a>
                  <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors duration-200 text-sm">
                    服务条款
                  </a>
                  <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors duration-200 text-sm">
                    Cookie政策
                  </a>
                </div>
              </div>

              {/* 备案信息 */}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>京ICP备12345678号</span>
                <span>京公网安备11010802012345号</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ToolCard 组件
function ToolCard({ tool }: { tool: Tool }) {
  return (
    <div 
      className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 p-6 group hover:border-indigo-200 hover:-translate-y-1 cursor-pointer"
      role="article"
      aria-label={`${tool.name} - ${tool.description}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.open(tool.url, '_blank');
        }
      }}
    >
      {/* 卡片头部 */}
      <div className="flex items-center justify-between mb-5">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all duration-300">
          <span className="text-white font-bold text-base sm:text-lg">
            {tool.name.charAt(0)}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="font-semibold">{tool.visits}</span>
        </div>
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
      </div>

      {/* 访问按钮 */}
      <button 
        className="w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 text-white text-sm font-semibold py-3 sm:py-3.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 active:scale-95 group-hover:shadow-indigo-500/40"
        onClick={() => window.open(tool.url, '_blank')}
        aria-label={`访问${tool.name}工具`}
      >
        立即访问
      </button>
    </div>
  );
}
