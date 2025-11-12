"use client"

import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TextPlugin } from 'gsap/TextPlugin'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

gsap.registerPlugin(ScrollTrigger, TextPlugin, MotionPathPlugin)

function spawnParticles(container: HTMLElement, x: number, y: number, type: 'heart' | 'leaf' = 'heart') {
  const colors = type === 'heart'
    ? ['#ff6b6b', '#ff8fa3', '#ff4757']
    : ['#d97706', '#b45309', '#f59e0b']
  const symbol = type === 'heart' ? '❤' : '🍁'
  for (let i = 0; i < 10; i++) {
    const span = document.createElement('span')
    span.textContent = symbol
    span.style.position = 'absolute'
    span.style.left = `${x}px`
    span.style.top = `${y}px`
    span.style.pointerEvents = 'none'
    span.style.fontSize = `${12 + Math.random() * 16}px`
    span.style.color = colors[Math.floor(Math.random() * colors.length)]
    container.appendChild(span)
    const dx = (Math.random() - 0.5) * 120
    const dy = -60 - Math.random() * 120
    gsap.to(span, {
      x: dx,
      y: dy,
      rotation: (Math.random() - 0.5) * 120,
      opacity: 0,
      duration: 1.2 + Math.random() * 0.8,
      ease: 'power2.out',
      onComplete: () => span.remove(),
    })
  }
}

