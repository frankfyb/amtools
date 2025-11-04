import { categories } from '@/data/categories';
import { CategoryWithCount, Tool } from '@/types';

// 计算分类工具数量
export const getCategoriesWithCount = (tools: Tool[]): CategoryWithCount[] => {
  return categories.map(category => ({
    ...category,
    count: category.name === '全部' 
      ? tools.length 
      : tools.filter(tool => tool.category === category.name).length
  }));
};

// 筛选工具（根据选中的分类）
export const filterToolsByCategory = (
  tools: Tool[], 
  selectedCategory: string
): Tool[] => {
  return selectedCategory === '全部'
    ? tools
    : tools.filter(tool => tool.category === selectedCategory);
};