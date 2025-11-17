import type { FieldMeta, RawRecord, Quote, Payload } from '@appTypes/feishu'

// ClassicQuotesService：封装与飞书多维表格（Bitable）的交互
// 作用：
// - 统一实现认证（获取租户访问令牌 tenant_access_token）
// - 拉取表格的字段元数据与记录（支持分页）
// - 将飞书的数据结构归一化为前端可用的 Quote[]
// - 生成用于 HTTP 条件请求的 ETag 值
// 使用方法：由 API 路由调用此服务，避免在路由中散落具体实现细节，提升可读性与可维护性
export class ClassicQuotesService {
  // 构造函数：将可变的实现与参数注入到服务中，便于测试（例如可替换 fetch 实现）
  constructor(
    private readonly fetchImpl: typeof fetch, // 用于发起网络请求的实现（通常传入全局 fetch）
    private readonly appId: string,           // 飞书应用 App ID（来自环境变量）
    private readonly secret: string,          // 飞书应用 App Secret（来自环境变量）
    private readonly baseToken: string,       // 多维表格应用标识（Base Token）
    private readonly tableId: string,         // 目标表格 ID（table_id）
    private readonly viewId?: string          // 可选视图 ID（view_id），用于过滤视图
  ) {}

  // 获取租户访问令牌：用于后续访问飞书多维表格的授权
  async getTenantAccessToken(): Promise<string> {
    const url = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal'
    const resp = await this.fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: this.appId, app_secret: this.secret }),
      cache: 'no-store',
    })
    const data: { code: number; tenant_access_token?: string; msg?: string } = await resp.json()
    if (!resp.ok || data.code !== 0 || !data.tenant_access_token) throw new Error(`Feishu auth failed: ${data.msg || resp.statusText}`)
    return data.tenant_access_token
  }

  // 拉取字段元数据：包含每个字段的 id/name/type，便于后续按名称或类型选择内容
  async listFields(token: string): Promise<FieldMeta[]> {
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${this.baseToken}/tables/${this.tableId}/fields?page_size=200`
    const resp = await this.fetchImpl(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    const data: { code: number; msg?: string; data?: { items?: Array<{ id: string; name: string; type: string }> } } = await resp.json()
    if (!resp.ok || data.code !== 0) throw new Error(`Feishu fields failed: ${data.msg || resp.status}`)
    const items = (data.data?.items || [])
    return items.map(it => ({ id: it.id, name: it.name, type: it.type }))
  }

  // 拉取记录数据：分页读取整张表的所有记录（每条记录包含 fields）
  async listRecords(token: string): Promise<RawRecord[]> {
    const base = `https://open.feishu.cn/open-apis/bitable/v1/apps/${this.baseToken}/tables/${this.tableId}/records`
    let pageToken: string | undefined
    const results: RawRecord[] = []
    for (let i = 0; i < 1000; i++) {
      const url = `${base}?page_size=100${this.viewId ? `&view_id=${this.viewId}` : ''}${pageToken ? `&page_token=${pageToken}` : ''}`
      const resp = await this.fetchImpl(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      const data: { code: number; data?: { items?: Array<{ record_id: string; fields: Record<string, unknown> }>; has_more?: boolean; page_token?: string; next_page_token?: string }; msg?: string } = await resp.json()
      if (!resp.ok || data.code !== 0) throw new Error(`Feishu records failed: ${data.msg || resp.status}`)
      const items = (data.data?.items || [])
      for (const it of items) results.push({ record_id: it.record_id, fields: it.fields || {} })
      const hasMore = !!(data.data?.has_more)
      pageToken = data.data?.page_token || data.data?.next_page_token
      if (!hasMore) break
    }
    return results
  }

  // normalizeValue：将任意类型的字段值转为字符串，便于统一处理
  private normalizeValue(val: unknown): string {
    if (val == null) return ''
    if (typeof val === 'string') return val
    if (typeof val === 'number' || typeof val === 'boolean') return String(val)
    if (Array.isArray(val)) {
      return val.map(v => {
        if (v == null) return ''
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v)
        if (typeof v === 'object') {
          const o = v as Record<string, unknown>
          const candidate = o.text ?? o.name ?? o.title
          if (typeof candidate === 'string') return candidate
          try { return JSON.stringify(v) } catch { return '' }
        }
        return ''
      }).join(' ')
    }
    if (typeof val === 'object') {
      const o = val as Record<string, unknown>
      const candidate = o.text ?? o.name ?? o.title
      if (typeof candidate === 'string') return candidate
      try { return JSON.stringify(val) } catch { return '' }
    }
    return String(val)
  }

  // normalize：根据字段元数据与记录内容，提取出统一的 Quote 结构
  normalize(records: RawRecord[], fields: FieldMeta[]): Quote[] {
    const lower = (x: unknown) => (typeof x === 'string' ? x.toLowerCase() : '')
    const nameById = new Map<string, string>()
    const idByName = new Map<string, string>()
    // 建立字段 id 与名称的映射，支持通过 id 或名称访问
    for (const f of fields) {
      const name = typeof f.name === 'string' ? f.name : String(f.id)
      nameById.set(f.id, name)
      const l = lower(f.name)
      if (l) idByName.set(l, f.id)
    }
    // 在记录 fields 中按候选字段名寻找目标内容（优先精准匹配，其次模糊匹配）
    const pickName = (names: string[], recFields: Record<string, unknown>) => {
      for (const n of names) {
        const id = idByName.get(lower(n))
        const keyById = id ? nameById.get(id) : undefined
        if (keyById && recFields[keyById] !== undefined) return this.normalizeValue(recFields[keyById])
        if (recFields[n] !== undefined) return this.normalizeValue(recFields[n])
      }
      const keys = Object.keys(recFields)
      const target = names.map(s => lower(s))
      const k = keys.find(k => target.some(t => lower(k).includes(t)))
      return k ? this.normalizeValue(recFields[k]) : ''
    }
    // 将每条记录转换为统一的 Quote 结构
    const quotes = records.map((r, idx) => ({
      id: idx + 1,
      text: pickName(['内容','语录','text','quote','句子','sentence'], r.fields),
      author: pickName(['作者','author','写作者','来源','source'], r.fields),
      category: pickName(['分类','类别','标签','category','tag','type'], r.fields),
    }))
    // 过滤掉空文本的条目，保证数据质量
    return quotes.filter(q => q.text)
  }

  // buildPayload：构造标准响应载荷，包含来源、更新时间、字段、记录与归一化后的 quotes
  buildPayload(quotes: Quote[], fields: FieldMeta[], records: RawRecord[]): Payload {
    return { source: 'feishu-bitable', updatedAt: new Date().toISOString(), schema: fields, records, quotes }
  }

  // hashQuotes：生成弱 ETag（用于 HTTP 条件请求）。
  // 提示：若对碰撞更敏感，可替换为 crypto 的 sha256；当前实现已满足一般缓存需求。
  hashQuotes(quotes: Quote[]): string {
    const s = JSON.stringify(quotes)
    let h = 0
    for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0
    return `W/"${(h >>> 0).toString(16)}-${s.length}"`
  }
}