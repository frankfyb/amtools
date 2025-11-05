// TodoList 组件：负责展示任务总数、空态，以及渲染每个 TodoItem
// 作用：
// - 统一列表容器结构与样式
// - 将子项交互回调转发到父层（单向数据流保持清晰）
// 参数：
// - todos：任务数组
// - onToggle/onDelete/onEdit：对子项的交互回调，上层用来修改状态
// - className：外层样式扩展

'use client';

import TodoItem, { Todo } from './TodoItem';
import EmptyState from './EmptyState';

type Props = {
  todos: Todo[];
  className?: string;
  onToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, title: string) => void;
};

export default function TodoList({ todos, className, onToggle, onDelete, onEdit }: Props) {
  return (
    <div className={["mt-6", className].filter(Boolean).join(' ')}>
      {/* 任务总数：通过 aria-live 让读屏软件感知变化 */}
      <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-2" aria-live="polite">任务数：{todos.length}</div>
      {todos.length === 0 ? (
        // 列表为空时显示统一的空态提示
        <EmptyState />
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
          ))}
        </ul>
      )}
    </div>
  );
}