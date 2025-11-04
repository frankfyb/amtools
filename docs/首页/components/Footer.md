# Footer 组件

一个独立、可复用的页面底部组件，封装 HTML 结构、样式与交互逻辑，支持响应式设计与自定义配置。

## 路径

`src/app/components/Footer.tsx`

## 导出

- 默认导出：`Footer`

## Props

- `logo?: ReactNode`
  - 用于显示品牌标识（图标/图片/文字）。
  - 示例：`<span className="text-white font-bold">A</span>`
- `navItems?: { label: string; href: string; }[]`
  - 底部导航菜单项，桌面端显示。
  - 示例：`[{ label: '关于我们', href: '/about' }]`
- `socialLinks?: { label: string; href: string; icon?: ReactNode; }[]`
  - 社交或外部链接，右侧显示；如果提供 `icon`，将渲染图标，否则渲染文字标签。
  - 示例：`[{ label: 'GitHub', href: 'https://github.com', icon: <GitHubIcon/> }]`
- `copyright?: string`
  - 版权文案，默认：`© {当前年份} AI工具导航. 保留所有权利.`
- `className?: string`
  - 自定义样式类，用于拓展或覆盖默认样式。

## 使用示例

```tsx
import Footer from '@/components/Footer';

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 内容 */}
      <main className="flex-1">...</main>

      <Footer
        logo={<span className="text-white font-bold">A</span>}
        navItems={[
          { label: '关于我们', href: '/about' },
          { label: '隐私政策', href: '/privacy' },
        ]}
        socialLinks={[
          { label: 'GitHub', href: 'https://github.com' },
          { label: 'Twitter', href: 'https://twitter.com' },
        ]}
        copyright={`© ${new Date().getFullYear()} MySite. All rights reserved.`}
      />
    </div>
  );
}
```

## 响应式与交互

- 布局：`flex` + `md:flex-row` 在中等及以上屏幕分成左右区域，移动端堆叠。
- 导航：`navItems` 在 `sm` 及以上显示，避免移动端拥挤。
- 社交链接：提供 `aria-label`，提升可访问性。
- 主题：默认浅色渐变背景，可通过 `className` 覆盖。

## 可访问性

- 所有交互元素（链接）提供明确的 `aria-label`。
- 对比度与 hover/focus 可见性良好，便于键盘导航。

## 注意事项

- 与页面整体使用一致的 Tailwind 设计语言（渐变、阴影、圆角）。
- 如需暗色主题，可传入 `className` 添加 `dark:` 前缀样式或自定义背景。
- 在 Next.js App Router 中作为通用组件放置于页面根布局或每个页面末尾均可。

## 变更记录

- v1.0：首版实现，支持 logo、导航、社交、版权与响应式布局。