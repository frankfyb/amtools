"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSectionScroll } from "./hooks/useSectionScroll";
import { CardStyle, DESKTOP_PRESET, DESKTOP_WIDTHS, MOBILE_PRESET, URL_ORDER } from "./types/polaroid";
import HeroSection from "./components/HeroSection"; 
import PoemSection from "./components/PoemSection";
import ScrollLyricSection from "./components/ScrollLyricSection";
import PhotoWall from "./components/PhotoWall";
import SummarySection from "./components/SummarySection";

// 使用集中管理的类型定义和常量
const desktopStyles: CardStyle[] = DESKTOP_PRESET;
const mobileStyles: CardStyle[] = MOBILE_PRESET;
const urls: string[] = URL_ORDER.slice(0, 9).map((n) => `https://objectstorageapi.sg-members-1.clawcloudrun.com/cfd6671w-storage/autumn-my/${n}.PNG`);

export default function AutumnMyPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const animatingRef = useRef(false);
  const [viewer, setViewer] = useState<{ url: string } | null>(null);
  
  // 使用自定义hook处理滚轮和触摸滑动切换屏幕
  // 自动处理动画锁定和事件清理
  useSectionScroll({
    activeIndex,
    onIndexChange: setActiveIndex,
    animatingRef,
    containerRef,
    wrapperRef
  });

  // 处理图片查看器的键盘事件
  useEffect(() => {
    if (!viewer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewer(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [viewer]);

  return (
    <main ref={containerRef} className="h-[100vh] w-full overflow-hidden">
      <div ref={wrapperRef} className="relative w-full">
      <HeroSection />
      <PoemSection />
      <ScrollLyricSection text="金秋风里的叶子轻轻飘落，幸好有你一直陪在我身边。你喜欢的秋日暖阳、街边甜糯的栗子，我都愿意陪着你慢慢尝。那些你在意的小美好，我会一一记在心里，陪你慢慢收集。金黄的银杏叶铺满小路，一年又一年，只想和你手牵手走下去。你向往的人间烟火、山川湖海，我都会陪着你一一抵达。从秋日的落叶到四季的晨昏，你爱的每一处芳华，我都陪你看遍。" />
      <PhotoWall urls={urls} desktopStyles={desktopStyles} desktopWidths={DESKTOP_WIDTHS} mobileStyles={mobileStyles} onOpen={(url) => setViewer({ url })} />
      {viewer && createPortal(
        (
          <div
            className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
            onClick={() => setViewer(null)}
          >
            <div className="relative w-screen h-screen" onClick={() => setViewer(null)}>
              <button
                type="button"
                onClick={() => setViewer(null)}
                aria-label="Close viewer"
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                }}
                className="absolute top-3 right-3 z-[10000] rounded-full bg-white/80 text-stone-900 px-2 py-1 sm:px-2 sm:py-1 md:px-4 md:py-2 cursor-pointer transition-transform duration-150 hover:scale-105 active:scale-95 outline-none focus-visible:ring-2 ring-stone-300"
              >
                ×
              </button>
              <Image
                src={viewer.url}
                alt="viewer"
                fill
                sizes="100vw"
                quality={90}
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        ),
        document.body
      )}
      <SummarySection />
      </div>
    </main>
  );
}