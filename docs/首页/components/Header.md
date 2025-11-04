# Header 组件使用说明

该组件封装了页面头部的结构、样式与交互逻辑，支持响应式设计与可配置导航，适用于首页与其他页面复用。

## 导入

```tsx
import Header from '@/components/Header';
```

## Props

- `logo?: ReactNode` 自定义 Logo 节点（默认内置渐变方块+图标）。
- `title?: string` 标题文案（如“AI工具导航”）。
- `subtitle?: string` 副标题文案（如“发现优质AI工具”）。
- `navItems?: { label: string; href: string; }[]` 桌面端与移动端导航项列表。
- `showSubmitButton?: boolean` 是否显示右上角“提交工具”按钮，默认 `true`。
- `onSubmit?: () => void` 点击“提交工具”按钮的回调。
- `sticky?: boolean` 是否吸顶，默认 `true`。

## 示例

```tsx
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
    // TODO: 跳转到提交工具页或打开对话框
  }}
  sticky
/>
```

## 响应式行为

- 桌面端展示顶部导航（`lg:flex`）。
- 移动端显示汉堡菜单按钮，点击后展开横向滚动的导航项列表。

## 可访问性

- 移动端菜单使用 `aria-expanded` 和 `aria-controls` 标识状态与关联。
- 导航项与按钮具备合理的可访问性标签与交互反馈。

## 注意事项

- 建议通过路径别名 `@/components/Header` 引入，保持与项目结构一致。
- 若需要更复杂的 Logo（例如图片），传入自定义 `logo` 节点即可。
- 若页面需要不同的吸顶行为，可通过 `sticky` 控制。