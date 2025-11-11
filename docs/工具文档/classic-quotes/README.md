# 经典语录工具：分阶段教学总览

面向完全新手，结合实际源码，循序渐进掌握从浏览器到 Next.js 的完整开发链路。示例均来源于：
- 工具页：`src/app/tools/classic-quotes/page.tsx`
- API 路由：`src/app/api/feishu/classic-quotes/route.ts`
- 数据文件：`src/app/tools/classic-quotes/classic-quotes.json`

## 学习路径与项目定位
- 浏览器端负责页面展示、交互与本地持久化（收藏、自动刷新）。
- 服务端 API 负责调用飞书多维表格，整合数据并缓存到工具目录的 JSON 文件。
- 前端通过 `fetch('/api/feishu/classic-quotes')` 获取最新语录，优先使用远端数据，否则回退内置数据。

## 阅读顺序建议
1. **浏览器基础** → 2. **JavaScript 核心** → 3. **TypeScript 进阶** → 4. **React 应用** → 5. **Next.js 技巧** → 6. **状态管理** → 7. **数据传递**。

## 目录（每章独立成文）
- [01-浏览器基础](./01-浏览器基础.md)
- [02-JavaScript核心概念](./02-JavaScript核心概念.md)
- [03-TypeScript进阶特性](./03-TypeScript进阶特性.md)
- [04-React框架应用](./04-React框架应用.md)
- [05-Next.js实战技巧](./05-Next.js实战技巧.md)
- [06-状态管理方案](./06-状态管理方案.md)
- [07-数据传递机制](./07-数据传递机制.md)

## 源码结构速览
- `page.tsx`：定义状态（`api`、`loading`、`favIds` 等），在 `useEffect` 中拉取远端数据与保存收藏，`fetchQuote()` 负责随机展示语录。
- `route.ts`：实现 `GET` 接口，支持 `refresh=1` 强制刷新；从飞书获取字段与记录，映射为统一 `quotes` 结构，并写入 `classic-quotes.json`。
- `classic-quotes.json`：服务端生成的本地缓存（含原始记录与映射后的 `quotes`）。

## 学习目标
- 掌握浏览器与前端基础能力（DOM、事件、存储、网络）。
- 理解 JS/TS 的类型与异步处理，写出健壮的映射逻辑。
- 能用 React + Next.js 完成数据拉取、展示与交互的完整闭环。

> 温馨提示：章节内的代码块均为直接可运行或贴近现有源码的示例，遇到不理解的概念时可先通读全文，再按目录定向回看。