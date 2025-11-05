'use client';

// 空态组件：当列表为空时显示友好的提示文案
// 作用：统一项目的空列表样式与提示，便于复用
// 参数：
// - className：外层容器的额外样式类
// - message：自定义提示文案（不传则使用默认文案）
// 注意事项：
// - 该组件不包含交互逻辑，仅负责展示
// - 文案应简洁友好，避免给用户造成困扰

type Props = {
  className?: string;
  message?: string;
};

export default function EmptyState({ className, message }: Props) {
  return (
    <div
      className={[
        'border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-4 text-center',
        'bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400',
        className,
      ].filter(Boolean).join(' ')}
    >
      {message ?? '暂无任务，点击“添加任务”或按 Enter 尝试添加'}
    </div>
  );
}