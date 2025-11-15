# 项目技术与环境规范

## 开发环境要求

- Node.js 版本：`18.x` LTS 或更高
- 包管理器：`yarn`（推荐）或 `npm`
- 操作系统：`Linux`

## 核心技术栈

- 框架：`Next.js`（版本 `15.5.6`，见 package.json:18）
- 编程语言：`TypeScript`（主）与 `JavaScript`（辅）
- UI 库：`React`（版本 `19.1.0`，见 package.json:19）
- CSS 框架：`Tailwind CSS`（版本 `4.x`，见 package.json:30）
- 动画库：`GSAP`（版本 `^3.13.0`，见 package.json:16），所有动画统一使用 GSAP 实现

## 开发规范

- 所有新组件必须使用 `TypeScript` 编写
- 样式统一采用 `Tailwind CSS` 原子类 + `CSS Modules`
- 严格遵循 `React Hooks` 最佳实践（避免在条件/循环中调用 Hook、提取自定义 Hook 管理副作用与状态）
- 项目结构遵循 `Next.js` 官方约定（使用 App Router），页面路径位于 `src/app`
- 图片与多媒体统一使用 `next/image` 进行优化加载

## 工具链配置

- 必须包含 `ESLint` + `Prettier` 进行代码规范检查
- `TypeScript` 严格模式必须启用（当前 `tsconfig.json` 已设置 `strict: true`，见 tsconfig.json:7）
- 提交前必须通过 `Husky` 钩子进行代码校验（建议在 `pre-commit` 中执行 `eslint` 与 `tsc --noEmit`）
- 推荐脚本：
  - `lint`: 执行 ESLint（见 package.json:9）
  - `type-check`: 执行类型检查（见 package.json:10）

## 环境变量管理

- 使用 `.env.local` 进行本地开发配置
- 变量暴露策略：仅将需要在客户端访问的变量使用 `NEXT_PUBLIC_` 前缀；敏感变量禁止暴露到客户端，保存在服务端环境变量中

## 兼容性要求

- 支持现代浏览器（Chrome / Firefox / Safari / Edge 的最新两个版本）
- 移动端响应式设计必须通过 `Tailwind` 断点系统实现（如 `sm`、`md`、`lg` 等）

## 静态资源约定

- 公共资源目录：`/public` 与 `src/public/photos`
- 现有图片资源：
  - `src/public/photos/DSC01554.JPG`
  - `src/public/photos/DSC01528.JPG`
- 注意文件扩展名大小写（当前为 `.JPG`），引用时应保持一致以避免在生产环境中出现路径问题

## 版本来源说明

- 版本信息均以 `package.json` 为准：
  - Next.js：`package.json:18`
  - React：`package.json:19`
  - Tailwind CSS：`package.json:30`
  - GSAP：`package.json:16`

## 必读要求

- 本规范文件位于项目根目录的 `.trae/rules/project_rules.md`，为新成员入职的必读文档

```

## 4. 项目结构规范

### 4.1 Next.js 官方约定结构

```

src/
├── app/ # App Router 目录 (Next.js 13+)
│ ├── layout.tsx # 根布局文件
│ ├── page.tsx # 首页
│ └── globals.css # 全局样式
│ └── tools # 各种工具
├── components/ # 可复用组件
│ ├── ui/ # 基础 UI 组件
│ ├── forms/ # 表单组件
│ └── layouts/ # 布局组件
├── hooks/ # 自定义 Hooks
├── lib/ # 工具函数和配置
├── types/ # TypeScript 类型定义
├── styles/ # 样式文件
└── utils/ # 工具函数

```

### 4.2 文件命名规范

- 组件文件: 使用 PascalCase (如: `UserCard.tsx`)
- 工具函数: 使用 camelCase (如: `formatDate.ts`)
- 样式文件: 使用 kebab-case (如: `user-card.module.css`)
```
