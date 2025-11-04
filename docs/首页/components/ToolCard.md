# ToolCard 组件文档

## 概述
ToolCard 是一个独立、可复用的卡片组件，用于展示单个工具的基本信息与访问入口。组件封装了完整的结构、样式和交互逻辑，并支持响应式设计与可访问性。

- 路径：`src/app/components/ToolCard.tsx`
- 导出：默认导出 `ToolCard`
- 依赖：`@/types` 中的 `Tool` 接口

## Props
```ts
import type { ReactNode } from 'react';
import type { Tool } from '@/types';

export interface ToolCardProps {
  tool: Tool;                // 必填，工具数据
  logo?: ReactNode;          // 可选，自定义头部标识内容
  showStats?: boolean;       // 可选，是否显示访问统计（默认 true）
  ctaLabel?: string;         // 可选，按钮文案（默认 “立即访问”）
  onOpen?: (tool: Tool) => void; // 可选，自定义打开行为
  className?: string;        // 可选，外层自定义样式
  renderBadges?: (tool: Tool) => ReactNode; // 可选，额外徽章渲染
  ariaLabel?: string;        // 可选，可访问性描述
}
```

## 使用示例
```tsx
import ToolCard from '@/components/ToolCard';
import type { Tool } from '@/types';

const tool: Tool = {
  id: '1',
  name: 'ChatGPT',
  description: '强大的AI对话助手',
  url: 'https://chat.openai.com',
  icon: '🤖',
  category: 'AI写作',
  visits: '1.2M',
  hot: true,
};

export default function Example() {
  return (
    <ToolCard
      tool={tool}
      ctaLabel="前往"
      logo={<span className="text-white font-bold">🤖</span>}
      renderBadges={(t) => (
        <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg">
          自定义徽章
        </span>
      )}
      onOpen={(t) => window.open(t.url, '_blank')}
      className="hover:scale-[1.01]"
    />
  );
}
```

## 在页面中使用
`src/app/page.tsx`：
```tsx
import ToolCard from '@/components/ToolCard';

{/* 工具网格 */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
  {filteredTools.map((tool) => (
    <ToolCard key={tool.id} tool={tool} />
  ))}
</div>
```

## 响应式与可访问性
- 响应式：网格在 `sm`/`lg`/`xl`/`2xl` 断点自动变更列数；卡片内部字号和间距随断点调整。
- 键盘可访问：卡片可聚焦（`tabIndex=0`）；支持 `Enter`/`Space` 访问。
- ARIA：可通过 `ariaLabel` 自定义描述；默认以工具名称和描述组合。

## 交互逻辑
- 点击或按键触发 `handleOpen`：
  - 若传入 `onOpen`，执行自定义逻辑。
  - 否则默认 `window.open(tool.url, '_blank')`。
- CTA按钮使用同一 `handleOpen`，确保行为一致。

## 风格定制
- 使用 `className` 覆盖或叠加外层容器样式。
- 使用 `logo` 自定义头部标识；`renderBadges` 注入额外徽章。

## 注意事项
- 确保传入的 `tool.url` 对于外部链接使用 `'_blank'` 并考虑 `noopener,noreferrer`（如需更严格安全策略，可在页面层处理）。
- 当 `tool.visits` 为空时，统计区域自动隐藏，可通过 `showStats=false` 强制隐藏。
- 若未来启用 `Next.js Image` 替换图标，可在 `logo` 中传入 `<Image />`。

## 扩展建议
- 支持 `i18n`：将 `ctaLabel` 文案接入国际化。
- 支持主题：根据深色模式调整渐变与阴影。
- 统计上报：在 `onOpen` 中接入埋点，例如 `track('tool_open', tool.id)`。