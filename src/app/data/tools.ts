// 导入分类类型（确保分类名称与工具分类字段一致）
import { Tool } from '../types/index';
// 工具类型定义（扩展原接口，更清晰）
// export interface Tool {
//   id: string;
//   name: string;
//   description: string;
//   url: string;
//   icon: string;
//   category: Category['name']; // 关联分类名称，确保类型安全
//   visits: string;
//   hot?: boolean;
//   new?: boolean;
//   website?: string;
//   publishTime?: string;
//   avgVisitTime?: string;
//   bounceRate?: string;
//   monthlyVisits?: string;
//   tags?: string[];
//   highlights?: string[];
// }

// 工具数据（独立维护）
export const toolsData: Tool[] = [
  {
    id: '1',
    name: 'ChatGPT',
    description: '强大的AI对话助手，能够回答问题、协助写作、编程等多种任务。',
    url: 'https://chat.openai.com',
    icon: '🤖',
    category: 'AI写作', // 与categories中的name对应
    visits: '1.2M',
    hot: true,
    new: false
  },
  // ... 其他工具数据（保持不变）
  {
      id: '2',
      name: '密码生成器',
      description: '安全可靠的随机密码生成工具，支持自定义长度和字符类型。保护您的数字账户安全，提供密码强度评估。',
      url: '/tools/password-generator',
      icon: '🔐',
      category: '安全工具',
      visits: '125K',
      hot: false,
      new: true
    },
    {
      id: '3',
      name: '英文文字转语音',
      description: '将英文文本转换为自然语音，支持多种语音类型和语速调节，可下载音频文件。完全免费，保护隐私。',
      url: '/tools/english-text-voice',
      icon: '🔊',
      category: '实用小工具',
      visits: '0',
      hot: false,
      new: true,
      tags: ['TTS', '语音合成', '音频下载', '英文朗读']
    }
];