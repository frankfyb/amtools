# Header 组件设计文档

## 📋 组件概述

Header 组件是网站的顶部导航栏，负责展示品牌标识、主导航菜单和用户操作区域。作为全站通用组件，它需要具备良好的响应式设计和灵活的配置能力。

## 🎯 设计目标

- **品牌展示**：清晰展示网站品牌标识和名称
- **导航功能**：提供主要页面的快速导航
- **用户操作**：集成用户相关的操作按钮
- **响应式适配**：在不同设备上提供最佳体验
- **可定制性**：支持多种样式和配置选项

## 🔍 功能分析

### 📊 当前实现分析

从 `page.tsx` 中提取的 Header 部分包含以下功能：

```typescript
// 当前 Header 结构
<header className="bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm sticky top-0 z-40 transition-all duration-300">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16 lg:h-20">
      {/* 品牌标识区域 */}
      <div className="flex items-center space-x-4">
        <div className="logo-container">
          <svg>...</svg>
        </div>
        <div className="brand-text">
          <h1>AI工具导航</h1>
          <p>发现优质AI工具</p>
        </div>
      </div>

      {/* 桌面端导航菜单 */}
      <nav className="hidden lg:flex items-center space-x-8">
        <a href="#">热门工具</a>
        <a href="#">最新工具</a>
        <a href="#">分类浏览</a>
      </nav>

      {/* 用户操作区 */}
      <div className="flex items-center space-x-3 lg:space-x-4">
        <button>提交工具</button>
        <button>移动端菜单</button>
      </div>
    </div>
  </div>
</header>
```

### 🧩 可提取的子组件

1. **Logo 组件**：品牌标识和图标
2. **BrandText 组件**：品牌名称和标语
3. **Navigation 组件**：导航菜单
4. **ActionButtons 组件**：操作按钮组
5. **MobileMenuButton 组件**：移动端菜单按钮

## 📝 接口设计

### 🎛️ 主组件接口

```typescript
interface HeaderProps {
  // 基础配置
  title?: string;
  subtitle?: string;
  logo?: React.ReactNode;
  
  // 导航配置
  navigation?: NavigationItem[];
  showNavigation?: boolean;
  
  // 用户操作
  actions?: ActionButton[];
  onSubmitTool?: () => void;
  onMenuToggle?: () => void;
  
  // 样式配置
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
  sticky?: boolean;
  transparent?: boolean;
  
  // 响应式配置
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
  showMobileMenu?: boolean;
}

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  active?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
}

interface ActionButton {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  hidden?: boolean | 'mobile' | 'desktop';
}
```

### 🧩 子组件接口

#### Logo 组件

```typescript
interface LogoProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode; // 自定义 logo 内容
}
```

#### BrandText 组件

```typescript
interface BrandTextProps {
  title: string;
  subtitle?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  showSubtitle?: boolean;
  onClick?: () => void;
}
```

#### Navigation 组件

```typescript
interface NavigationProps {
  items: NavigationItem[];
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
  itemClassName?: string;
  activeClassName?: string;
}
```

## 🎨 样式设计

### 🎭 变体样式

#### 1. Default 变体（默认）

```css
.header-default {
  @apply bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm;
  @apply sticky top-0 z-40 transition-all duration-300;
}

.header-default .container {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

.header-default .content {
  @apply flex items-center justify-between h-16 lg:h-20;
}
```

#### 2. Compact 变体（紧凑）

```css
.header-compact {
  @apply bg-white border-b border-gray-200 shadow-sm;
  @apply sticky top-0 z-40;
}

.header-compact .content {
  @apply flex items-center justify-between h-12 lg:h-14;
}
```

#### 3. Minimal 变体（极简）

```css
.header-minimal {
  @apply bg-transparent border-b-0;
  @apply relative;
}

.header-minimal .content {
  @apply flex items-center justify-between h-16;
}
```

### 🎨 主题配置

```typescript
interface HeaderTheme {
  colors: {
    background: string;
    border: string;
    text: {
      primary: string;
      secondary: string;
    };
    logo: {
      background: string;
      text: string;
    };
    navigation: {
      default: string;
      hover: string;
      active: string;
    };
  };
  spacing: {
    padding: string;
    height: {
      mobile: string;
      desktop: string;
    };
  };
  effects: {
    backdrop: boolean;
    shadow: string;
    transition: string;
  };
}
```

