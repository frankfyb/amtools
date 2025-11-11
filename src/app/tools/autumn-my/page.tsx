"use client"

import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TextPlugin } from 'gsap/TextPlugin'
import PhotoMosaic from './PhotoMosaic'

gsap.registerPlugin(ScrollTrigger, TextPlugin)

// 简单粒子生成（爱心 / 枫叶）
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

// 多边形 clipPath 形状（同样点数便于插值）

export default function AutumnMy() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  // 全屏分屏 refs
  const sec1Ref = useRef<HTMLDivElement | null>(null)
  const sec2Ref = useRef<HTMLDivElement | null>(null)
  const sec3Ref = useRef<HTMLDivElement | null>(null)
  const sec4Ref = useRef<HTMLDivElement | null>(null)
  const sec2TextRef = useRef<HTMLDivElement | null>(null)
  const sec2ImgRef = useRef<HTMLDivElement | null>(null)
  const [showMosaic, setShowMosaic] = useState(false)

  useEffect(() => {
    // 全屏滚动模式：移除非全屏的首屏打字、关键字浮动、形变卡片与图片网格逻辑
    // 全屏分屏滚动触发逻辑
    if (sec1Ref.current) {
      ScrollTrigger.create({
        trigger: sec1Ref.current,
        start: 'top 85%',
        onEnter: () => {
          const rect = sec1Ref.current!.getBoundingClientRect()
          spawnParticles(sec1Ref.current!, rect.width / 2, rect.height * 0.2, 'leaf')
        },
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
            gsap.to(sec2TextRef.current, { duration: 2.4, text: '我的秋天，是你。', ease: 'none' })
          }
          if (sec2ImgRef.current) {
            gsap.fromTo(sec2ImgRef.current, { opacity: 0, filter: 'blur(6px)', x: 40 }, { opacity: 1, filter: 'blur(0px)', x: 0, duration: 1.2, ease: 'power2.out' })
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
        onEnter: () => setShowMosaic(true),
        onLeaveBack: () => setShowMosaic(false),
      })
    }
    if (sec4Ref.current) {
      const lines = sec4Ref.current.querySelectorAll('.poem-line')
      lines.forEach((el) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el as Element, start: 'top 90%', toggleActions: 'play reverse play reverse' },
          opacity: 0,
          y: 24,
          duration: 0.8,
          ease: 'power2.out'
        })
      })
      const floats = sec4Ref.current.querySelectorAll('.floating')
      floats.forEach((el, i) => {
        gsap.to(el, { y: -6 - i, duration: 2 + i * 0.2, yoyo: true, repeat: -1, ease: 'sine.inOut' })
      })
      ScrollTrigger.create({
        trigger: sec4Ref.current,
        start: 'top 85%',
        onEnter: () => {
          const rect = sec4Ref.current!.getBoundingClientRect()
          spawnParticles(sec4Ref.current!, rect.width * 0.7, rect.height * 0.3, 'heart')
        }
      })
    }
  }, [])

  return (
    <div ref={rootRef} className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 text-rose-900">


        {/* ===== 全屏分屏设计：沉浸式叙事 ===== */}
        <section ref={sec1Ref} className="h-screen w-full relative flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-rose-800">秋天 = 女友</h1>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/4 top-12 text-2xl">🍁</div>
            <div className="absolute left-2/3 top-24 text-xl">🍁</div>
            <div className="absolute right-1/4 top-10 text-3xl">🍁</div>
          </div>
        </section>
        <section ref={sec2Ref} className="h-screen w-full grid md:grid-cols-2 gap-8 items-center">
          <div className="px-6">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-snug">
              <span className="text-rose-600">我的秋天</span>
              <span>，</span>
              <span className="text-orange-600">是你</span>
              <span>。</span>
            </div>
            <div className="mt-4 text-xl sm:text-2xl flex items-baseline">
              <div ref={sec2TextRef} className="font-medium text-rose-700" />
              <span className="ml-2 text-rose-400">|</span>
            </div>
          </div>
          <div className="px-6">
            <div
              ref={sec2ImgRef}
              className="relative h-64 sm:h-80 lg:h-96 rounded-3xl overflow-hidden shadow-xl opacity-0"
              style={{ filter: 'blur(6px)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-rose-200 via-amber-200 to-orange-200" />
            </div>
          </div>
        </section>
        <section ref={sec3Ref} className="h-screen w-full flex items-center justify-center">
          <div className="relative w-[80vw] max-w-4xl h-[70vh] bg-neutral-900/80 rounded-xl overflow-hidden shadow-2xl">
            <div className="absolute inset-x-6 top-2 flex gap-2">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="w-4 h-4 rounded-full bg-neutral-700" />
              ))}
            </div>
            <div className="absolute inset-x-6 bottom-2 flex gap-2">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="w-4 h-4 rounded-full bg-neutral-700" />
              ))}
            </div>
            {showMosaic && (
              <PhotoMosaic
                images={[ '/next.svg', '/vercel.svg', '/globe.svg' ]}
                shape="heart"
                text="AM"
                tileSize={12}
                tileCount={200}
                animationDuration={1.8}
                animationStagger={0.006}
                easing="power2.out"
                className="absolute inset-6"
                breath
              />
            )}
          </div>
        </section>
        <section ref={sec4Ref} className="h-screen w-full flex flex-col items-center justify-center px-6">
          <div className="poem-line text-rose-800 text-2xl sm:text-3xl font-medium">我想把每一片叶，藏进你的笑里。</div>
          <div className="poem-line mt-4 text-rose-700/80 text-lg sm:text-xl">把零散的瞬间，拼成我们的故事。</div>
          <div className="mt-6 text-xl sm:text-2xl">
            <span className="floating text-rose-600">爱</span>
            <span className="mx-2">·</span>
            <span className="floating text-orange-600">秋</span>
            <span className="mx-2">·</span>
            <span className="floating text-amber-600">你</span>
          </div>
        </section>
    </div>
  )
}