"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function PoemSection() {
  const secondImageWrapRef = useRef<HTMLDivElement>(null);
  const textWrapRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const [typedText, setTypedText] = useState("");
  const poem = "《秋光里的她》我以镜头作笺纸，金风研墨记流年。她携萌兔抬眸瞬，我把深情锁镜间。一地银杏铺诗卷，满林晴色酿清欢。年年此景相携处，爱意如秋岁岁绵。";

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    if (secondImageWrapRef.current) {
      tl.fromTo(
        secondImageWrapRef.current,
        { scale: 0.98, y: 6, filter: "saturate(0.95) brightness(0.95)" },
        { scale: 1, y: 0, filter: "saturate(1.05) brightness(1)", duration: 0.9 },
        0
      );
    }
    if (textWrapRef.current) {
      tl.fromTo(textWrapRef.current, { opacity: 0, y: 10, filter: "blur(2px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9 }, 0.2);
    }
    const obj = { i: 0 } as { i: number };
    const cursorEl = cursorRef.current;
    gsap.to(obj, {
      i: poem.length,
      duration: poem.length * 0.1,
      ease: "none",
      onUpdate: () => setTypedText(poem.slice(0, Math.floor(obj.i))),
      onComplete: () => {
        if (cursorEl) gsap.to(cursorEl, { opacity: 0, duration: 0.4, repeat: 3, yoyo: true });
      },
    });
    return () => { tl.kill(); };
  }, []);

  return (
    <section className="relative h-[100vh] w-full flex flex-col md:flex-row bg-gradient-to-b from-amber-50 via-rose-50 to-amber-100 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900" style={{ height: "100svh" }}>
      <div ref={secondImageWrapRef} className="relative w-full md:w-1/2 h-[55vh] md:h-full">
        <Image
          src="https://objectstorageapi.sg-members-1.clawcloudrun.com/cfd6671w-storage/autumn-my/2.PNG"
          alt="Autumn Side"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          quality={85}
          className="object-cover object-center brightness-[1.0] contrast-105 saturate-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-amber-200/20 via-rose-200/10 to-transparent mix-blend-soft-light" />
        <div className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-60" style={{ backgroundImage: "radial-gradient(120% 80% at 50% 50%, rgba(255,220,160,0.10) 0%, rgba(255,220,160,0.08) 40%, rgba(0,0,0,0.25) 100%)" }} />
        <div className="pointer-events-none absolute inset-0 bg-black/15 mix-blend-multiply" />
      </div>
      <div className="flex w-full md:w-1/2 items-center justify-center p-3 sm:p-3 md:p-6">
        <div ref={textWrapRef} className=" text-stone-700 font-serif text-base sm:text-base md:text-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/20 rounded-xl shadow-xl p-2 sm:p-3 md:p-6 text-center md:text-left leading-relaxed sm:leading-relaxed md:leading-loose space-y-2 sm:space-y-2 md:space-y-3 tracking-wide">
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
  );
}