## 📱 响应式设计

### 📐 断点适配

```typescript
const responsiveConfig = {
  mobile: {
    // < 768px
    showNavigation: false,
    showMobileMenu: true,
    logoSize: 'sm',
    height: 'h-16',
  },
  tablet: {
    // 768px - 1024px
    showNavigation: false,
    showMobileMenu: true,
    logoSize: 'md',
    height: 'h-18',
  },
  desktop: {
    // > 1024px
    showNavigation: true,
    showMobileMenu: false,
    logoSize: 'lg',
    height: 'h-20',
  },
};
```

### 📱 移动端适配策略

1. **导航隐藏**：在移动端隐藏主导航菜单
2. **汉堡菜单**：显示移动端菜单按钮
3. **品牌简化**：在小屏幕上可能隐藏副标题
4. **按钮优化**：调整按钮大小和间距

## 🔧 实现示例

### 📦 基础实现

```typescript
import React from 'react';
import { Logo } from './Logo';
import { BrandText } from './BrandText';
import { Navigation } from './Navigation';
import { ActionButtons } from './ActionButtons';

export function Header({
  title = 'AI工具导航',
  subtitle = '发现优质AI工具',
  navigation = [],
  actions = [],
  variant = 'default',
  sticky = true,
  className = '',
  onSubmitTool,
  onMenuToggle,
  ...props
}: HeaderProps) {
  const baseClasses = `header header-${variant}`;
  const stickyClasses = sticky ? 'sticky top-0 z-40' : '';
  
  return (
    <header 
      className={`${baseClasses} ${stickyClasses} ${className}`}
      {...props}
    >
      <div className="container">
        <div className="content">
          {/* 品牌区域 */}
          <div className="flex items-center space-x-4">
            <Logo size="md" />
            <BrandText 
              title={title} 
              subtitle={subtitle}
              showSubtitle={true}
            />
          </div>

          {/* 桌面端导航 */}
          <Navigation 
            items={navigation}
            className="hidden lg:flex"
            variant="underline"
          />

          {/* 操作按钮 */}
          <ActionButtons 
            actions={actions}
            onSubmitTool={onSubmitTool}
            onMenuToggle={onMenuToggle}
          />
        </div>
      </div>
    </header>
  );
}
```

### 🎛️ Logo 组件实现

```typescript
export function Logo({ 
  size = 'md', 
  className = '', 
  onClick,
  children 
}: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10 lg:w-12 lg:h-12',
    lg: 'w-12 h-12 lg:w-14 lg:h-14',
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // 默认跳转到首页
      window.location.href = '/';
    }
  };

  return (
    <div 
      className={`
        ${sizeClasses[size]}
        bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 
        rounded-xl flex items-center justify-center 
        shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 
        transition-all duration-300 hover:scale-105 cursor-pointer
        ${className}
      `}
      onClick={handleClick}
    >
      {children || (
        <svg className="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )}
    </div>
  );
}
```

### 📝 BrandText 组件实现

```typescript
export function BrandText({
  title,
  subtitle,
  showSubtitle = true,
  titleClassName = '',
  subtitleClassName = '',
  onClick
}: BrandTextProps) {
  return (
    <div className="hidden sm:block" onClick={onClick}>
      <h1 className={`
        text-xl lg:text-2xl font-bold 
        bg-gradient-to-r from-slate-800 via-indigo-700 to-blue-600 
        bg-clip-text text-transparent
        ${titleClassName}
      `}>
        {title}
      </h1>
      {showSubtitle && subtitle && (
        <p className={`
          text-xs lg:text-sm text-slate-500 mt-0.5
          ${subtitleClassName}
        `}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
```

## 🎪 使用示例

### 🚀 基础使用

```typescript
import { Header } from './components/Header';

function App() {
  const navigationItems = [
    { id: '1', label: '热门工具', href: '/hot' },
    { id: '2', label: '最新工具', href: '/new' },
    { id: '3', label: '分类浏览', href: '/categories' },
  ];

  const actionButtons = [
    {
      id: 'submit',
      label: '提交工具',
      variant: 'primary' as const,
      onClick: () => console.log('提交工具'),
    },
  ];

  return (
    <div>
      <Header 
        title="AI工具导航"
        subtitle="发现优质AI工具"
        navigation={navigationItems}
        actions={actionButtons}
      />
      {/* 其他内容 */}
    </div>
  );
}
```

