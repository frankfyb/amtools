"use client";
import { useRef } from "react";
import { useLeafFall } from "../hooks/useLeafFall";
import { useStaggerIn } from "../hooks/useStaggerIn";

export default function ScrollLyricSection({ text }: { text: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leavesRef = useRef<HTMLDivElement>(null);

  // 使用自定义hook实现文字逐行淡入动画
  // 将文字分割成句子，每句作为一个动画元素
  useStaggerIn(containerRef as React.RefObject<HTMLElement>, {
    selector: "span",
    duration: 0.6,
    stagger: 0.15,
    fromVars: { opacity: 0, y: 10 },
    toVars: { opacity: 1, y: 0 }
  });

  // 使用自定义hook实现落叶飘落动画
  // 自动根据屏幕宽度调整叶子数量，移动端10片，桌面端18片
  useLeafFall(leavesRef as React.RefObject<HTMLElement>, {
    count: 18,
    duration: 6,
    delay: 0.35
  });

  return (
    <section className="relative h-[100vh] w-full overflow-hidden" style={{ height: "100svh" }}>
      <div className="absolute inset-0">
        <div ref={leavesRef} className="pointer-events-none absolute inset-0">
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} className="absolute text-amber-400">🍂</span>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="absolute inset-0 flex items-center justify-center p-4 sm:p-4 md:p-6">
        <div className="max-w-xl text-stone-800 font-serif text-base sm:text-base md:text-2xl leading-relaxed sm:leading-relaxed md:leading-loose text-center md:text-left space-y-2 sm:space-y-2 md:space-y-3">
          {text.split(/(?<=[，。；！？])/).filter(Boolean).map((line, i) => (
            <span key={i} className="block opacity-0 translate-y-[10px] tracking-wide md:tracking-wider">{line}</span>
          ))}
        </div>
      </div>
    </section>
  );
}