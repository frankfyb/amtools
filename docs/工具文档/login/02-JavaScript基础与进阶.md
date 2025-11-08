# JavaScript 基础与进阶（面向登录/认证场景）

## 学习目标
- 掌握 ES 基础：变量、作用域、原型、异步、模块化。
- 能在登录/退出 UI 中编写健壮的业务逻辑：错误处理、防抖节流、数据校验。

## 基础概念速览
- 作用域与闭包：React 事件中访问状态需要注意闭包；避免使用过期 state。
- 原型与对象：理解对象拷贝（浅/深）、不可变更新（React 中很重要）。
- 异步与 Promise：`async/await` 写法清晰；注意 try/catch 捕获错误并展示给用户。
- 模块与导入导出：本项目将认证逻辑封装到 `authService.ts` 并在组件中按需导入。
- 防抖与节流：防止用户多次点击登录导致重复请求。

## 关键实践
- 错误处理范式：
```ts
try {
  const res = await signIn('credentials', { redirect: false, ...payload });
  if (res?.error) {
    setError(mapError(res.error));
  } else {
    router.replace(nextUrl);
  }
} catch (e) {
  setError('网络或服务异常，请稍后重试');
}
```

- 安全字符串处理：使用模板字符串、`encodeURIComponent` 处理 URL 参数；避免直接拼接导致注入风险。

- 不可变数据更新：
```ts
setForm(prev => ({ ...prev, username: value }));
```

- 事件处理与默认行为：
```ts
function onSubmit(e: React.FormEvent) {
  e.preventDefault(); // 阻止默认跳转
  // 执行登录逻辑
}
```

## 与本项目的实战点
- `login/page.tsx` 中以 `async/await` 调用 `next-auth` 的 `signIn` 并进行错误分支处理。
- 通过 `URL` 与 `URLSearchParams` 构造回跳地址，保证鲁棒性。
- 利用 React 状态保存表单输入、提示与加载态，避免直接操作 DOM。

## 常见坑
- 多次触发登录：在按钮上加 `disabled`，或在逻辑中判断 loading 状态。
- 未区分 `redirect: true/false`：在 NextAuth 中，前端手动控制跳转时需 `redirect: false` 获取结果。
- 直接修改对象引用：React 中必须返回新对象，否则不会触发重渲染。

## 练习建议
- 实现一个防抖的输入校验（如 300ms 后校验用户名格式）。
- 封装一个通用的 `safeRedirect` 工具，接收目标路径与提示参数并返回最终 URL。