# 03 TypeScript 进阶特性

TypeScript 提升了类型安全与可维护性。本章结合 `route.ts` 与 `page.tsx` 展示进阶用法。

## 1. 类型定义与别名
- 明确数据结构，提升可读性与 IDE 提示效果。
```ts
// 服务端
type FieldMeta = { id: string; name: string; type: string }
type AnyRecord = Record<string, unknown>
type RawRecord = { record_id: string; fields: AnyRecord }

// 前端
type Quote = { id: number; text: string; author: string; category: string }
```

## 2. 使用 `unknown` 与类型收窄
- 服务端从外部获取的数据类型不可信，先用 `unknown`/`Record<string, unknown>` 接收，再安全收窄。
- 通过 `typeof` 判断与转换，避免运行时错误。
```ts
const lower = (v: unknown) => typeof v === 'string' ? v.toLowerCase() : ''
```

## 3. 可选链与空值处理
- 远端字段可能缺失，使用 `??` 与可选链进行兜底。
```ts
const text = String(it.text ?? '')
```

## 4. 类型守卫与断言的节制使用
- 当确实有不确定性时，优先用类型守卫而非强制断言。
- 对来自外部的 ID 做健壮转换：
```ts
id: typeof it.id === 'number' ? it.id : (typeof it.id === 'string' ? Number(it.id) || i + 1 : i + 1)
```

## 5. 接口与模块化
- 将类型与函数组织到合适的模块，利于复用与测试。
- 示例：服务端将拉取字段、拉取记录、映射函数分开定义。

## 6. 异步函数的类型提示
- 为返回值与参数添加显式类型，防止误用。
```ts
async function listFields(token: string): Promise<FieldMeta[]> {
  // ...
}
async function listRecords(token: string): Promise<RawRecord[]> {
  // ...
}
```

## 7. 最佳实践
- 面向边界编程：外部数据尽量使用宽类型接收，内部再收敛为窄类型。
- 错误消息统一为字符串，保证前端易处理与显示。
- 保持类型与运行时校验同步：类型只是编译期辅助，运行时仍需防御式编程。

---
**要点回顾**
- 使用明确的类型别名与 `unknown`，对外部数据进行安全收敛。
- 通过空值处理与类型守卫提高健壮性，避免 `undefined` 造成崩溃。