### 🎨 自定义样式

```typescript
function CustomHeader() {
  return (
    <Header 
      variant="minimal"
      sticky={false}
      className="bg-gradient-to-r from-purple-500 to-pink-500"
      title="自定义标题"
      navigation={[
        { 
          id: '1', 
          label: '首页', 
          href: '/',
          icon: <HomeIcon className="w-4 h-4" />
        },
      ]}
    />
  );
}
```

### 📱 移动端优化

```typescript
function MobileOptimizedHeader() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <Header 
      mobileBreakpoint="md"
      showMobileMenu={showMobileMenu}
      onMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
      actions={[
        {
          id: 'menu',
          label: '菜单',
          hidden: 'desktop',
          onClick: () => setShowMobileMenu(!showMobileMenu),
        },
      ]}
    />
  );
}
```

## 🧪 测试用例

### 🔬 单元测试

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';

describe('Header Component', () => {
  const defaultProps = {
    title: 'Test Title',
    subtitle: 'Test Subtitle',
  };

  it('should render title and subtitle', () => {
    render(<Header {...defaultProps} />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('should render navigation items', () => {
    const navigation = [
      { id: '1', label: 'Home', href: '/' },
      { id: '2', label: 'About', href: '/about' },
    ];

    render(<Header {...defaultProps} navigation={navigation} />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('should handle action button clicks', () => {
    const handleSubmit = jest.fn();
    const actions = [
      { id: 'submit', label: 'Submit', onClick: handleSubmit },
    ];

    render(<Header {...defaultProps} actions={actions} />);
    
    fireEvent.click(screen.getByText('Submit'));
    expect(handleSubmit).toHaveBeenCalled();
  });

  it('should apply variant styles', () => {
    const { container } = render(
      <Header {...defaultProps} variant="compact" />
    );
    
    expect(container.firstChild).toHaveClass('header-compact');
  });
});
```

### 🎭 集成测试

```typescript
describe('Header Integration', () => {
  it('should work with responsive navigation', () => {
    // 测试响应式导航功能
    render(<Header navigation={mockNavigation} />);
    
    // 桌面端应显示导航
    expect(screen.getByRole('navigation')).toBeVisible();
    
    // 模拟移动端
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    });
    
    // 触发 resize 事件
    fireEvent(window, new Event('resize'));
    
    // 移动端应隐藏导航
    expect(screen.getByRole('navigation')).not.toBeVisible();
  });
});
```

## 🚀 性能优化

### ⚡ 优化策略

1. **React.memo**：避免不必要的重渲染
2. **useCallback**：缓存事件处理函数
3. **懒加载**：非关键组件延迟加载
4. **CSS-in-JS 优化**：使用 CSS 变量减少样式计算

```typescript
export const Header = React.memo(function Header(props: HeaderProps) {
  const handleSubmit = useCallback(() => {
    props.onSubmitTool?.();
  }, [props.onSubmitTool]);

  // 组件实现...
});
```

## 📈 扩展性设计

### 🔌 插件系统

```typescript
interface HeaderPlugin {
  id: string;
  name: string;
  render: (props: HeaderProps) => React.ReactNode;
  position: 'left' | 'center' | 'right';
}

// 使用插件
<Header 
  plugins={[
    searchPlugin,
    notificationPlugin,
    userMenuPlugin,
  ]}
/>
```

### 🎨 主题系统

```typescript
// 主题提供者
<ThemeProvider theme={customTheme}>
  <Header />
</ThemeProvider>

// 主题切换
const { theme, setTheme } = useTheme();
<Header theme={theme} />
```

---

## 📚 相关文档

- [组件封装分析方案](../组件封装分析方案.md)
- [组件架构设计图](../组件架构设计图.md)
- [Sidebar组件设计](./Sidebar组件设计.md)
- [基础使用示例](../examples/基础使用示例.md)

---

*本文档将随着组件开发进展持续更新和完善。*