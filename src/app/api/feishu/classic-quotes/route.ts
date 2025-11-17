import type { FieldMeta, Payload, RawRecord } from '@appTypes/feishu'
import { ClassicQuotesService } from '@lib/feishu/ClassicQuotesService'
import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

// Env
const APP_ID = process.env.FEISHU_APP_ID as string
const APP_SECRET = process.env.FEISHU_APP_SECRET as string
const APP_TOKEN = process.env.FEISHU_BASE_TOKEN as string // Bitable app/base token
const TABLE_ID = process.env.FEISHU_TABLE_ID as string
const VIEW_ID = process.env.FEISHU_VIEW_ID as string | undefined

const DATA_FILE = path.join(process.cwd(), 'src', 'app', 'tools', 'classic-quotes', 'classic-quotes.json')

const service = new ClassicQuotesService(fetch, APP_ID, APP_SECRET, APP_TOKEN, TABLE_ID, VIEW_ID)

async function listFields(token: string) { return service.listFields(token) }

async function listRecords(token: string) { return service.listRecords(token) }

function toQuotes(records: RawRecord[], fields: FieldMeta[]) { return service.normalize(records, fields) }

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
    const ttlMs = Number(process.env.FEISHU_CACHE_TTL_MINUTES ?? 30) * 60_000
    const ifNoneMatch = req.headers.get('if-none-match') || undefined
    const ifModifiedSince = req.headers.get('if-modified-since') || undefined

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
      } catch { }
    }

    const token = await service.getTenantAccessToken()
    const fields = await listFields(token)
    const records = await listRecords(token)
    const quotes = toQuotes(records, fields)

    const payload: Payload = { source: 'feishu-bitable', updatedAt: new Date().toISOString(), schema: fields, records, quotes, etag: service.hashQuotes(quotes) }

    await ensureDir(DATA_FILE)
    await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8')

    return NextResponse.json(payload, { status: 200, headers: { ETag: payload.etag!, 'Last-Modified': new Date(payload.updatedAt).toUTCString(), 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Feishu API error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
