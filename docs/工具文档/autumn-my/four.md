## 目标

- 构建黑色背景下的宝丽来风格不规则错落照片墙（27 张），点击照片可放大查看，移动端适配，质感与交互统一。

## 资源与数据

- 远程图片地址前缀：`https://objectstorageapi.sg-members-1.clawcloudrun.com/cfd6671w-storage/autumn-my/`
- 图片文件名：`1.png` 到 `27.png`
- 使用 `next/image` 懒加载与优化（质量建议 85）。

## 组件与结构

- 新增第四屏 Section（高度 `100vh`）：`<section class="relative h-[100vh] w-full bg-black overflow-hidden">`
- 组件：`PolaroidCard`
  - 结构：白色相纸边框容器（`bg-white p-2 rounded-sm shadow-[...]`）+ 内部 `Image`
  - 质感：纸张轻微纹理/颗粒（半透明噪点叠加层 + `mix-blend-overlay`）
  - 随机样式：旋转角度（-7°~7°）、层级（z-index）、位置偏移（基于响应断点）
- 放大查看 Modal：固定层 `fixed inset-0 bg-black/70` + 居中大图 + 关闭按钮（点击背景或 ESC 关闭）。

## 布局策略（错落堆叠）

- Desktop（≥768px）：绝对定位画布，生成 27 张卡片的随机 `x/y/rotate/zIndex`，保证不出界；宽高采用比例 `w-[18vw]`、`h-auto`。
- Mobile（<768px）：2~3 列瀑布式网格；每列内卡片添加轻微旋转与位移（`translate-y`）以制造随性；单卡 `w-[42vw]`。
- 进入第四屏时，使用 GSAP Timeline 让卡片从 `opacity:0 + y:20 + scale:0.95` 到 `opacity:1 + y:0 + scale:1`，并 `stagger` 打散入场。

## 动画与交互

- 入场动画：第四屏激活（`activeIndex === 3`）后对所有卡片执行 stagger 入场（`stagger: 0.06`，`duration: 0.6`，`ease: 'power2.out'`）。
- 悬停/轻触：卡片轻微抖动与亮度提升（`scale:1.02 + brightness`），增强质感。
- 点击放大：
  - 打开 Modal，展示该图的较大尺寸（`sizes` 根据屏幕适配）
  - Modal 内部使用 GSAP `fromTo`：`opacity:0→1, scale:0.95→1`
  - ESC、点击背景、点击关闭按钮均可关闭。

## 状态与类型

- `const polaroids = useMemo(() => Array.from({ length: 27 }).map((_, i) => ({ url, rotate, x, y, z })), [])`
- `const [viewer, setViewer] = useState<{ url: string } | null>(null)` 管理放大查看。
- 类型：`interface Polaroid { url:string; rotate:number; x:number; y:number; z:number }`

## 移动端适配

- 触控目标增大：卡片点击区 ≥ 44px。
- Modal 手势支持：点击背景关闭；可选择加双指缩放（非必须）。
- 布局切换：`md:` 断点切换绝对定位画布与瀑布式网格。

## 性能优化

- `next/image` 懒加载：除首排/首列外全部 `loading="lazy"`。
- 首屏按需优先：可对前 3 张设置 `priority`（可选）。
- 纹理与噪点：使用小型内联 data-URI 或单色噪点层，控制透明度避免重绘压力。
- 动画仅在 `activeIndex === 3` 时注册，离开时 `kill()` timeline。

## 集成到现有页面

- 在现有 `page.tsx` 中添加第四屏 Section；与现有 `wrapperRef` 滚动切换逻辑接轨：
  - 下滑：第二屏 → 第三屏 → 第四屏（`goTo(3)`）
  - 上滑：第四屏 → 第三屏 → 第二屏
- 在 `useEffect` 监听 `activeIndex`，当进入第四屏时初始化卡片随机布局与入场动画，退出时清理。

## 验证与测试

- 验证远程图片加载是否允许：`next.config.ts images.remotePatterns` 已包含该域（若未包含，补充 `/cfd6671w-storage/autumn-my/**`），确认 `png` 扩展可用。
- 交互测试：点击每张照片放大；背景点击与 ESC 关闭；移动端点击区域响应。
- 适配测试：375px、414px、768px 与桌面宽度下布局与动画一致性。
