## 问题与目标
- 交互反馈：为可点击元素提供即时的按压反馈与指针提示，提高触觉与视觉响应。
- 响应式设计：在小屏设备优化网格与浮动布局，避免重叠与错乱；系统性引入 `sm:`/`lg:` 前缀。

## 交互反馈改造
1. 统一按压反馈方案（遵循项目“动画统一使用 GSAP”的规范）：
- 在可点击元素上绑定 `pointerdown/pointerup/pointerleave` 事件，使用 `gsap.to` 快速缩放与阴影过渡（如缩放至 `0.96~0.98`，恢复至 `1.0`）。
- 同时增加 `cursor-pointer`、`transition-transform`、`ease-out`，提升非动画场景的响应。
- 焦点可达性：添加 `focus-visible:ring` 与 `outline-none`，保证键盘可用。

2. 改造清单（元素与文件路径）
- `src/app/tools/autumn-my/components/PhotoWall.tsx:27`（桌面端 `button`）与 `src/app/tools/autumn-my/components/PhotoWall.tsx:42`（移动端 `button`）：
  - 增加 `cursor-pointer`、`focus-visible:ring-2 ring-stone-300`；绑定 GSAP 按压反馈。
- `src/app/tools/autumn-my/page.tsx:175`（查看器关闭 `button`）：
  - 增加 `cursor-pointer`、`hover:scale-105 active:scale-95` 或 GSAP 按压反馈；补充 `aria-label="Close viewer"`。
- 若后续加入“memory-card”翻转组件：
  - 在卡片正反面使用 `transform-style: preserve-3d`、`backface-visibility: hidden`，点击按压同样套用 GSAP 反馈。

## 响应式设计优化
1. 系统引入 `sm:` 与 `lg:` 前缀：
- 文本与间距：在 `ScrollLyricSection` 与 `PoemSection` 文本容器增加 `sm:text-base sm:space-y-2`，保持 `md:` 现有设置，并在大屏添加 `lg:text-3xl lg:space-y-4`。
- 交互按钮：为查看器关闭按钮与照片墙卡片增加 `sm:px-2 sm:py-1 md:px-4 md:py-2`，确保小屏按压区域舒适。

2. PhotoWall 小屏布局稳健化：
- 现有移动端宽度 `(i % 3 === 1 ? 38 : 34)vw` 在极小屏可能重叠；调整为 `sm:(32~36)vw`，并针对特定索引的 `left/top` 做小幅微调（±2%），减少重叠概率。
- 按 `sm:`/`md:` 切换，确保 `md:block` 与 `md:hidden` 逻辑保持；必要时在 `sm` 下减少同时显示的卡片密度（例如 8→6）。

3. 辅助可达性与触控体验：
- 为所有可点击元素添加 `aria-label` 与更大的点击区域（`sm:` 下增大 `padding`）。

## 验证与测试
- 类型与规范：运行 `type-check` 与 `lint`，确保无错误。
- 交互测试：在 360px（小屏）、768px（平板）、1024px（桌面）下分别检查：
  - 按压反馈是否即时、流畅（缩放/阴影回弹）
  - 文本与卡片是否无重叠、滚动与切屏逻辑正常
- 无障碍测试：键盘 `Tab` 可达性与 `focus-visible` 外观一致。

## 交付项
- 为上述元素添加即时按压反馈与指针样式、焦点态。
- 在 `ScrollLyricSection`、`PoemSection`、`PhotoWall`、查看器关闭按钮引入 `sm:`/`lg:` 前缀的文本与间距、宽度优化。
- 针对 PhotoWall 移动端的宽度与位置进行轻度参数化以避免重叠。

请确认以上方案；确认后我将进行代码修改与联调测试。