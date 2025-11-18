'use client'

import type { Payload, Quote } from '@appTypes/feishu'
import { useCallback, useEffect, useMemo, useState } from 'react'
import payload from './classic-quotes.json' assert { type: 'json' }
import { QuoteCard } from './components/QuoteCard'
import { StatusBar } from './components/StatusBar'
import { Toolbar } from './components/Toolbar'
import { useFavorites } from './hooks/useFavorites'
import { useFeishuQuotes } from './hooks/useFeishuQuotes'

export default function ClassicQuotes() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [slow, setSlow] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [q, setQ] = useState<Quote | null>(null)
  const { favIds, toggle, clear } = useFavorites()
  const [auto, setAuto] = useState(false)
  const [favView, setFavView] = useState(false)
  const [updatedAt, setUpdatedAt] = useState('')
  const [anim, setAnim] = useState<'fade' | 'slide' | 'scale' | 'type'>('fade')

  const { status, quotes, updatedAt: updatedAtFeishu, refresh } = useFeishuQuotes({ ttlMin: 30 })
  const api: 'connecting' | 'ok' | 'error' = status === 'error' ? 'error' : (status === 'connecting' ? 'connecting' : 'ok')
  useEffect(() => { setUpdatedAt(prev => updatedAtFeishu || prev) }, [updatedAtFeishu])
  useEffect(() => { setMounted(true) }, [])

  const fallbackQuotes: Quote[] = useMemo(() => {
    const list = Array.isArray((payload as unknown as Payload).quotes) ? (payload as unknown as Payload).quotes : []
    return list.map((it, i): Quote => ({
      id: typeof it.id === 'number' ? it.id : (typeof it.id === 'string' ? Number(it.id) || i + 1 : i + 1),
      text: String(it.text ?? ''),
      author: String(it.author ?? ''),
      category: String(it.category ?? ''),
    })).filter(q => q.text.length > 0)
  }, [])

  const filtered = useMemo(() => (quotes && quotes.length ? quotes : fallbackQuotes), [quotes, fallbackQuotes])

  const fetchQuote = useCallback(() => {
    setLoading(true); setSlow(false); setErr(null)
    const start = Date.now(); const delay = 300 + Math.random() * 2500
    window.setTimeout(() => {
      if (Math.random() < 0.1) { setErr('❌ 语录数据获取失败'); setLoading(false); return }
      const arr = filtered
      if (!arr.length) { setErr('📭 暂无语录数据，请联系管理员添加'); setLoading(false); return }
      const picked = arr[Math.floor(Math.random() * arr.length)]
      setQ(picked); setUpdatedAt(new Date().toLocaleString()); setLoading(false)
      if (Date.now() - start > 2000) setSlow(true)
    }, delay)
  }, [filtered])

  useEffect(() => { if (api === 'ok') fetchQuote() }, [api, fetchQuote])
  useEffect(() => {
    let t: number | null = null
    if (auto) t = window.setInterval(fetchQuote, 5000)
    return () => { if (t !== null) window.clearInterval(t) }
  }, [auto, api, fetchQuote])

  const toggleFav = () => { if (!q) return; toggle(q.id) }
  const favList = useMemo(() => filtered.filter(x => favIds.includes(x.id)), [filtered, favIds])

  const onRetry = () => { fetchQuote() }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Toolbar onToggleFavView={() => setFavView(v => !v)} />

      <div className="max-w-4xl mx-auto px-4 pt-[80px] pb-[60px]" aria-live="polite">
        <div className="flex items-center justify-center gap-3 mb-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="accent-blue-600" checked={auto} onChange={e => setAuto(e.target.checked)} />
            自动播放
          </label>
          <select value={anim} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAnim(e.target.value as 'fade' | 'slide' | 'scale' | 'type')} className="border rounded-md px-2 py-1 text-sm text-gray-700">
            <option value="fade">淡入</option>
            <option value="slide">滑入</option>
            <option value="scale">缩放</option>
            <option value="type">打字</option>
          </select>
        </div>

        {!mounted ? (
          <div className="bg-white rounded-[12px] border border-gray-200 shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-[50px] max-w-[600px] mx-auto text-center text-[#94a3b8]">
            <div className="text-2xl inline-block animate-[wobble_1.2s_ease-in-out_infinite]">📜 语录加载中...</div>
          </div>
        ) : !favView && (
          <QuoteCard
            q={q}
            loading={loading}
            slow={slow}
            err={err}
            onRetry={onRetry}
            onFetch={fetchQuote}
            onRefreshLatest={() => { void refresh().then(() => fetchQuote()) }}
            onToggleFav={toggleFav}
            isFav={!!(q && favIds.includes(q.id))}
            anim={anim}
          />
        )}

        {favView && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">我的收藏</h2>
              <button onClick={() => clear()} className="px-3 py-1 rounded-lg border hover:bg-gray-100">清空收藏</button>
            </div>
            {favList.length === 0 ? (
              <div className="text-center text-slate-500">📭 暂无收藏</div>
            ) : (
              <div className="space-y-3">
                {favList.map(item => (
                  <div key={item.id} className="border rounded-lg p-3">
                    <div className="text-gray-900">{item.text}</div>
                    <div className="text-right text-gray-500">— {item.author}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <StatusBar status={api} updatedAt={updatedAt} />
    </div>
  )
}