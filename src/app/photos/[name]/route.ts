import { NextRequest } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

function isSafeName(name: string) {
  return /^[A-Za-z0-9._-]+$/.test(name)
}

async function readFileMeta(filePath: string) {
  const stat = await fs.stat(filePath)
  return {
    size: stat.size,
    mtime: stat.mtime.toUTCString(),
  }
}

function contentType(name: string) {
  const ext = path.extname(name).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  return 'image/jpeg'
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await ctx.params
    if (!isSafeName(name)) return new Response('Bad Request', { status: 400 })
    const filePath = path.join(process.cwd(), 'src', 'public', 'photos', name)
    const stat = await fs.stat(filePath).catch(() => null)
    if (!stat || !stat.isFile()) return new Response('Not Found', { status: 404 })
    const data = await fs.readFile(filePath)
    const meta = await readFileMeta(filePath)
    const type = contentType(name)
    const ab = new ArrayBuffer(data.byteLength)
    new Uint8Array(ab).set(data)
    return new Response(ab, {
      status: 200,
      headers: {
        'Content-Type': type,
        'Content-Length': String(meta.size),
        'Last-Modified': meta.mtime,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (e) {
    return new Response('Server Error', { status: 500 })
  }
}

export async function HEAD(req: NextRequest, ctx: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await ctx.params
    if (!isSafeName(name)) return new Response(null, { status: 400 })
    const filePath = path.join(process.cwd(), 'src', 'public', 'photos', name)
    const stat = await fs.stat(filePath).catch(() => null)
    if (!stat || !stat.isFile()) return new Response(null, { status: 404 })
    const meta = await readFileMeta(filePath)
    return new Response(null, {
      status: 200,
      headers: {
        'Content-Type': contentType(name),
        'Content-Length': String(meta.size),
        'Last-Modified': meta.mtime,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (e) {
    return new Response(null, { status: 500 })
  }
}

