import { useEffect, useRef, useState, useCallback } from 'react'

type Quote = { id: number; text: string; author: string; category: string }

export function useFeishuQuotes(opts: { ttlMin?: number } = {}) {
  const { ttlMin = 30 } = opts
  const [status, setStatus] = useState<'idle'|'connecting'|'ok'|'error'>('idle')
  const [quotes, setQuotes] = useState<Quote[] | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string>('')
  const inflightRef = useRef(false)

  const mapQuotes = useCallback((list: Array<Record<string, unknown>>): Quote[] => (
    list.map((it, i) => ({
      id: typeof it.id === 'number' ? it.id : (typeof it.id === 'string' ? Number(it.id) || i + 1 : i + 1),
      text: String(it.text ?? ''),
      author: String(it.author ?? ''),
      category: String(it.category ?? ''),
    })).filter(q => q.text.length > 0)
  ), [])

  const fetchFeishu = useCallback(async (forceRefresh = false) => {
    try {
      setStatus('connecting')
      if (inflightRef.current) return
      inflightRef.current = true
      const url = `/api/feishu/classic-quotes${forceRefresh ? '?refresh=1' : ''}`
      const resp = await fetch(url, { cache: 'no-store' })
      const data = await resp.json()
      if (!resp.ok || (data && data.error)) throw new Error((data && data.error) || 'Feishu API error')
      const list = Array.isArray(data.quotes) ? (data.quotes as Array<Record<string, unknown>>) : []
      const mapped = mapQuotes(list)
      setQuotes(mapped)
      setUpdatedAt(new Date().toLocaleString())
      setStatus('ok')
    } catch (e) {
      setStatus('error')
    }
    finally { inflightRef.current = false }
  }, [mapQuotes])

  useEffect(() => { // 初始拉取
    fetchFeishu(false)
  }, [fetchFeishu])

  useEffect(() => { // 轻量后台刷新（TTL）
    const t = window.setInterval(() => fetchFeishu(false), Math.max(60000, ttlMin * 60 * 1000))
    return () => window.clearInterval(t)
  }, [fetchFeishu, ttlMin])

  return { status, quotes, updatedAt, refresh: () => fetchFeishu(true) }
}