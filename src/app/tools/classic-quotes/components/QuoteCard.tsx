"use client"
import { gsap } from 'gsap'
import type { FC } from 'react'
import { useEffect, useRef } from 'react'

type Quote = { id: number; text: string; author: string; category: string }

export const QuoteCard: FC<{
  q: Quote | null
  loading: boolean
  slow: boolean
  err: string | null
  onRetry: () => void
  onFetch: () => void
  onRefreshLatest: () => void
  onToggleFav: () => void
  isFav: boolean
  anim: 'fade'|'slide'|'scale'|'type'
}> = ({ q, loading, slow, err, onRetry, onFetch, onRefreshLatest, onToggleFav, isFav, anim }) => {
  const quoteRef = useRef<HTMLDivElement | null>(null)
  const authorRef = useRef<HTMLDivElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const swayRef = useRef<gsap.core.Tween | null>(null)

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

  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    // 启动或维持左右摇摆（无限循环）；在页面不可见时暂停节省资源
    const onVisibility = () => {
      const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden'
      if (hidden) {
        if (swayRef.current) swayRef.current.pause()
      } else {
        if (!swayRef.current) {
          swayRef.current = gsap.to(el, { x: 6, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1 })
        } else {
          swayRef.current.resume()
        }
      }
    }
    onVisibility()
    const handler = () => onVisibility()
    document.addEventListener('visibilitychange', handler)
    // 切换时淡入（不会影响摇摆主动画）
    gsap.fromTo(el, { opacity: 0.92 }, { opacity: 1, duration: 0.6, ease: 'power2.out' })
    return () => {
      document.removeEventListener('visibilitychange', handler)
      if (swayRef.current) { swayRef.current.kill(); swayRef.current = null }
    }
  }, [q, loading])

  return (
    <div ref={cardRef} className="bg-white rounded-[12px] border border-gray-200 shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out hover:-translate-y-[5px] p-[50px] max-w-[600px] mx-auto">
      {loading && (
        <div className="text-center text-[#94a3b8]">
          <div className="text-2xl inline-block animate-[wobble_1.2s_ease-in-out_infinite]" aria-live="polite">📜 语录加载中...</div>
          {slow && <div className="mt-2 text-sm">加载较慢，建议检查网络</div>}
        </div>
      )}

      {!loading && err && (
        <div className="text-center" role="alert">
          <div className={err.includes('暂无语录') ? 'text-[#718096] text-lg mb-2' : 'text-red-600 text-lg mb-2'}>{err}</div>
          {err.includes('API') && <div className="text-slate-500 mb-2">请检查网络或授权信息</div>}
          <button onClick={onRetry} className="px-4 py-2 rounded-lg bg-gray-900 text-white focus-visible:ring-2 ring-gray-300 cursor-pointer">重试</button>
        </div>
      )}

      {!loading && !err && q && (
        <div className="space-y-4">
          <div ref={quoteRef} className="text-[24px] leading-[1.8] text-[#2d3748] text-center mb-[30px]">“{q.text}”</div>
          <div ref={authorRef} className="text-right text-[#718096] text-[18px] font-light mb-[30px]">—— {q.author}</div>
          <div className="flex justify-center gap-4 md:gap-6 mt-4">
            <button onClick={onFetch} className="w-[140px] h-[40px] rounded-[8px] bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors shadow-sm focus-visible:ring-2 ring-gray-300 cursor-pointer" aria-label="换一条">
              <span className="inline-flex items-center gap-[8px]">
                <span className="inline-block w-[18px] h-[18px] rounded-full border-2 border-white" />
                换一条
              </span>
            </button>
            <button onClick={onRefreshLatest} className="w-[140px] h-[40px] rounded-[8px] bg-[#f3f4f6] text-[#4b5563] hover:bg-[#e5e7eb] transition-colors focus-visible:ring-2 ring-gray-300 cursor-pointer" aria-label="刷新最新">刷新最新</button>
            <button onClick={onToggleFav} aria-label={isFav ? '取消收藏' : '收藏'} className={`${isFav ? 'text-[#f59e0b]' : 'text-[#94a3b8]'} h-10 w-10 rounded-full transition-transform hover:scale-110 focus-visible:ring-2 ring-gray-300 cursor-pointer`}>
              <svg viewBox="0 0 24 24" className="w-5 h-5 mx-auto" fill="currentColor">
                <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}