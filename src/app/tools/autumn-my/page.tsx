"use client";
import gsap from "gsap";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function AutumnMyPage() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showTitle, setShowTitle] = useState(false);
  const secondImageWrapRef = useRef<HTMLDivElement>(null);
  const [typedText, setTypedText] = useState("");
  const cursorRef = useRef<HTMLSpanElement>(null);
  const poem = "《秋光里的她》我以镜头作笺纸，金风研墨记流年。她携萌兔抬眸瞬，我把深情锁镜间。一地银杏铺诗卷，满林晴色酿清欢。年年此景相携处，爱意如秋岁岁绵。";
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const animatingRef = useRef(false);
  const touchStartY = useRef(0);
  const textWrapRef = useRef<HTMLDivElement>(null);
  const typedStartedRef = useRef(false);
  const overlayWarmRef = useRef<HTMLDivElement>(null);
  const overlayVignetteRef = useRef<HTMLDivElement>(null);
  const thirdText = "金秋风里的叶子轻轻飘落，幸好有你一直陪在我身边。你喜欢的秋日暖阳、街边甜糯的栗子，我都愿意陪着你慢慢尝。那些你在意的小美好，我会一一记在心里，陪你慢慢收集。金黄的银杏叶铺满小路，一年又一年，只想和你手牵手走下去。你向往的人间烟火、山川湖海，我都会陪着你一一抵达。从秋日的落叶到四季的晨昏，你爱的每一处芳华，我都陪你看遍。";
  const thirdTextRef = useRef<HTMLDivElement>(null);
  const leavesRef = useRef<HTMLDivElement>(null);
  const thirdStartedRef = useRef(false);
  const fifthTextRef = useRef<HTMLDivElement>(null);
  const fifthIconsRef = useRef<HTMLDivElement>(null);
  const heartRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<{ url: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [leafCount, setLeafCount] = useState(18);
  const polaroidsRef = useRef<HTMLDivElement>(null);
  const polaroidTlRef = useRef<gsap.core.Tween | gsap.core.Timeline | null>(null);
  type CardStyle = { left: number; top: number; rotate: number; z: number };
  const URL_ORDER = [
    3, 7, 1, 12, 5, 9, 2, 18, 4, 10, 6, 14, 8,
    15, 11, 23, 16, 21, 13, 17, 19, 22, 24, 25, 26, 27,
  ];
  const DESKTOP_PRESET: CardStyle[] = [
    { left: 6, top: 6, rotate: -6, z: 11 },
    { left: 32, top: 5, rotate: 4, z: 12 },
    { left: 58, top: 7, rotate: -3, z: 11 },
    { left: 14, top: 24, rotate: -5, z: 13 },
    { left: 44, top: 22, rotate: 3, z: 14 },
    { left: 74, top: 25, rotate: -4, z: 13 },
    { left: 10, top: 50, rotate: 4, z: 12 },
    { left: 36, top: 48, rotate: -3, z: 13 },
    { left: 62, top: 51, rotate: 2, z: 13 },
  ];
  const DESKTOP_WIDTHS: number[] = [
    18, 17, 16, 17, 20, 17, 16, 17, 20,
  ];
  const MOBILE_PRESET: CardStyle[] = [
    { left: 4, top: 6, rotate: -5, z: 12 },
    { left: 32, top: 4, rotate: 3, z: 13 },
    { left: 60, top: 6, rotate: -2, z: 12 },
    { left: 6, top: 32, rotate: -3, z: 13 },
    { left: 34, top: 30, rotate: 3, z: 14 },
    { left: 62, top: 32, rotate: -4, z: 13 },
    { left: 4, top: 60, rotate: 3, z: 12 },
    { left: 32, top: 58, rotate: -2, z: 13 },
    { left: 60, top: 60, rotate: 2, z: 13 },
  ];
  const desktopStyles: CardStyle[] = DESKTOP_PRESET;
  const mobileStyles: CardStyle[] = MOBILE_PRESET;
  const urls: string[] = URL_ORDER.slice(0, 9).map((n) => `https://objectstorageapi.sg-members-1.clawcloudrun.com/cfd6671w-storage/autumn-my/${n}.PNG`);
  

  useEffect(() => {
    if (showTitle && titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" }
      );
    }
  }, [showTitle]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setLeafCount(window.innerWidth < 768 ? 10 : 18);
    }
  }, []);

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

  useEffect(() => {
    if (activeIndex !== 1) return;
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    if (secondImageWrapRef.current) {
      tl.fromTo(
        secondImageWrapRef.current,
        { scale: 0.98, y: 6, filter: "saturate(0.95) brightness(0.95)" },
        { scale: 1, y: 0, filter: "saturate(1.05) brightness(1)", duration: 0.9 },
        0
      );
    }
    if (overlayWarmRef.current) {
      tl.fromTo(overlayWarmRef.current, { opacity: 0 }, { opacity: 1, duration: 0.8 }, 0);
    }
    if (overlayVignetteRef.current) {
      tl.fromTo(overlayVignetteRef.current, { opacity: 0.4 }, { opacity: 0.6, duration: 0.8 }, 0);
    }
    if (textWrapRef.current) {
      tl.fromTo(
        textWrapRef.current,
        { opacity: 0, y: 10, filter: "blur(2px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9 },
        0.2
      );
    }

    if (!typedStartedRef.current) {
      typedStartedRef.current = true;
      const obj = { i: 0 } as { i: number };
      const cursorEl = cursorRef.current;
      gsap.to(obj, {
        i: poem.length,
        duration: poem.length * 0.1,
        ease: "none",
        onUpdate: () => {
          setTypedText(poem.slice(0, Math.floor(obj.i)));
        },
        onComplete: () => {
          if (cursorEl) {
            gsap.to(cursorEl, { opacity: 0, duration: 0.4, repeat: 3, yoyo: true });
          }
        },
      });
    }

    return () => {
      tl.kill();
    };
  }, [activeIndex]);

  

  useEffect(() => {
    if (activeIndex !== 2 || thirdStartedRef.current) return;
    thirdStartedRef.current = true;
    const container = thirdTextRef.current;
    if (container) {
      const lines = Array.from(container.querySelectorAll("span"));
      gsap.to(lines, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.15,
      });
    }
    if (leavesRef.current) {
      const leaves = Array.from(leavesRef.current.querySelectorAll("span"));
      leaves.forEach((leaf, idx) => {
        const startX = Math.random() * window.innerWidth;
        leaf.style.left = `${startX}px`;
        leaf.style.top = `-20px`;
        gsap.to(leaf, {
          y: window.innerHeight + 60,
          x: startX + (Math.random() * 120 - 60),
          rotation: Math.random() * 180 - 90,
          duration: 6 + Math.random() * 4,
          ease: "power1.inOut",
          repeat: -1,
          delay: idx * 0.35,
        });
      });
    }
  }, [activeIndex]);

  useEffect(() => {
    if (activeIndex !== 3) return;
    const container = polaroidsRef.current;
    if (!container) return;
    const cards = Array.from(container.querySelectorAll("button"));
    polaroidTlRef.current?.kill();
    polaroidTlRef.current = gsap.to(cards, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.6,
      ease: "power2.out",
      stagger: 0.06,
      startAt: { opacity: 0, y: 20, scale: 0.95 },
    });
    return () => {
      polaroidTlRef.current?.kill();
    };
  }, [activeIndex]);

  useEffect(() => {
    if (activeIndex !== 4) return;
    const container = fifthTextRef.current;
    const icons = fifthIconsRef.current;
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    if (container) {
      const lines = Array.from(container.querySelectorAll("span"));
      tl.fromTo(lines, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.2 }, 0);
    }
    if (icons) {
      const iconSpans = Array.from(icons.querySelectorAll("span"));
      tl.fromTo(iconSpans, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.15 }, "+=0.2");
      tl.fromTo(icons, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 }, "+=0.2");
    }
    return () => { tl.kill(); };
  }, [activeIndex]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !wrapperRef.current) return;
    const goTo = (index: number) => {
      animatingRef.current = true;
      gsap.to(wrapperRef.current, {
        y: -window.innerHeight * index,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => {
          setActiveIndex(index);
          animatingRef.current = false;
        },
      });
    };
    const onWheel = (e: WheelEvent) => {
      if (animatingRef.current) return;
      if (e.deltaY > 30 && activeIndex === 0) {
        e.preventDefault();
        goTo(1);
      } else if (e.deltaY > 30 && activeIndex === 1) {
        e.preventDefault();
        goTo(2);
      } else if (e.deltaY > 30 && activeIndex === 2) {
        e.preventDefault();
        goTo(3);
      } else if (e.deltaY > 30 && activeIndex === 3) {
        e.preventDefault();
        goTo(4);
      } else if (e.deltaY < -30 && activeIndex === 1) {
        e.preventDefault();
        goTo(0);
      } else if (e.deltaY < -30 && activeIndex === 2) {
        e.preventDefault();
        goTo(1);
      } else if (e.deltaY < -30 && activeIndex === 3) {
        e.preventDefault();
        goTo(2);
      } else if (e.deltaY < -30 && activeIndex === 4) {
        e.preventDefault();
        goTo(3);
      }
    };
    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      if (!animatingRef.current && dy < -60 && activeIndex === 0) {
        goTo(1);
      } else if (!animatingRef.current && dy < -60 && activeIndex === 1) {
        goTo(2);
      } else if (!animatingRef.current && dy < -60 && activeIndex === 2) {
        goTo(3);
      } else if (!animatingRef.current && dy < -60 && activeIndex === 3) {
        goTo(4);
      } else if (!animatingRef.current && dy > 60 && activeIndex === 1) {
        goTo(0);
      } else if (!animatingRef.current && dy > 60 && activeIndex === 2) {
        goTo(1);
      } else if (!animatingRef.current && dy > 60 && activeIndex === 3) {
        goTo(2);
      } else if (!animatingRef.current && dy > 60 && activeIndex === 4) {
        goTo(3);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [activeIndex]);

  return (
    <main ref={containerRef} className="h-[100vh] w-full overflow-hidden">
      <div ref={wrapperRef} className="relative w-full">
      <section className="relative h-[100vh] w-full" style={{ height: '100svh' }}>
        <Image
          src="https://objectstorageapi.sg-members-1.clawcloudrun.com/cfd6671w-storage/autumn-my/1.PNG"
          alt="Autumn Background"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover"
        />

        <div
          onClick={() => {
            if (!showTitle) {
              setShowTitle(true);
              return;
            }
            if (titleRef.current) {
              gsap.to(titleRef.current, {
                scale: 1.08,
                letterSpacing: "0.1em",
                duration: 0.8,
                ease: "power2.out",
                yoyo: true,
                repeat: 1,
              });
            }
          }}
          className="absolute inset-0 flex justify-center items-start pt-16 md:items-center md:pt-0"
        >
          {showTitle && (
            <h1 ref={titleRef} className="text-4xl md:text-6xl font-serif text-white tracking-wide">
              2025 秋
            </h1>
          )}
        </div>
      </section>
      <section className="relative h-[100vh] w-full flex flex-col md:flex-row bg-gradient-to-b from-amber-50 via-rose-50 to-amber-100 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900" style={{ height: '100svh' }}>
        <div ref={secondImageWrapRef} className="relative w-full md:w-1/2 h-[55vh] md:h-full">
          <Image
            src="https://objectstorageapi.sg-members-1.clawcloudrun.com/cfd6671w-storage/autumn-my/2.PNG"
            alt="Autumn Side"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            quality={85}
            className="object-cover object-center brightness-[1.0] contrast-105 saturate-105"
          />
          <div ref={overlayWarmRef} className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-amber-200/20 via-rose-200/10 to-transparent mix-blend-soft-light" />
          <div ref={overlayVignetteRef} className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-60" style={{ backgroundImage: "radial-gradient(120% 80% at 50% 50%, rgba(255,220,160,0.10) 0%, rgba(255,220,160,0.08) 40%, rgba(0,0,0,0.25) 100%)" }} />
          <div className="pointer-events-none absolute inset-0 bg-black/15 mix-blend-multiply" />
        </div>
        <div className="flex w-full md:w-1/2 items-center justify-center p-4 md:p-6">
          <div ref={textWrapRef} className=" text-stone-700 font-serif text-base md:text-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/20 rounded-xl shadow-xl p-3 md:p-6 text-center md:text-left leading-relaxed md:leading-loose space-y-2 md:space-y-3 tracking-wide">
            {typedText
              .split(/(?<=[，。；！？》])/)
              .filter(Boolean)
              .map((line, i, arr) => (
                <span key={i} className="block tracking-wider md:tracking-widest">
                  {line}
                  {i === arr.length - 1 && (
                    <span ref={cursorRef} className="inline-block ml-1 align-baseline text-stone-700">|</span>
                  )}
                </span>
              ))}
          </div>
        </div>
      </section>
      <section className="relative h-[100vh] w-full overflow-hidden bg-white" style={{ height: '100svh' }}>
        <div className="absolute inset-0">
          <div ref={leavesRef} className="pointer-events-none absolute inset-0">
            {mounted && Array.from({ length: leafCount }).map((_, i) => (
              <span key={i} className="absolute text-amber-400">🍂</span>
            ))}
          </div>
        </div>
        <div ref={thirdTextRef} className="absolute inset-0 flex items-center justify-center p-5 md:p-6">
          <div className="max-w-xl text-stone-800 font-serif text-lg md:text-2xl leading-relaxed md:leading-loose text-center md:text-left space-y-2 md:space-y-3">
            {thirdText
              .split(/(?<=[，。；！？])/)
              .filter(Boolean)
              .map((line, i) => (
                <span key={i} className="block opacity-0 translate-y-[10px] tracking-wide md:tracking-wider">{line}</span>
              ))}
          </div>
        </div>
      </section>
      <section className="relative h-[100vh] w-full bg-black overflow-hidden" style={{ height: '100svh' }}>
        <div ref={polaroidsRef} className="absolute inset-0">
          {/* Desktop: absolute canvas; Mobile: grid fallback */}
          <div className="hidden md:block w-full h-full relative">
            {urls && urls.map((src, i) => {
              const s = desktopStyles[i];
              const rotate = s?.rotate ?? 0;
              const x = s ? s.left : 50;
              const y = s ? s.top : 50;
              const z = s ? s.z : 10;
              return (
                <button
                  key={i}
                  onClick={() => setViewer({ url: src })}
                  type="button"
                  className="absolute transition-transform duration-300 hover:scale-[1.03] active:scale-[1.01]"
                  style={{ left: `${x}%`, top: `${y}%`, zIndex: 100 + z, transform: `rotate(${rotate}deg)` }}
                >
                  <div className="relative bg-white rounded-[3px] shadow-[0_10px_28px_rgba(0,0,0,0.35)] ring-1 ring-stone-200/70 p-2 pb-6">
                    <div className="relative aspect-[3/4]" style={{ width: `${DESKTOP_WIDTHS[i] ?? 18}vw` }}>
                      <Image
                        src={src}
                        alt={`polaroid-${i + 1}`}
                        fill
                        sizes="(min-width:768px) 18vw"
                        quality={85}
                        className="object-cover"
                        unoptimized
                        loading={i > 3 ? 'lazy' : undefined}
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-[2px] opacity-15 mix-blend-overlay" style={{ backgroundImage: "radial-gradient(120% 120% at 50% 50%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 40%, rgba(0,0,0,0.15) 100%)" }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="md:hidden w-full h-[100vh] relative" style={{ height: '100svh' }}>
            {urls && mobileStyles.map((s, i) => {
              const src = urls[i];
              return (
                <button
                  key={i}
                  onClick={() => setViewer({ url: src })}
                  type="button"
                  className="absolute transition-transform duration-300 active:scale-[0.99]"
                  style={{ left: `${s.left}%`, top: `${s.top}%`, zIndex: 10 + s.z, transform: `rotate(${s.rotate}deg)` }}
                >
                  <div className="relative bg-white rounded-[3px] shadow-[0_8px_22px_rgba(0,0,0,0.35)] ring-1 ring-stone-200/70 p-2 pb-5">
                    <div className="relative aspect-[3/4]" style={{ width: `${(i % 3 === 1 ? 38 : 34)}vw` }}>
                      <Image
                        src={src}
                        alt={`polaroid-${i + 1}`}
                        fill
                        sizes="(max-width:768px) 42vw"
                        quality={85}
                        className="object-cover"
                        unoptimized
                        loading={i > 2 ? 'lazy' : undefined}
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-[2px] opacity-15 mix-blend-overlay" style={{ backgroundImage: "radial-gradient(120% 120% at 50% 50%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 40%, rgba(0,0,0,0.15) 100%)" }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        {mounted && viewer && createPortal(
          (
            <div
              className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
              onClick={() => setViewer(null)}
            >
              <div className="relative w-screen h-screen" onClick={() => setViewer(null)}>
                <button
                  type="button"
                  onClick={() => setViewer(null)}
                  className="absolute top-3 right-3 z-[10000] rounded-full bg-white/80 text-stone-900 px-3 py-2 md:px-4 md:py-2"
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
      </section>
      <section className="relative h-[100vh] w-full bg-white overflow-hidden" style={{ height: '100svh' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
          <div ref={heartRef} className="absolute top-2 left-1/2 -translate-x-1/2 text-red-400 opacity-60">❤</div>
          <div ref={fifthTextRef} className="text-center max-w-xl px-4">
            <span className="block text-red-600 font-serif text-xl md:text-3xl mb-3 md:mb-4">致我的秋天</span>
            <span className="block text-stone-900 font-serif text-base md:text-xl">这个秋天，因为有你而完整。</span>
            <span className="block text-stone-900 font-serif text-base md:text-xl">下一个秋天，也想和你一起看枫叶、闻桂香、吃烤红薯</span>
            <span className="block text-stone-900 font-serif text-base md:text-xl">——不止秋天，每个季节都想有你。</span>
          </div>
          <div ref={fifthIconsRef} className="mt-4 md:mt-6 flex gap-3 md:gap-4 items-center">
            <span className="text-red-500">🍁</span>
            <span className="text-red-500">🍁</span>
            <span className="text-red-500">🍁</span>
          </div>
        </div>
      </section>
      </div>
    </main>
  );
}