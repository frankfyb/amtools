'use client'

import { gsap } from 'gsap'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type Quote = { id: number; text: string; author: string; category: string }

const QUOTES: Quote[] = [
  { id: 1, text: '不经一番寒彻骨，怎得梅花扑鼻香。', author: '黄蘖', category: '文学' },
  { id: 2, text: 'Stay hungry, stay foolish.', author: 'Steve Jobs', category: '科技' },
  { id: 3, text: '学而不思则罔，思而不学则殆。', author: '孔子', category: '哲学' },
  { id: 4, text: 'The only limit to our realization of tomorrow is our doubts of today.', author: 'F. D. Roosevelt', category: '励志' },
  { id: 5, text: '君子和而不同，小人同而不和。', author: '孔子', category: '哲学' },
  { id: 6, text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci', category: '设计' },
  { id: 7, text: '路漫漫其修远兮，吾将上下而求索。', author: '屈原', category: '文学' },
  { id: 8, text: 'Failure is simply the opportunity to begin again, this time more intelligently.', author: 'Henry Ford', category: '励志' },
  { id: 9, text: '知止而后有定，定而后能静。', author: '《大学》', category: '哲学' },
  { id: 10, text: 'Good design is as little design as possible.', author: 'Dieter Rams', category: '设计' },
]

export default function ClassicQuotes() {
  const [api, setApi] = useState<'connecting'|'ok'|'error'>('connecting')
  const [loading, setLoading] = useState(false)
  const [slow, setSlow] = useState(false)
  const [err, setErr] = useState<string|null>(null)
  const [q, setQ] = useState<Quote|null>(null)
  const [favIds, setFavIds] = useState<number[]>([])
  const [auto, setAuto] = useState(false)
  const [favView, setFavView] = useState(false)
  const [updatedAt, setUpdatedAt] = useState('')
  const quoteRef = useRef<HTMLDivElement | null>(null)
  const authorRef = useRef<HTMLDivElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const swayRef = useRef<gsap.core.Tween | null>(null)
  const [anim, setAnim] = useState<'fade'|'slide'|'scale'|'type'>('fade')

  useEffect(() => { // 模拟 API 连接
    const t = setTimeout(() => { Math.random() < 0.9 ? setApi('ok') : setApi('error') }, 300)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => { // 读取收藏
    try { const raw = localStorage.getItem('classic_quotes_favs'); if (raw) setFavIds(JSON.parse(raw)) } catch {}
  }, [])
  useEffect(() => { // 保存收藏
    try { localStorage.setItem('classic_quotes_favs', JSON.stringify(favIds)) } catch {}
  }, [favIds])

  const filtered = () => QUOTES

  const fetchQuote = () => {
    setLoading(true); setSlow(false); setErr(null)
    const start = Date.now(); const delay = 300 + Math.random()*2500
    setTimeout(() => {
      if (api === 'error') { setErr('❌ 飞书API连接失败'); setLoading(false); return }
      if (Math.random() < 0.1) { setErr('❌ 语录数据获取失败'); setLoading(false); return }
      const arr = filtered();
      if (!arr.length) { setErr('📭 暂无语录数据，请联系管理员添加'); setLoading(false); return }
      const picked = arr[Math.floor(Math.random()*arr.length)]
      setQ(picked); setUpdatedAt(new Date().toLocaleString()); setLoading(false)
      if (Date.now() - start > 2000) setSlow(true)
    }, delay)
  }

  useEffect(() => { fetchQuote() }, [api])
  useEffect(() => { // 自动更新定时器，类型使用 number 以兼容 DOM
    let t: number | null = null
    if (auto) t = window.setInterval(fetchQuote, 5000)
    return () => {
      if (t !== null) window.clearInterval(t)
    }
  }, [auto, api])
  
  // GSAP 文本动画：在语录或动画模式变化时触发
  useEffect(() => {
    if (!q) return
    const el = quoteRef.current
    const au = authorRef.current
    if (!el) return
    gsap.killTweensOf(el)
    gsap.killTweensOf(au)
    const base = { duration: 0.6, ease: 'power2.out' }
    switch (anim) {
      case 'fade':
        gsap.fromTo(el, { opacity: 0 }, { opacity: 1, ...base })
        gsap.fromTo(au, { opacity: 0 }, { opacity: 1, duration: 0.4 })
        break
      case 'slide':
        gsap.fromTo(el, { y: 20, opacity: 0 }, { y: 0, opacity: 1, ...base })
        gsap.fromTo(au, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 })
        break
      case 'scale':
        gsap.fromTo(el, { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, ...base })
        gsap.fromTo(au, { scale: 0.98, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4 })
        break
      case 'type':
        const text = q.text
        let i = 0
        const step = () => {
          if (!quoteRef.current) return
          quoteRef.current.textContent = text.slice(0, i)
          i++
          if (i <= text.length) requestAnimationFrame(step)
        }
        if (quoteRef.current) quoteRef.current.textContent = ''
        requestAnimationFrame(step)
        gsap.fromTo(au, { opacity: 0 }, { opacity: 1, duration: 0.4 })
        break
    }
  }, [q, anim])
  const toggleFav = () => { if (!q) return; setFavIds(p => p.includes(q.id) ? p.filter(i => i !== q.id) : [...p, q.id]) }
  const retryApi = () => { setApi('connecting'); setTimeout(() => { Math.random() < 0.95 ? setApi('ok') : setApi('error') }, 500) }

  const favList = QUOTES.filter(x => favIds.includes(x.id))

  // 卡片容器 GSAP 动画：平滑左右摇摆 + 切换淡入
  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    // 启动或维持左右摇摆（无限循环）
    if (!swayRef.current) {
      swayRef.current = gsap.to(el, {
        x: 6, // 摇摆幅度适中
        duration: 1.6, // 合理的持续时间
        ease: 'sine.inOut', // 流畅自然
        yoyo: true,
        repeat: -1,
      })
    }

    // 切换时淡入（不会影响摇摆主动画）
    gsap.fromTo(el, { opacity: 0.92 }, { opacity: 1, duration: 0.6, ease: 'power2.out' })

    return () => {
      // 页面卸载时清理摇摆动画
      if (swayRef.current) { swayRef.current.kill(); swayRef.current = null }
    }
  }, [q, loading])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 顶部导航 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-[50px] md:h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">← 返回首页</Link>
            <span className="text-xl font-semibold text-gray-900">经典语录</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setFavView(v => !v)} className="px-3 py-1 rounded-lg border text-gray-600 hover:bg-gray-100">我的收藏</button>
          </div>
        </div>
      </div>

      {/* 中间内容区 */}
      <div className="max-w-4xl mx-auto px-4 py-8 pb-[72px]" aria-live="polite">
        {!favView && (
          <div ref={cardRef} className="bg-white rounded-[12px] border border-gray-200 shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out hover:-translate-y-[5px] p-[50px] max-w-[600px] mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] md:text-[20px] font-semibold text-[#2563eb]">飞书语录精选</h2>
            </div>

            {loading && (
              <div className="text-center text-[#94a3b8]">
                <div className="text-2xl inline-block animate-[wobble_1.2s_ease-in-out_infinite]">📜 语录加载中...</div>
                {slow && <div className="mt-2 text-sm">加载较慢，建议检查网络</div>}
              </div>
            )}

            {!loading && err && (
              <div className="text-center">
                <div className={err.includes('暂无语录') ? 'text-[#718096] text-lg mb-2' : 'text-red-600 text-lg mb-2'}>{err}</div>
                {err.includes('API') && <div className="text-slate-500 mb-2">请检查网络或授权信息</div>}
                <button onClick={err.includes('API')? retryApi : fetchQuote} className="px-4 py-2 rounded-lg bg-gray-900 text-white">重试</button>
              </div>
            )}

            {!loading && !err && q && (
              <div className="space-y-4">
                <div ref={quoteRef} className="text-[24px] leading-[1.8] text-[#2d3748] text-center mb-[30px]">
                  “{q.text}”
                </div>
                <div ref={authorRef} className="text-right text-[#718096] text-[18px] font-light mb-[30px]">—— {q.author}</div>
                <div className="flex justify-center gap-4 md:gap-6 mt-4">
                  <button onClick={fetchQuote} className="h-10 px-5 rounded-lg bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors shadow-sm">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block w-[18px] h-[18px] rounded-full border-2 border-white" />
                      换一条
                    </span>
                  </button>
                  <button onClick={() => { setApi('connecting'); setTimeout(() => setApi('ok'), 1000) }} className="h-10 px-5 rounded-lg bg-[#f3f4f6] text-gray-700 hover:bg-[#e5e7eb] transition-colors">刷新最新</button>
                  <button onClick={toggleFav} aria-label="收藏" className="h-10 w-10 rounded-full text-[#94a3b8] hover:text-[#f59e0b] transition-transform hover:scale-110">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 mx-auto" fill="currentColor">
                      <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {favView && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">我的收藏</h2>
              <button onClick={() => setFavIds([])} className="px-3 py-1 rounded-lg border hover:bg-gray-100">清空收藏</button>
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

      {/* 底部信息栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-[50px] md:h-[60px] flex items-center">
          <div className="hidden md:block text-sm text-gray-700">API连接状态：{api==='ok'?'正常':api==='connecting'?'连接中':'错误'}</div>
          <div className="md:hidden mx-auto text-sm text-gray-700">API状态：{api==='ok'?'正常':api==='connecting'?'连接中':'错误'} · 更新时间：{updatedAt || '—'}</div>
          <div className="hidden md:block mx-auto text-sm text-gray-700">更新时间：{updatedAt || '—'}</div>
          <div className="hidden md:block text-sm text-gray-400">© 2025</div>
        </div>
      </div>
      <style jsx>{`
        @keyframes wobble {
          0% { transform: translateX(0) }
          25% { transform: translateX(-3px) }
          50% { transform: translateX(3px) }
          75% { transform: translateX(-3px) }
          100% { transform: translateX(0) }
        }
      `}</style>
    </div>
  )
}