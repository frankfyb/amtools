// TodoItem 组件：展示单条任务并提供完成、删除、编辑交互
// 作用：
// - 以最小可复用单元形式呈现任务项
// - 通过回调把交互事件（完成、删除、编辑）上抛给父层管理状态
// 参数说明：
// - todo：任务对象，包含 id/title/completed
// - onToggle(id)：点击复选按钮时触发，切换 completed 状态
// - onDelete(id)：点击删除按钮时触发，删除当前任务
// - onEdit(id, title)：在输入框中修改文本时触发，更新标题
// 注意：
// - 该组件不直接修改状态，而是调用回调交由上层处理（单向数据流）
// - 输入框是受控组件，由父层传入的 todo.title 决定显示内容

'use client';

export type Todo = { id: string; title: string; completed: boolean };

type Props = {
  todo: Todo;
  onToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, title: string) => void;
};

export default function TodoItem({ todo, onToggle, onDelete, onEdit }: Props) {
  return (
    <li className="list-none border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800">
      {/* 完成切换按钮：点击触发 onToggle，上层翻转 completed */}
      <button
        aria-label={todo.completed ? '标记为未完成' : '标记为已完成'}
        className={[
          'w-4 h-4 rounded-sm border flex items-center justify-center',
          todo.completed ? 'bg-emerald-500 border-emerald-500' : 'bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700',
        ].join(' ')}
        onClick={() => onToggle?.(todo.id)}
      >
        {todo.completed && <span className="w-2 h-2 bg-white rounded-sm" />}
      </button>

      {/* 标题编辑：输入变化时调用 onEdit，上层更新 title */}
      <input
        className="flex-1 bg-transparent outline-none"
        value={todo.title}
        onChange={(e) => onEdit?.(todo.id, e.target.value)}
        aria-label="编辑任务内容"
      />

      {/* 删除按钮：点击触发 onDelete，上层移除该任务 */}
      <button
        aria-label="删除任务"
        className="px-2 py-1 text-xs rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700"
        onClick={() => onDelete?.(todo.id)}
      >
        删除
      </button>
    </li>
  );
}