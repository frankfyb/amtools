"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function HeroSection() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [showTitle, setShowTitle] = useState(false);

  useEffect(() => {
    if (showTitle && titleRef.current) {
      gsap.fromTo(titleRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" });
    }
  }, [showTitle]);

  return (
    <section className="relative h-[100vh] w-full" style={{ height: "100svh" }}>
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
            gsap.to(titleRef.current, { scale: 1.08, letterSpacing: "0.1em", duration: 0.8, ease: "power2.out", yoyo: true, repeat: 1 });
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
  );
}