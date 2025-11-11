"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'

export type MosaicShape = 'heart' | 'text' | 'circle'

export interface PhotoMosaicProps {
  images: string[]
  shape?: MosaicShape
  text?: string
  tileSize?: number
  tileCount?: number
  animationDuration?: number
  animationStagger?: number
  easing?: string
  className?: string
  breath?: boolean
}

interface Fragment {
  x: number
  y: number
  image: string
  bgX: number
  bgY: number
}

// 生成心形内的点 (标准心形隐式方程)
function generateHeartPoints(count: number, width: number, height: number): Array<{x:number,y:number}> {
  const pts: Array<{x:number,y:number}> = []
  let attempts = 0
  while (pts.length < count && attempts < count * 50) {
    attempts++
    const xn = Math.random() * 2 - 1
    const yn = Math.random() * 2 - 1
    const v = Math.pow(xn * xn + yn * yn - 1, 3) - xn * xn * yn * yn * yn
    if (v <= 0) {
      const x = (xn + 1) / 2 * width
      const y = (1 - yn) / 2 * height
      pts.push({ x, y })
    }
  }
  return pts
}

// 生成圆形内的点
function generateCirclePoints(count: number, width: number, height: number): Array<{x:number,y:number}> {
  const pts: Array<{x:number,y:number}> = []
  const r = Math.min(width, height) * 0.44
  const cx = width / 2
  const cy = height / 2
  for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2
    const rr = Math.sqrt(Math.random()) * r
    pts.push({ x: cx + Math.cos(t) * rr, y: cy + Math.sin(t) * rr })
  }
  return pts
}

// 使用 Canvas 文本作为掩模生成点
function generateTextPoints(text: string, count: number, width: number, height: number, step: number): Array<{x:number,y:number}> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0,0,width,height)
  ctx.fillStyle = '#fff'
  const fontSize = Math.floor(height * 0.6)
  ctx.font = `bold ${fontSize}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, width/2, height/2)
  const pts: Array<{x:number,y:number}> = []
  for (let y = step/2; y < height; y += step) {
    for (let x = step/2; x < width; x += step) {
      const { data } = ctx.getImageData(x, y, 1, 1)
      if (data[3] > 10) pts.push({ x, y })
    }
  }
  // 打乱并裁剪到需要数量
  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pts[i], pts[j]] = [pts[j], pts[i]]
  }
  return pts.slice(0, count)
}

export default function PhotoMosaic({
  images,
  shape = 'heart',
  text = 'AM',
  tileSize = 12,
  tileCount = 160,
  animationDuration = 1.8,
  animationStagger = 0.006,
  easing = 'power2.out',
  className,
  breath = true,
}: PhotoMosaicProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const tileRefs = useRef<Array<HTMLDivElement | null>>([])
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const breathTweens = useRef<Array<gsap.core.Tween>>([])
  const [formed, setFormed] = useState(false)
  const [dims, setDims] = useState<{ w: number, h: number }>({ w: 480, h: 360 })
  const [fragments, setFragments] = useState<Fragment[]>([])

  // 监听尺寸变化以自动适配
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const cr = entry.contentRect
        const w = Math.floor(cr.width)
        const h = Math.floor(cr.height)
        if (w > 0 && h > 0) setDims({ w, h })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 根据形状生成目标点与碎片数据
  const targets = useMemo(() => {
    const count = tileCount
    const w = dims.w
    const h = dims.h
    let pts: Array<{x:number,y:number}> = []
    if (shape === 'heart') pts = generateHeartPoints(count, w, h)
    else if (shape === 'circle') pts = generateCirclePoints(count, w, h)
    else pts = generateTextPoints(text, count, w, h, tileSize)

    const frags: Fragment[] = pts.map((p, i) => ({
      x: p.x,
      y: p.y,
      image: images.length ? images[i % images.length] : '',
      bgX: 20 + Math.random() * 60,
      bgY: 20 + Math.random() * 60,
    }))
    return frags
  }, [shape, text, tileCount, dims.w, dims.h, images.length, tileSize])

  // 初始化碎片节点
  useEffect(() => {
    setFragments(targets)
  }, [targets])

  // 动画：从随机位置汇聚成形
  useEffect(() => {
    const el = containerRef.current
    if (!el || fragments.length === 0) return
    // 清理旧动画
    timelineRef.current?.kill()
    breathTweens.current.forEach(t => t.kill())
    breathTweens.current = []
    setFormed(false)

    const tl = gsap.timeline({ onComplete: () => {
      setFormed(true)
      el.setAttribute('data-formed', 'true')
      if (breath) {
        tileRefs.current.forEach((tile) => {
          if (!tile) return
          const t = gsap.to(tile, { y: '+=1.5', duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut' })
          breathTweens.current.push(t)
        })
      }
    } })

    // 初始随机散落位置（容器周围）
    fragments.forEach((frag, i) => {
      const tile = tileRefs.current[i]
      if (!tile) return
      const startX = (Math.random() - 0.5) * dims.w * 1.8
      const startY = (Math.random() - 0.5) * dims.h * 1.8
      gsap.set(tile, { x: startX, y: startY, opacity: 0, rotate: -20 + Math.random() * 40, willChange: 'transform' })
      tl.to(tile, {
        x: frag.x - tileSize / 2,
        y: frag.y - tileSize / 2,
        opacity: 1,
        rotate: 0,
        duration: animationDuration * (0.8 + Math.random() * 0.6),
        ease: easing,
      }, i * animationStagger)
    })

    timelineRef.current = tl
    return () => {
      tl.kill()
      breathTweens.current.forEach(t => t.kill())
      breathTweens.current = []
    }
  }, [fragments, dims.w, dims.h, tileSize, animationDuration, animationStagger, easing, breath])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 shadow-md ${className || ''}`}
      data-testid="photo-mosaic"
      data-formed={formed ? 'true' : 'false'}
      style={{ width: '100%', height: '360px' }}
    >
      {fragments.map((frag, i) => (
        <div
          key={i}
          ref={(el) => { tileRefs.current[i] = el }}
          className="absolute mosaic-tile"
          style={{
            left: 0,
            top: 0,
            width: `${tileSize}px`,
            height: `${tileSize}px`,
            borderRadius: 4,
            boxShadow: '0 2px 6px rgba(255, 170, 120, 0.25)',
            background: frag.image ? `url(${frag.image})` : 'linear-gradient(135deg, #fecaca, #fde68a)',
            backgroundSize: 'cover',
            backgroundPosition: `${frag.bgX}% ${frag.bgY}%`,
          }}
        />
      ))}
      {/* 叙事文案 */}
      <div className="absolute bottom-2 left-3 text-rose-700/70 text-sm pointer-events-none">
        碎片汇聚成形，像把零散的瞬间拼成我们的故事。
      </div>
    </div>
  )
}