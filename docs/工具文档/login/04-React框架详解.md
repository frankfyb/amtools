# React 框架详解（面向新手的登录场景）

## 学习目标
- 理解组件、状态与属性、事件、生命周期（Hooks）、不可变更新与性能优化。
- 能开发登录页、全局认证状态组件并处理一次性提示。

## 核心概念
- 组件：函数式组件是主流；通过 props 与 children 组合复用。
- 状态管理：`useState`/`useEffect`/`useMemo`/`useCallback`；避免不必要重渲染。
- 受控组件：表单输入由 state 控制，`value` 与 `onChange` 同步。
- 条件渲染：根据会话状态决定渲染登录按钮或用户名与退出菜单。

## Hooks 使用
- `useState`：保存输入与交互状态（loading/error）。
- `useEffect`：响应 URL 查询参数变化，展示并清理提示。
- `useMemo`：从 `session.user` 计算显示名称，避免每次渲染重复计算。
- `useContext`：结合 NextAuth 的 `SessionProvider` 使用 `useSession` 获取会话状态。

## 与本项目的实践
- 认证状态组件：
```tsx
'use client';
import { useSession } from 'next-auth/react';

export default function AuthStatus() {
  const { data: session, status } = useSession();
  if (status === 'loading') return null;
  if (!session) return <a href="/login">登录</a>;
  return <UserMenu name={session.user?.name || session.user?.email || '用户'} />;
}
```

- 登录页：受控表单 + 异步提交 + 失败提示 + 成功回跳。

## 性能与体验
- 避免在每次渲染做重计算；用 `useMemo`。
- 交互时避免额外 re-render：分离状态、合理拆组件。
- 异步加载态与错误文案要明确，提升可用性。

## 常见坑
- 忘记 `'use client'`：在 Next.js App Router 下，使用浏览器 API 或事件的组件必须声明客户端。
- 通过 props 向下传递过多数据：考虑提取到服务层或使用 Context。

## 练习建议
- 将登录按钮与用户菜单拆分为两个小组件，父组件根据会话状态决定渲染哪个。
- 提取一次性提示为自定义 Hook，供 Header 和其他页面复用。