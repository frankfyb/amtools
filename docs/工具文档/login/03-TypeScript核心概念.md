# TypeScript 核心概念（结合本项目的类型实践）

## 学习目标
- 理解基本类型、联合与交叉、类型推断与断言、泛型与实用类型。
- 掌握在 NextAuth 登录流程中正确定义返回类型并消除类型错误。

## 基础类型与联合
- `string | undefined` 联合类型在错误处理中的常见用法：服务返回可能为空或缺失。
- 可选属性：`{ error?: string }` 与 `error: string | undefined` 的区别在于是否存在键。

## 类型推断与断言
- 推断优先：尽可能让 TS 自己推断返回；需要时用窄化或可选链。
- 断言要谨慎：只在你确定类型时使用 `as`，避免隐藏真实问题。

## 泛型与工具类型
- `Partial<T>`、`Pick<T, K>`、`Omit<T, K>` 常用于表单与服务参数整形。
- `ReturnType<typeof fn>` 可用于推导函数返回类型，减少重复定义。

## 与本项目的类型实践
- 在 `authService.ts` 中定义 `AuthSignInResult`：
```ts
export type AuthSignInResult = {
  ok: boolean;
  error?: string; // 可选，但当错误存在时必须是字符串
};
```
- 对 `next-auth` 的 `signIn` 返回值进行收敛：
```ts
const res = await signIn('credentials', { redirect: false, ...payload });
return { ok: !res?.error, error: res?.error ?? undefined };
```
- 处理 `string | null | undefined` 到 `string | undefined` 的类型消歧：
```ts
const err: string | undefined = res?.error ?? undefined;
```

## 常见类型问题
- `any` 滥用：短期方便，长期拖慢开发；尽量提供最小必要的类型。
- 过度复杂：类型不应超过业务所需的复杂度；优先可读性。

## 练习建议
- 为登录表单的状态创建类型：`LoginFormState`，包含 `username`、`password`、`loading`、`error?: string`。
- 为服务层的参数定义 `CredentialsPayload` 与 `OAuthProvider` 枚举，保证传参规范。