// TodoForm 组件：负责输入与添加、清空操作
// 作用：
// - 提供受控的输入入口（内部做校验），通过回调把合法内容交给父层添加
// - 统一按钮样式与交互，支持 Enter 快捷添加
// 参数：
// - onAdd(title)：新增任务回调
// - onClearAll()：清空列表回调
// - maxLength：标题最大长度限制（默认 100）
// - existingTitles：现有标题列表，用于去重检查
// 注意：
// - 组件内部通过 alert 提示错误，实际项目可替换为更友好的提示方案

'use client';

type Props = {
  onAdd: (title: string) => void;
  onClearAll: () => void;
  maxLength?: number;
  existingTitles?: string[];
};

export default function TodoForm({ onAdd, onClearAll, maxLength = 100, existingTitles = [] }: Props) {
  // 提交逻辑：
  // - 去除首尾空白，非空检查
  // - 长度限制检查
  // - 重复内容检查（与 existingTitles 对比）
  // - 通过后调用 onAdd 并清空输入框
  const handleAdd = (input: HTMLInputElement) => {
    const raw = input.value.trim();
    if (!raw) {
      alert('请输入任务内容！');
      return;
    }
    if (raw.length > maxLength) {
      alert(`任务内容长度不能超过 ${maxLength} 字`);
      return;
    }
    if (existingTitles.some((t) => t === raw)) {
      alert('已存在相同任务，请避免重复添加');
      return;
    }
    onAdd(raw);
    input.value = '';
  };

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <input
        type="text"
        placeholder="请输入任务..."
        aria-label="Todo 输入框"
        className="flex-1 min-w-60 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 outline-none bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleAdd(e.currentTarget);
        }}
      />
      <button
        aria-label="添加任务"
        className="px-4 py-2 rounded-lg border border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800"
        onClick={(e) => handleAdd(e.currentTarget.previousElementSibling as HTMLInputElement)}
      >
        添加任务
      </button>
      <button
        onClick={onClearAll}
        aria-label="清空任务"
        className="px-4 py-2 rounded-lg border border-neutral-300 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text白色 dark:border-neutral-700"
      >
        清空任务
      </button>
    </div>
  );
}