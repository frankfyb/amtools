import { NextResponse } from 'next/server'
import path from 'node:path'
import fs from 'node:fs/promises'

// Types
type FieldMeta = { id: string; name: string; type: string }
type AnyRecord = Record<string, unknown>
type RawRecord = { record_id: string; fields: AnyRecord }

// Env
const APP_ID = process.env.FEISHU_APP_ID as string
const APP_SECRET = process.env.FEISHU_APP_SECRET as string
const APP_TOKEN = process.env.FEISHU_BASE_TOKEN as string // Bitable app/base token
const TABLE_ID = process.env.FEISHU_TABLE_ID as string
const VIEW_ID = process.env.FEISHU_VIEW_ID as string | undefined

const DATA_FILE = path.join(process.cwd(), 'src', 'app', 'tools', 'classic-quotes', 'classic-quotes.json')

async function getTenantAccessToken() {
  const url = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal'
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET }),
    cache: 'no-store',
  })
  const data: { code: number; tenant_access_token?: string; msg?: string } = await resp.json()
  if (!resp.ok || data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`Feishu auth failed: ${data.msg || resp.statusText}`)
  }
  return data.tenant_access_token as string
}

async function listFields(token: string): Promise<FieldMeta[]> {
  const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/fields?page_size=200`
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const data: { code: number; msg?: string; data?: { items?: Array<{ id: string; name: string; type: string }> } } = await resp.json()
  if (!resp.ok || data.code !== 0) throw new Error(`Feishu fields failed: ${data.msg || resp.status}`)
  const items = (data.data?.items || [])
  return items.map(it => ({ id: it.id, name: it.name, type: it.type }))
}

async function listRecords(token: string): Promise<RawRecord[]> {
  const base = `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records`
  let pageToken: string | undefined
  const results: RawRecord[] = []
  for (let i = 0; i < 1000; i++) { // safety cap
    const url = `${base}?page_size=100${VIEW_ID ? `&view_id=${VIEW_ID}` : ''}${pageToken ? `&page_token=${pageToken}` : ''}`
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    const data: {
      code: number;
      data?: {
        items?: Array<{ record_id: string; fields: AnyRecord }>;
        has_more?: boolean;
        page_token?: string;
        next_page_token?: string;
      };
      msg?: string;
    } = await resp.json()
    if (!resp.ok || data.code !== 0) throw new Error(`Feishu records failed: ${data.msg || resp.status}`)
    const items = (data.data?.items || [])
    for (const it of items) {
      results.push({ record_id: it.record_id, fields: it.fields || {} })
    }
    const hasMore = !!(data.data?.has_more)
    pageToken = data.data?.page_token || data.data?.next_page_token
    if (!hasMore) break
  }
  return results
}

function normalizeValue(val: unknown): string {
  if (val == null) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  if (Array.isArray(val)) {
    return val
      .map(v => {
        if (v == null) return ''
        if (typeof v === 'string') return v
        if (typeof v === 'number' || typeof v === 'boolean') return String(v)
        if (typeof v === 'object') {
          const o = v as Record<string, unknown>
          const candidate = o.text ?? o.name ?? o.title
          if (typeof candidate === 'string') return candidate
          try { return JSON.stringify(v) } catch { return '' }
        }
        return ''
      })
      .join(' ')
  }
  if (typeof val === 'object') {
    const o = val as Record<string, unknown>
    const candidate = o.text ?? o.name ?? o.title
    if (typeof candidate === 'string') return candidate
    try { return JSON.stringify(val) } catch { return '' }
  }
  return String(val)
}

function toQuotes(records: RawRecord[], fields: FieldMeta[]) {
  const lower = (x: unknown) => (typeof x === 'string' ? x.toLowerCase() : '')
  const nameById = new Map<string, string>()
  const idByName = new Map<string, string>()
  for (const f of fields) {
    const name = typeof f.name === 'string' ? f.name : String(f.id)
    nameById.set(f.id, name)
    const l = lower(f.name)
    if (l) idByName.set(l, f.id)
  }
  const pickName = (names: string[], recFields: Record<string, unknown>) => {
    for (const n of names) {
      const id = idByName.get(lower(n))
      const keyById = id ? nameById.get(id) : undefined
      if (keyById && recFields[keyById] !== undefined) return normalizeValue(recFields[keyById])
      if (recFields[n] !== undefined) return normalizeValue(recFields[n])
    }
    const keys = Object.keys(recFields)
    const target = names.map(s => lower(s))
    const k = keys.find(k => target.some(t => lower(k).includes(t)))
    return k ? normalizeValue(recFields[k]) : ''
  }
  const quotes = records.map((r, idx) => ({
    id: idx + 1,
    text: pickName(['内容','语录','text','quote','句子','sentence'], r.fields),
    author: pickName(['作者','author','写作者','来源','source'], r.fields),
    category: pickName(['分类','类别','标签','category','tag','type'], r.fields),
    _rid: r.record_id,
  }))
  return quotes.filter(q => q.text)
}

async function ensureDir(filePath: string) {
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })
}

export async function GET(req: Request) {
  try {
    if (!APP_ID || !APP_SECRET || !APP_TOKEN || !TABLE_ID) {
      return NextResponse.json({ error: 'Missing Feishu env' }, { status: 500 })
    }
    const { searchParams } = new URL(req.url)
    const refresh = searchParams.get('refresh') === '1'

    if (!refresh) {
      try {
        const buf = await fs.readFile(DATA_FILE, 'utf8')
        const json = JSON.parse(buf)
        return NextResponse.json(json, { status: 200, headers: { 'Cache-Control': 'no-store' } })
      } catch {}
    }

    const token = await getTenantAccessToken()
    const fields = await listFields(token)
    const records = await listRecords(token)
    const quotes = toQuotes(records, fields)

    const payload = {
      source: 'feishu-bitable',
      updatedAt: new Date().toISOString(),
      schema: fields,
      records,
      quotes,
    }

    await ensureDir(DATA_FILE)
    await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8')

    return NextResponse.json(payload, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Feishu API error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}