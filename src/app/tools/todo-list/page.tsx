'use client'; // Next.js 客户端组件标记

import { useState } from 'react'; // 导入状态管理钩子

// 定义一个任务的类型（方便TypeScript检查）
type Todo = {
  id: string; // 任务唯一标识
  title: string; // 任务内容
};

export default function TodoList() {
  // 1. 用useState创建存储Todo列表的状态
  // todos：当前的任务列表（初始为空数组）
  // setTodos：更新任务列表的函数
  const [todos, setTodos] = useState<Todo[]>([]);

  // 2. 用useState创建存储输入框内容的状态
  const [inputText, setInputText] = useState('');

  // 3. 新增任务的函数
  const addNewTodo = () => {
    // 简单验证：输入框不能为空
    if (inputText.trim() === '') {
      alert('请输入任务内容！');
      return;
    }

    // 创建新任务对象
    const newTodo: Todo = {
      id: Date.now().toString(), // 用当前时间戳当唯一ID（简单又好用）
      title: inputText.trim(), // 去除输入的前后空格
    };

    // 4. 核心：更新任务列表
    // 用新数组替换旧数组（React要求状态不可变）
    // [newTodo, ...todos]：新任务放前面，后面跟着原来的所有任务
    setTodos([newTodo, ...todos]);

    // 清空输入框
    setInputText('');
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <h1>学习 useState 存储 Todo 列表</h1>

      {/* 输入框和添加按钮 */}
      <div style={{ margin: '20px 0' }}>
        {/* 输入框：值由inputText状态控制 */}
        <input
          type="text"
          value={inputText}
          // 输入时实时更新inputText状态
          onChange={(e) => setInputText(e.target.value)}
          placeholder="请输入任务..."
          style={{
            width: '300px',
            padding: '8px',
            marginRight: '10px',
          }}
        />
        {/* 点击按钮触发新增任务 */}
        <button onClick={addNewTodo} style={{ padding: '8px 16px' }}>
          添加任务
        </button>
      </div>

      {/* 显示任务列表 */}
      <div>
        <h3>任务列表（共 {todos.length} 项）</h3>
        {/* 如果列表为空，显示提示 */}
        {todos.length === 0 ? (
          <p>暂无任务，赶紧添加一个吧~</p>
        ) : (
          // 遍历todos数组，显示每个任务
          <ul>
            {todos.map((todo) => (
              <li key={todo.id} style={{ margin: '8px 0' }}>
                {todo.title}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}