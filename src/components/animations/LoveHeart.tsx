"use client"

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { gsap } from 'gsap'

export type LoveHeartSize = 'small' | 'medium' | 'large' | number
export interface LoveHeartProps {
  color?: string
  size?: LoveHeartSize
  autoPlay?: boolean
  className?: string
}

export type LoveHeartHandle = {
  play: () => void
  pause: () => void
  restart: () => void
  stop: () => void
}

const sizeToPx = (size: LoveHeartSize | undefined): number => {
  if (typeof size === 'number') return Math.max(24, size)
  switch (size) {
    case 'small': return 64
    case 'large': return 144
    case 'medium':
    default: return 96
  }
}

// Inline SVG heart for easy color control and crisp rendering
const LoveHeart = forwardRef<LoveHeartHandle, LoveHeartProps>(function LoveHeart({
  color = '#ff6b6b',
  size = 'medium',
  autoPlay = true,
  className,
}, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const heartRef = useRef<SVGSVGElement | null>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    if (!containerRef.current || !heartRef.current) return

    // Prepare initial state for performance
    gsap.set(containerRef.current, { willChange: 'transform', force3D: true })
    gsap.set(heartRef.current, { scale: 1, transformOrigin: '50% 50%' })

    // Heartbeat timeline
    const tl = gsap.timeline({ paused: true, repeat: -1 })
    tl.to(heartRef.current, { scale: 1.08, duration: 0.28, ease: 'power2.out' })
      .to(heartRef.current, { scale: 1.0, duration: 0.32, ease: 'power2.in' })
      .to(heartRef.current, { scale: 1.06, duration: 0.24, ease: 'power2.out' })
      .to(heartRef.current, { scale: 1.0, duration: 0.30, ease: 'power2.in' })

    tlRef.current = tl
    if (autoPlay) tl.play()

    return () => {
      tl.kill()
      tlRef.current = null
    }
  }, [autoPlay])

  useImperativeHandle(ref, (): LoveHeartHandle => ({
    play: () => tlRef.current?.play(),
    pause: () => tlRef.current?.pause(),
    restart: () => tlRef.current?.restart(true),
    stop: () => tlRef.current?.pause(0),
  }), [])

  const px = sizeToPx(size)

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: px, height: px, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      aria-label="love-heart"
      role="img"
    >
      <svg
        ref={heartRef}
        width={px}
        height={px}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        style={{ willChange: 'transform' }}
      >
        <path
          d="M50 85 C20 65 5 50 5 32 C5 18 16 8 30 8 C40 8 47 13 50 20 C53 13 60 8 70 8 C84 8 95 18 95 32 C95 50 80 65 50 85 Z"
          fill={color}
        />
      </svg>
    </div>
  )
})

export default LoveHeart