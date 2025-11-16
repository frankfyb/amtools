"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function SummarySection() {
  const textRef = useRef<HTMLDivElement>(null);
  const iconsRef = useRef<HTMLDivElement>(null);
  const heartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    if (textRef.current) {
      const lines = Array.from(textRef.current.querySelectorAll("span"));
      tl.fromTo(lines, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.2 }, 0);
    }
    if (iconsRef.current) {
      const iconSpans = Array.from(iconsRef.current.querySelectorAll("span"));
      tl.fromTo(iconSpans, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.15 }, "+=0.2");
      tl.fromTo(iconsRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 }, "+=0.2");
    }
    return () => { tl.kill(); };
  }, []);

  return (
    <section className="relative h-[100vh] w-full bg-white overflow-hidden" style={{ height: "100svh" }}>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
        <div ref={heartRef} className="absolute top-2 left-1/2 -translate-x-1/2 text-red-400 opacity-60">❤</div>
        <div ref={textRef} className="text-center max-w-xl px-4">
          <span className="block text-red-600 font-serif text-xl md:text-3xl mb-3 md:mb-4">致我的秋天</span>
          <span className="block text-stone-900 font-serif text-base md:text-xl">这个秋天，因为有你而完整。</span>
          <span className="block text-stone-900 font-serif text-base md:text-xl">下一个秋天，也想和你一起看枫叶、闻桂香、吃烤红薯</span>
          <span className="block text-stone-900 font-serif text-base md:text-xl">——不止秋天，每个季节都想有你。</span>
        </div>
        <div ref={iconsRef} className="mt-4 md:mt-6 flex gap-3 md:gap-4 items-center">
          <span className="text-red-500">🍁</span>
          <span className="text-red-500">🍁</span>
          <span className="text-red-500">🍁</span>
        </div>
      </div>
    </section>
  );
}