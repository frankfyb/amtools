"use client";
import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { CardStyle } from "../types/polaroid";
import { useStaggerIn } from "../hooks/useStaggerIn";

export default function PhotoWall({ urls, desktopStyles, desktopWidths, mobileStyles, onOpen }: { urls: string[]; desktopStyles: CardStyle[]; desktopWidths: number[]; mobileStyles: CardStyle[]; onOpen?: (url: string) => void }) {
  const polaroidsRef = useRef<HTMLDivElement>(null);

  // 使用自定义hook实现照片墙的交错动画效果
  // 按钮元素从下方淡入并缩放至正常大小
  useStaggerIn(polaroidsRef as React.RefObject<HTMLElement>, {
    selector: "button",
    duration: 0.6,
    stagger: 0.06,
    fromVars: { opacity: 0, y: 20, scale: 0.95 },
    toVars: { opacity: 1, y: 0, scale: 1 }
  });

  return (
    <section className="relative h-[100vh] w-full bg-black overflow-hidden" style={{ height: "100svh" }}>
      <div ref={polaroidsRef} className="absolute inset-0">
        <div className="hidden md:block w-full h-full relative">
          {urls.map((src, i) => {
            const s = desktopStyles[i];
            const rotate = s?.rotate ?? 0;
            const x = s ? s.left : 50;
            const y = s ? s.top : 50;
            const z = s ? s.z : 10;
            return (
              <button
                key={i}
                type="button"
                aria-label={`Open photo ${i + 1}`}
                onClick={() => onOpen?.(src)}
                onPointerDown={(e) => gsap.to(e.currentTarget, { scale: 0.98, duration: 0.1, ease: "power2.out" })}
                onPointerUp={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.15, ease: "power2.out" })}
                onPointerLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.15, ease: "power2.out" })}
                className="absolute cursor-pointer outline-none focus-visible:ring-2 ring-stone-300 transition-transform duration-200 hover:scale-[1.03]"
                style={{ left: `${x}%`, top: `${y}%`, zIndex: 100 + z, transform: `rotate(${rotate}deg)` }}
              >
                <div className="relative bg-white rounded-[3px] shadow-[0_10px_28px_rgba(0,0,0,0.35)] ring-1 ring-stone-200/70 p-2 pb-6">
                  <div className="relative aspect-[3/4]" style={{ width: `${desktopWidths[i] ?? 18}vw` }}>
                    <Image src={src} alt={`polaroid-${i + 1}`} fill sizes="(min-width:768px) 18vw" quality={85} className="object-cover" />
                    <div className="pointer-events-none absolute inset-0 rounded-[2px] opacity-15 mix-blend-overlay" style={{ backgroundImage: "radial-gradient(120% 120% at 50% 50%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 40%, rgba(0,0,0,0.15) 100%)" }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="md:hidden w-full h-[100vh] relative" style={{ height: "100svh" }}>
          {mobileStyles.map((s, i) => {
            const src = urls[i];
            return (
              <button
                key={i}
                type="button"
                aria-label={`Open photo ${i + 1}`}
                onClick={() => onOpen?.(src)}
                onPointerDown={(e) => gsap.to(e.currentTarget, { scale: 0.97, duration: 0.1, ease: "power2.out" })}
                onPointerUp={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.15, ease: "power2.out" })}
                onPointerLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.15, ease: "power2.out" })}
                className="absolute cursor-pointer outline-none focus-visible:ring-2 ring-stone-300 transition-transform duration-200"
                style={{ left: `${s.left}%`, top: `${s.top}%`, zIndex: 10 + s.z, transform: `rotate(${s.rotate}deg)` }}
              >
                <div className="relative bg-white rounded-[3px] shadow-[0_8px_22px_rgba(0,0,0,0.35)] ring-1 ring-stone-200/70 p-2 pb-5">
                  <div className="relative aspect-[3/4]" style={{ width: `${(i % 3 === 1 ? 36 : 32)}vw` }}>
                    <Image src={src} alt={`polaroid-${i + 1}`} fill sizes="(max-width:768px) 42vw" quality={85} className="object-cover" />
                    <div className="pointer-events-none absolute inset-0 rounded-[2px] opacity-15 mix-blend-overlay" style={{ backgroundImage: "radial-gradient(120% 120% at 50% 50%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 40%, rgba(0,0,0,0.15) 100%)" }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}