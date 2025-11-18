import type { FieldMeta, Payload, Quote, RawRecord } from '@appTypes/feishu'
import { ClassicQuotesService } from '@lib/feishu/ClassicQuotesService'
import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

// Types


// Env：飞书应用认证与表格标识（从 .env/.env.local 注入）
const APP_ID = process.env.FEISHU_APP_ID as string
const APP_SECRET = process.env.FEISHU_APP_SECRET as string
const APP_TOKEN = process.env.FEISHU_BASE_TOKEN as string // Bitable app/base token（多维表格应用 Token）
const TABLE_ID = process.env.FEISHU_TABLE_ID as string // 表格 ID（table_id）
const VIEW_ID = process.env.FEISHU_VIEW_ID as string | undefined // 视图 ID（可选）

// 缓存位置：写入到 .next/cache，避免写入源码目录；并声明 Node 运行时与动态响应
const CACHE_DIR = path.join(process.env.TMPDIR ?? '/tmp', 'feishu')
const DATA_FILE = path.join(CACHE_DIR, 'classic-quotes.json')
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// 服务层：封装飞书认证与数据归一化逻辑
const service = new ClassicQuotesService(fetch, APP_ID, APP_SECRET, APP_TOKEN, TABLE_ID, VIEW_ID)

// 列出字段元数据（字段名/类型等）
async function listFields(token: string) { return service.listFields(token) }

// 列出记录数据（分页拉取所有记录）
async function listRecords(token: string) { return service.listRecords(token) }

// 将飞书记录归一化为统一的 Quote[]（使用服务层的 normalize）
function toQuotes(records: RawRecord[], fields: FieldMeta[]): Quote[] {
  return service.normalize(records, fields)
}

// 确保缓存文件目录存在（递归创建）
async function ensureDir(filePath: string) {
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })
}

// GET 接口：
// 1) 先尝试读取本地缓存并依据 TTL 与条件请求头（ETag / Last-Modified）返回
// 2) 缓存过期或显式 refresh 时，调用飞书接口拉取最新数据并更新缓存
// 3) 始终返回标准化后的 Payload JSON
export async function GET(req: Request) {
  try {
    // 环境变量校验：缺失则返回 500 错误
    if (!APP_ID || !APP_SECRET || !APP_TOKEN || !TABLE_ID) {
      return NextResponse.json({ error: 'Missing Feishu env' }, { status: 500 })
    }
    const { searchParams } = new URL(req.url)
    const refresh = searchParams.get('refresh') === '1' // 强制刷新（跳过缓存）
    const ttlMs = Number(process.env.FEISHU_CACHE_TTL_MINUTES ?? 30) * 60_000 // 缓存 TTL（分钟）
    const ifNoneMatch = req.headers.get('if-none-match') || undefined // 条件请求：ETag
    const ifModifiedSince = req.headers.get('if-modified-since') || undefined // 条件请求：Last-Modified

    // 读取缓存：命中且未过期时直接返回（并支持 304 条件响应）
    if (!refresh) {
      try {
        const buf = await fs.readFile(DATA_FILE, 'utf8')
        const json: Payload = JSON.parse(buf)
        const updated = Date.parse(json.updatedAt)
        const etag = json.etag || service.hashQuotes(json.quotes)
        const fresh = Number.isFinite(updated) && (Date.now() - updated) < ttlMs
        if (fresh) {
          if ((ifNoneMatch && ifNoneMatch === etag) || (ifModifiedSince && Number.isFinite(updated) && updated <= Date.parse(ifModifiedSince))) {
            return new NextResponse(null, { status: 304, headers: { ETag: etag, 'Last-Modified': new Date(updated).toUTCString(), 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } })
          }
          return NextResponse.json(json, { status: 200, headers: { ETag: etag, 'Last-Modified': new Date(updated).toUTCString(), 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } })
        }
      } catch {
        // 缓存读取失败忽略
      }
    }

    // 回源飞书接口：拉取最新字段与记录，并归一化为 Quote[]
    const token = await service.getTenantAccessToken()
    const fields = await listFields(token)
    const records = await listRecords(token)
    const quotes = toQuotes(records, fields)

    // 构造响应载荷，并写入缓存以便后续命中；返回 200 JSON
    const payload: Payload = { source: 'feishu-bitable', updatedAt: new Date().toISOString(), schema: fields, records, quotes, etag: service.hashQuotes(quotes) }

    try {
      await ensureDir(DATA_FILE)
      await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8')
    } catch {}

    return NextResponse.json(payload, { status: 200, headers: { ETag: payload.etag!, 'Last-Modified': new Date(payload.updatedAt).toUTCString(), 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } })
  } catch (err: unknown) {
    // 错误兜底：返回统一错误 JSON，便于前端识别
    const msg = err instanceof Error ? err.message : 'Feishu API error'
    return NextResponse.json({ error: msg }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