export default function AutumnMy() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const sec1Ref = useRef<HTMLDivElement | null>(null)
  const sec2Ref = useRef<HTMLDivElement | null>(null)
  const sec3Ref = useRef<HTMLDivElement | null>(null)
  const sec4Ref = useRef<HTMLDivElement | null>(null)
  const sec5Ref = useRef<HTMLDivElement | null>(null)
  const sec6Ref = useRef<HTMLDivElement | null>(null)
  const sec2TextRef = useRef<HTMLDivElement | null>(null)
  const sec2ImgRef = useRef<HTMLDivElement | null>(null)
  const sec1HeartRef = useRef<HTMLSpanElement | null>(null)
  const [liked, setLiked] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const filmTLRef = useRef<gsap.core.Timeline | null>(null)
  const fallRefs = useRef<Array<HTMLDivElement | null>>([])
  const leafRefs = useRef<Array<HTMLSpanElement | null>>([])
  const filmStripRef = useRef<HTMLDivElement | null>(null)

  const photos = [
    '/photos/DSC01557.JPG',
    '/photos/DSC01545.JPG',
    '/photos/DSC01541.JPG',
    '/photos/DSC01537.JPG',
    '/photos/DSC01488.JPG',
    '/photos/DSC01481.JPG',
    '/photos/DSC01471.JPG',
    '/photos/DSC01470.JPG',
    '/photos/DSC01469.JPG',
    '/photos/DSC01468.JPG',
    '/photos/DSC01528.JPG',
  ]

  useEffect(() => {
    if (sec1Ref.current) {
      ScrollTrigger.create({
        trigger: sec1Ref.current,
        start: 'top 90%'
      })
      ScrollTrigger.create({
        trigger: sec1Ref.current,
        start: 'top 80%',
        onEnter: () => {
          const rect = sec1Ref.current!.getBoundingClientRect()
          spawnParticles(sec1Ref.current!, rect.width / 2, rect.height * 0.7, 'leaf')
          if (sec1HeartRef.current) {
            gsap.fromTo(sec1HeartRef.current, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.6)' })
          }
        },
        onLeaveBack: () => {
          if (sec1HeartRef.current) gsap.to(sec1HeartRef.current, { opacity: 0, scale: 0.6, duration: 0.4 })
        }
      })
    }

    if (sec2Ref.current) {
      ScrollTrigger.create({
        trigger: sec2Ref.current,
        start: 'top 80%',
        toggleActions: 'play reverse play reverse',
        onEnter: () => {
          if (sec2TextRef.current) {
            gsap.set(sec2TextRef.current, { text: '' })
            gsap.to(sec2TextRef.current, { duration: 6.0, text: '那天的风带着桂花香，你穿米白色毛衣，站在枫叶堆前笑的时候，我突然觉得——秋天就该是这个样子。', ease: 'none' })
          }
          if (sec2ImgRef.current) {
            gsap.fromTo(sec2ImgRef.current, { opacity: 0, filter: 'blur(6px)', scale: 0.96 }, { opacity: 1, filter: 'blur(0px)', scale: 1, duration: 1.2, ease: 'power2.out' })
          }
        },
        onLeaveBack: () => {
          if (sec2TextRef.current) gsap.set(sec2TextRef.current, { text: '' })
          if (sec2ImgRef.current) gsap.to(sec2ImgRef.current, { opacity: 0, filter: 'blur(6px)', duration: 0.6 })
        }
      })
    }

    if (sec3Ref.current) {
      ScrollTrigger.create({
        trigger: sec3Ref.current,
        start: 'top 85%',
        onEnter: () => {
          const tiles = sec3Ref.current!.querySelectorAll('.film-tile')
          gsap.from(sec3Ref.current!, { scale: 0.95, opacity: 0, duration: 1.0, ease: 'power2.out' })
          tiles.forEach((t, i) => gsap.from(t, { opacity: 0, y: 24, duration: 0.6, delay: 0.2 + i * 0.12, ease: 'power2.out' }))
          const thumbs = sec3Ref.current!.querySelectorAll('.thumb')
          thumbs.forEach((th, i) => gsap.to(th, { rotate: 360, duration: 5 + i, repeat: -1, ease: 'none' }))
        },
        onLeaveBack: () => {
          gsap.to(sec3Ref.current!, { opacity: 0.6, scale: 0.98, duration: 0.5 })
        }
      })
    }

    if (sec4Ref.current) {
      const lines = sec4Ref.current.querySelectorAll('.poem-line')
      lines.forEach((el, i) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el as Element, start: 'top 90%', toggleActions: 'play reverse play reverse' },
          opacity: 0,
          y: -20,
          duration: 0.8,
          delay: i * 0.3,
          ease: 'power2.out'
        })
      })
      ScrollTrigger.create({
        trigger: sec4Ref.current,
        start: 'top 85%',
        onEnter: () => {
          const rect = sec4Ref.current!.getBoundingClientRect()
          spawnParticles(sec4Ref.current!, rect.width * 0.5, rect.height * 0.3, 'heart')
        }
      })
    }

    if (sec5Ref.current) {
      ScrollTrigger.create({
        trigger: sec5Ref.current,
        start: 'top 85%',
        onEnter: () => {
          if (filmTLRef.current) filmTLRef.current.kill()
          const root = sec5Ref.current!
          const rootRect = root.getBoundingClientRect()
          const filmRect = filmStripRef.current?.getBoundingClientRect()
          const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

          const tiles = fallRefs.current.filter(Boolean) as HTMLDivElement[]
          const leaves = leafRefs.current.filter(Boolean) as HTMLSpanElement[]
          tiles.forEach((t, i) => {
            gsap.set(t, { x: 0, y: -120, scale: 0.9, opacity: 0, willChange: 'transform' })
            gsap.set(leaves[i], { x: 0, y: -120, opacity: 0.8, rotate: -20 })
          })

          const tl = gsap.timeline({ defaults: { ease: 'power1.out' } })
          tiles.forEach((tile, i) => {
            const startX = (rootRect.width * 0.15) + Math.random() * (rootRect.width * 0.7)
            const drift1 = (-40 + Math.random() * 80)
            const drift2 = (-40 + Math.random() * 80)
            const path = [
              { x: startX, y: -120 },
              { x: startX + drift1, y: rootRect.height * 0.25 },
              { x: startX + drift2, y: rootRect.height * 0.55 },
              { x: rootRect.width * 0.5, y: rootRect.height * 0.72 },
            ]

            tl.to(tile, {
              duration: prefersReduced ? 0.01 : 1.8 + Math.random() * 0.8,
              opacity: 1,
              motionPath: { path, curviness: 1.25 },
              rotate: -4 + Math.random() * 8,
              force3D: true,
            }, i * 0.15)

            tl.to(leaves[i], {
              duration: prefersReduced ? 0.01 : 1.8 + Math.random() * 0.8,
              motionPath: { path, curviness: 1.25 },
              rotate: 30 + Math.random() * 40,
              ease: 'sine.inOut',
              force3D: true,
            }, i * 0.15)

            const cx = rootRect.width * 0.5
            const cy = rootRect.height * 0.5
            tl.to(tile, {
              duration: prefersReduced ? 0.01 : 0.8,
              x: cx - 60 + i * 6,
              y: cy - 40 + i * 4,
              scale: 0.95,
              zIndex: 10 + i,
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            }, '>-0.2')
          })

          if (filmRect) {
            const cols = 4
            const rows = 2
            const cellW = filmRect.width / cols
            const cellH = filmRect.height / rows
            tiles.forEach((tile, i) => {
              const col = i % cols
              const row = Math.floor(i / cols)
              const tx = (filmRect.left - rootRect.left) + cellW * (col + 0.5) - 80
              const ty = (filmRect.top - rootRect.top) + cellH * (row + 0.5) - 56
              tl.to(tile, {
                duration: prefersReduced ? 0.01 : 0.9,
                x: tx,
                y: ty,
                scale: 1,
                rotate: 0,
                zIndex: 30 + i,
              }, '+=0.2')
            })
            tl.to(filmStripRef.current, { opacity: 1, duration: 0.6 }, '>-0.4')
          }

          filmTLRef.current = tl
        },
        onLeaveBack: () => {
          filmTLRef.current?.kill()
          const tiles = fallRefs.current.filter(Boolean) as HTMLDivElement[]
          const leaves = leafRefs.current.filter(Boolean) as HTMLSpanElement[]
          tiles.forEach(t => gsap.set(t, { x: 0, y: -120, opacity: 0 }))
          leaves.forEach(l => gsap.set(l, { x: 0, y: -120, opacity: 0 }))
          if (filmStripRef.current) gsap.set(filmStripRef.current, { opacity: 0 })
        }
      })
    }

    if (sec6Ref.current) {
      ScrollTrigger.create({
        trigger: sec6Ref.current,
        start: 'top 85%'
      })
    }
  }, [])

  return (
    <div ref={rootRef} className="min-h-screen text-rose-900">
      <section ref={sec1Ref} className="h-screen w-full relative overflow-hidden">
        <Image src="/photos/DSC01528.JPG" alt="autumn" fill sizes="100vw" className="object-cover" priority unoptimized />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-amber-300 text-base tracking-wide">2025·秋</div>
          <div className="mt-2 text-5xl sm:text-6xl lg:text-7xl font-extrabold text-amber-100">我的秋天</div>
          <div className="mt-2 text-4xl sm:text-5xl text-rose-400 flex items-center gap-2">
            <span>是你</span>
            <span ref={sec1HeartRef} className="text-rose-500">❤</span>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/90">↓</div>
        <div className="absolute left-1/4 top-12 text-2xl">🍁</div>
        <div className="absolute left-2/3 top-24 text-xl">🍁</div>
        <div className="absolute right-1/4 top-10 text-3xl">🍁</div>
      </section>

      <section ref={sec2Ref} className="h-screen w-full grid md:grid-cols-2 gap-8 items-center px-6 bg-gradient-to-r from-[#FF9F43] to-[#FDCB6E]">
        <div className="order-2 md:order-1">
          <div className="text-2xl text-red-600 mb-3">初见</div>
          <div className="text-xl sm:text-2xl flex items-baseline">
            <div ref={sec2TextRef} className="font-medium text-rose-900" />
            <span className="ml-2 text-red-500">|</span>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <div
            ref={sec2ImgRef}
            className="group relative h-64 sm:h-80 lg:h-96 rounded-3xl overflow-hidden shadow-xl"
          >
            <div
              className="absolute inset-0"
              style={{ clipPath: 'polygon(50% 10%, 65% 25%, 80% 40%, 85% 60%, 75% 75%, 50% 90%, 25% 75%, 15% 60%, 20% 40%, 35% 25%)' }}
            >
              <Image src={photos[2]} alt="park" fill sizes="(max-width:768px) 90vw, 50vw" className="object-cover scale-110" unoptimized />
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-200/40 via-amber-200/30 to-orange-200/30 mix-blend-multiply" />
            <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-105" />
          </div>
        </div>
      </section>


      <section ref={sec4Ref} className="h-screen w-full relative flex items-center justify-center bg-[#F8F4E9]">
        <div className="absolute inset-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="absolute" style={{ left: `${10 + i * 10}%`, top: `${20 + (i % 5) * 12}%`, opacity: 0.25, fontSize: 12 + (i % 4) * 4 }}>
              ❤
            </div>
          ))}
        </div>
        <div className="flex gap-8">
          <div className="poem-line text-red-600 text-xl" style={{ writingMode: 'vertical-rl' }}>
            枫叶落了又落
          </div>
          <div className="poem-line text-red-600 text-xl" style={{ writingMode: 'vertical-rl' }}>
            桂香散了又来
          </div>
          <div className="poem-line text-red-600 text-xl" style={{ writingMode: 'vertical-rl' }}>
            我见过无数个秋天的样子
          </div>
          <div className="poem-line text-red-600 text-xl" style={{ writingMode: 'vertical-rl' }}>
            直到遇见你才明白
          </div>
          <div className="poem-line text-red-600 text-xl" style={{ writingMode: 'vertical-rl' }}>
            我的秋天不是风不是叶
          </div>
          <div className="poem-line text-red-600 text-xl" style={{ writingMode: 'vertical-rl' }}>
            是你笑起来时眼里的光
          </div>
        </div>
        <div className="absolute bottom-10 flex gap-4 text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(45deg, #FF9F43, #E74C3C)' }}>
          <span className="floating">秋天</span>
          <span className="floating">你</span>
          <span className="floating">桂香</span>
          <span className="floating">笑</span>
        </div>
        <div className="absolute bottom-6 text-red-600">❤</div>
      </section>

      <section ref={sec5Ref} className="h-screen w-full relative overflow-hidden bg-gradient-to-b from-[#222222] to-[#0d0d0d]">
        <div className="absolute inset-0">
          {photos.slice(0, 8).map((src, i) => (
            <div key={i} className="absolute" style={{ left: 0, top: 0 }}>
              <span ref={el => { leafRefs.current[i] = el }} className="absolute select-none" style={{ fontSize: 18 + (i % 3) * 4 }}>
                🍁
              </span>
              <div
                ref={el => { fallRefs.current[i] = el }}
                className="relative w-36 h-24 sm:w-40 sm:h-28 lg:w-48 lg:h-32 rounded-md overflow-hidden shadow-xl"
                style={{ backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
              />
            </div>
          ))}
        </div>
        <div ref={filmStripRef} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[78vw] max-w-4xl h-[44vh] opacity-0">
          <div className="absolute inset-0 bg-neutral-900/80 rounded-xl shadow-2xl" />
          <div className="absolute inset-x-6 top-3 flex gap-2">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="w-3 h-3 rounded-full bg-neutral-700" />
            ))}
          </div>
          <div className="absolute inset-x-6 bottom-3 flex gap-2">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="w-3 h-3 rounded-full bg-neutral-700" />
            ))}
          </div>
          <div className="absolute inset-6 border-2 border-black/80 rounded-lg" />
        </div>
      </section>

      <section ref={sec6Ref} className="h-screen w-full bg-white flex flex-col items-center justify-center px-6">
        <div className="flex gap-3 mb-6">
          <span className="text-[16px]" style={{ color: '#FF9F43' }}>🍁</span>
          <span className="text-[16px]" style={{ color: '#E74C3C' }}>🍁</span>
          <span className="text-[16px]" style={{ color: '#FDCB6E' }}>🍁</span>
        </div>
        <div className="text-red-600 text-2xl mb-2">致我的秋天</div>
        <div className="text-neutral-800 text-base max-w-2xl text-center">
          这个秋天，因为有你而完整。下一个秋天，也想和你一起看枫叶、闻桂香、吃烤红薯——不止秋天，每个季节都想有你。
        </div>
        <div className="mt-8 flex items-center gap-6">
          <button
            aria-label="点赞"
            className={`w-12 h-12 rounded-full flex items-center justify-center border ${liked ? 'border-red-500 bg-red-500/10' : 'border-neutral-300 bg-white'}`}
            onClick={(e) => {
              setLiked(v => !v)
              const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect()
              const parent = sec6Ref.current
              if (parent) spawnParticles(parent, rect.left + rect.width / 2, rect.top, 'heart')
            }}
          >
            <span className={`text-2xl ${liked ? 'text-red-600' : 'text-neutral-600'}`}>❤</span>
          </button>
          <button
            aria-label="分享"
            className="w-12 h-12 rounded-full flex items-center justify-center border border-neutral-300"
            onClick={() => setShowShare(s => !s)}
          >
            <span className="text-xl text-neutral-700">⇪</span>
          </button>
        </div>
        {showShare && (
          <div role="dialog" aria-modal="true" className="mt-6 rounded-xl border border-neutral-200 p-4 shadow-md bg-white">
            <div className="text-sm text-neutral-700 mb-2">分享给：</div>
            <div className="flex gap-4">
              <button className="px-3 py-1 rounded-md bg-[#1AAD19] text-white">微信</button>
              <button className="px-3 py-1 rounded-md bg-[#09BB07] text-white">朋友圈</button>
            </div>
            <div className="mt-2 text-xs text-neutral-500">把这份秋天的浪漫保存下来</div>
          </div>
        )}
      </section>
    </div>
  )
}
