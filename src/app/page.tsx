'use client';

import { useState, useEffect } from 'react';

// 工具数据类型定义
interface Tool {
  id: string;
  name: string;
  description: string;
  url: string;
}

interface SubCategory {
  id: string;
  name: string;
  tools: Tool[];
}

interface Category {
  id: string;
  name: string;
  icon: string;
  subCategories: SubCategory[];
}

export default function Home() {
  // 内置工具数据 - 包含一级分类、二级分类和工具列表
  const toolsData: Category[] = [
    {
      id: 'dev',
      name: '开发工具',
      icon: '💻',
      subCategories: [
        {
          id: 'frontend',
          name: '前端工具',
          tools: [
            { id: '1', name: 'VS Code', description: '强大的代码编辑器，支持多种编程语言', url: 'https://code.visualstudio.com' },
            { id: '2', name: 'Chrome DevTools', description: '浏览器开发者工具，调试前端应用', url: 'https://developer.chrome.com/docs/devtools' },
            { id: '3', name: 'Figma', description: '在线设计协作工具，UI/UX设计必备', url: 'https://figma.com' },
          ]
        },
        {
          id: 'backend',
          name: '后端工具',
          tools: [
            { id: '4', name: 'Postman', description: 'API开发测试工具，支持多种请求方式', url: 'https://postman.com' },
            { id: '5', name: 'Docker', description: '容器化平台，简化应用部署', url: 'https://docker.com' },
            { id: '6', name: 'MongoDB Compass', description: 'MongoDB可视化管理工具', url: 'https://mongodb.com/products/compass' },
          ]
        },
        {
          id: 'devops',
          name: 'DevOps工具',
          tools: [
            { id: '7', name: 'GitHub', description: '代码托管和协作平台', url: 'https://github.com' },
            { id: '8', name: 'Jenkins', description: '持续集成和持续部署工具', url: 'https://jenkins.io' },
          ]
        }
      ]
    },
    {
      id: 'design',
      name: '设计工具',
      icon: '🎨',
      subCategories: [
        {
          id: 'ui-design',
          name: 'UI设计',
          tools: [
            { id: '9', name: 'Sketch', description: '专业的UI设计工具，Mac平台首选', url: 'https://sketch.com' },
            { id: '10', name: 'Adobe XD', description: 'Adobe出品的UI/UX设计工具', url: 'https://adobe.com/products/xd' },
            { id: '11', name: 'Framer', description: '交互式设计和原型制作工具', url: 'https://framer.com' },
          ]
        },
        {
          id: 'graphics',
          name: '图形设计',
          tools: [
            { id: '12', name: 'Photoshop', description: '专业图像处理软件', url: 'https://adobe.com/products/photoshop' },
            { id: '13', name: 'Illustrator', description: '矢量图形设计工具', url: 'https://adobe.com/products/illustrator' },
          ]
        }
      ]
    },
    {
      id: 'productivity',
      name: '生产力工具',
      icon: '⚡',
      subCategories: [
        {
          id: 'note-taking',
          name: '笔记工具',
          tools: [
            { id: '14', name: 'Notion', description: '全能工作空间，笔记、任务、数据库一体', url: 'https://notion.so' },
            { id: '15', name: 'Obsidian', description: '基于链接的知识管理工具', url: 'https://obsidian.md' },
            { id: '16', name: 'Typora', description: '简洁的Markdown编辑器', url: 'https://typora.io' },
          ]
        },
        {
          id: 'project-mgmt',
          name: '项目管理',
          tools: [
            { id: '17', name: 'Trello', description: '看板式项目管理工具', url: 'https://trello.com' },
            { id: '18', name: 'Asana', description: '团队协作和项目跟踪工具', url: 'https://asana.com' },
          ]
        },
        {
          id: 'security',
          name: '安全工具',
          tools: [
            { id: '23', name: '密码生成器', description: '生成安全的随机密码，支持自定义长度和字符类型', url: '/tools/password-generator' },
          ]
        }
      ]
    },
    {
      id: 'ai',
      name: 'AI工具',
      icon: '🤖',
      subCategories: [
        {
          id: 'chat-ai',
          name: '对话AI',
          tools: [
            { id: '19', name: 'ChatGPT', description: 'OpenAI开发的对话式AI助手', url: 'https://chat.openai.com' },
            { id: '20', name: 'Claude', description: 'Anthropic开发的AI助手', url: 'https://claude.ai' },
          ]
        },
        {
          id: 'image-ai',
          name: '图像AI',
          tools: [
            { id: '21', name: 'Midjourney', description: 'AI图像生成工具', url: 'https://midjourney.com' },
            { id: '22', name: 'DALL-E', description: 'OpenAI的图像生成AI', url: 'https://openai.com/dall-e-2' },
          ]
        }
      ]
    }
  ];

  // 状态管理 - 当前选中的一级分类和二级分类
  const [selectedCategory, setSelectedCategory] = useState<string>('dev'); // 默认选中第一个一级分类
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('frontend'); // 默认选中第一个二级分类

  // 获取当前选中的分类数据
  const currentCategory = toolsData.find(cat => cat.id === selectedCategory);
  const currentSubCategories = currentCategory?.subCategories || [];
  
  // 获取当前选中的二级分类下的工具列表
  const currentTools = currentSubCategories.find(sub => sub.id === selectedSubCategory)?.tools || [];

  // 当一级分类切换时，自动选中该分类下的第一个二级分类
  useEffect(() => {
    if (currentCategory && currentCategory.subCategories.length > 0) {
      // 检查当前选中的二级分类是否属于新的一级分类
      const isValidSubCategory = currentCategory.subCategories.some(sub => sub.id === selectedSubCategory);
      if (!isValidSubCategory) {
        setSelectedSubCategory(currentCategory.subCategories[0].id);
      }
    }
  }, [selectedCategory, currentCategory, selectedSubCategory]);

  // 处理一级分类点击事件
  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // 处理二级分类点击事件
  const handleSubCategoryClick = (subCategoryId: string) => {
    setSelectedSubCategory(subCategoryId);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 左侧固定侧边栏 - 一级分类 */}
      <div className="w-64 bg-white shadow-lg fixed left-0 top-0 h-full overflow-y-auto">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-8">工具导航</h1>
          
          {/* 一级分类列表 */}
          <nav className="space-y-2">
            {toolsData.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500' // 选中状态样式
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{category.icon}</span>
                <span className="font-medium">{category.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 右侧内容区 */}
      <div className="flex-1 ml-64 p-8">
        {/* 二级分类横向导航 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {currentCategory?.name}
          </h2>
          
          {/* 二级分类标签 */}
          <div className="flex gap-2 flex-wrap">
            {currentSubCategories.map((subCategory) => (
              <button
                key={subCategory.id}
                onClick={() => handleSubCategoryClick(subCategory.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedSubCategory === subCategory.id
                    ? 'bg-blue-500 text-white' // 选中状态样式
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {subCategory.name}
              </button>
            ))}
          </div>
        </div>

        {/* 工具列表 - 卡片布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentTools.map((tool) => (
            <div
              key={tool.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              {/* 工具名称 */}
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {tool.name}
              </h3>
              
              {/* 工具描述 */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {tool.description}
              </p>
              
              {/* 访问按钮 */}
              {tool.url.startsWith('/') ? (
                // 内部路由使用 Link 组件
                <a
                  href={tool.url}
                  className="inline-block bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  使用工具
                </a>
              ) : (
                // 外部链接使用 a 标签
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  访问工具
                </a>
              )}
            </div>
          ))}
        </div>

        {/* 空状态提示 */}
        {currentTools.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">该分类下暂无工具</p>
          </div>
        )}
      </div>
    </div>
  );
}
