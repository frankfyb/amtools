


// 工具类型（替代页面内的接口定义）
export interface Tool {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  category: Category['name']; // 强关联分类名称，避免拼写错误
  visits: string;
  hot?: boolean;
  new?: boolean;
  website?: string;
  publishTime?: string;
  avgVisitTime?: string;
  bounceRate?: string;
  monthlyVisits?: string;
  tags?: string[];
  highlights?: string[];
}

export interface Category {
  id: string;
  name: string;
}

// 带数量的分类类型（用于展示分类统计）
export interface CategoryWithCount extends Category {
  count: number;
}