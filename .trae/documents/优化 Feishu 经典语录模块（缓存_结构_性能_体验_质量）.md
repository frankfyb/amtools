## 现状分析

* 路由与文件：`/src/app/tools/classic-quotes/page.tsx`、`/src/app/api/feishu/classic-quotes/route.ts`、`classic-quotes.json`

* 缓存：服务端文件缓存（无过期策略），前端 `localStorage` 收藏；接口统一 `no-store`

* 网络：前端 60s 强刷远端；服务端每次可选强制刷新并重写文件

* 渲染：GSAP 文本/卡片动画；收藏视图与随机获取；加载/错误/正常态

* 状态：`api/loading/slow/err/q/remoteQuotes/favIds/auto/anim` 等散落在组件内

## 优化目标

* 缓存过期可控、返回 304 友好、支持 SWR

* API 封装成服务层，类型完备、依赖清晰

* 提升渲染与请求性能（减少重渲染与无效轮询）

* 结构化组件与状态管理，降低复杂度

* 优化用户体验（加载、错误、动画与可达性）

* 强化类型与测试，提升代码质量与可持续性

## 具体改造方案

### 1. 缓存与协议

* 后端 TTL：新增 `FEISHU_CACHE_TTL_MINUTES`，基于 `payload.updatedAt` 判断是否命中缓存；`refresh=1` 强制刷新

* 条件请求：返回 `ETag`/`Last-Modified`，支持 `If-None-Match`/`If-Modified-Since`，命中时返回 304

* 响应头：`Cache-Control: public, max-age=60, stale-while-revalidate=300`（前端可用 SWR 思路）

* 文件结构保持不变，追加 `etag` 字段（可用 `hash(quotes)`）

### 2. 服务封装

* 新增 `src/lib/feishu/ClassicQuotesService.ts`

  * `getTenantAccessToken()`、`listFields()`、`listRecords()`、`normalize()`、`buildPayload()`、`hash()`

  * 可注入 `fetch` 与 baseURL，便于测试与复用

* 类型集中：`src/types/feishu.ts`（`TenantTokenResponse/Field/Record/Quote/Payload`）

* API 路由仅调服务层，并处理缓存策略与头信息

### 3. 性能优化

* 渲染优化：

  * 将卡片、工具栏、收藏列表拆分子组件并 `React.memo`

  * 事件处理 `useCallback`，计算派生值 `useMemo`

  * 动画只在必要依赖变化时触发；尊重 `prefers-reduced-motion`

* 图片与资源：

  * `next/image` 使用合适 `sizes`/`quality`，关键图设 `priority`、`placeholder="blur"`

  * `preconnect` 远端域名；避免 `unoptimized`，与 `next.config.ts images.qualities` 保持一致

* 网络请求：

  * 替换固定 60s 强刷为 TTL+SWR（前台拉取后台静默刷新）

  * 失败重试指数退避；AbortController 取消正在进行的请求

### 4. 代码结构与状态管理

* 组件拆分：`QuoteCard`、`Toolbar`、`StatusBar`、`FavList`、`ErrorPanel`

* 状态管理：

  * 合并碎片状态为 `useReducer`（`loading/err/q/favIds/remoteQuotes/anim/auto/api`）

  * 自定义 Hook：`useFeishuQuotes({ ttl })`（拉取/归一化/SWR），`useFavorites()`（localStorage 同步）

* 动画抽象：`src/hooks/useGsapText.ts`、`src/hooks/usePressFeedback.ts`

### 5. 用户体验

* 加载：骨架屏 + 状态栏细粒度文案；按钮禁用与按压反馈

* 错误：错误类目区分（网络/解析/空数据），提供重试与反馈渠道

* 动画：按压反馈、进入淡入，减少无限摇摆在后台的资源消耗

* 可达性：`aria-label`、`focus-visible`、键盘操作支持

### 6. 代码质量

* 全量类型定义覆盖服务层与路由返回；移除 `any`

* ESLint 规则强化 `exhaustive-deps`、`no-explicit-any`；TSC 严格

* 单元测试：服务层（令牌/分页/归一化/TTL 命中）

* e2e 测试：加载态、收藏、刷新、错误重试、动画可选

### 7. 可持续性

* 常量提取：环境变量键、端点、TTL 默认值、动画参数与类名

* 文档：在 `docs/` 增加模块设计与缓存策略说明，记录接口约定与测试范围

## 交付清单（分阶段）

* Phase 1（缓存/服务层）

  * 新增服务层与类型；路由改用服务层；实现 TTL 与 304

* Phase 2（网络与渲染）

  * 前端 TTL+SWR 拉取；拆分组件；优化图片与动画触发

* Phase 3（状态与体验）

  * `useReducer`、Hooks 整合；加载/错误交互完善；可达性增强

* Phase 4（质量与文档）

  * 单元/e2e 测试；ESLint/TS 强化；补充 docs

## 关键代码草案

```ts
// src/lib/feishu/ClassicQuotesService.ts
export class ClassicQuotesService {
  constructor(private fetchImpl: typeof fetch, private appId: string, private secret: string, private baseToken: string) {}
  async getTenantAccessToken() {}
  async listFields(appId: string, tableId: string) {}
  async listRecords(appId: string, tableId: string, viewId?: string) {}
  normalize(records: any[], fields: any[]): Quote[] { return []; }
  buildPayload(quotes: Quote[]): Payload { return { quotes, updatedAt: Date.now() }; }
  hash(payload: Payload): string { return ""; }
}
```

```ts
// 缓存命中逻辑（路由伪代码）
const ttlMs = Number(process.env.FEISHU_CACHE_TTL_MINUTES ?? 30) * 60_000;
if (!forceRefresh && cacheExists && Date.now() - payload.updatedAt < ttlMs) {
  return new Response(JSON.stringify(payload), { status: 200, headers: {
```

