"use client";
import gsap from "gsap";
import { useEffect, useRef, RefObject } from "react";

export interface UseSectionScrollOptions {
  activeIndex: number;
  onIndexChange: (index: number) => void;
  animatingRef: RefObject<boolean>;
  containerRef: RefObject<HTMLDivElement | null>;
  wrapperRef: RefObject<HTMLDivElement | null>;
}

export function useSectionScroll({
  activeIndex,
  onIndexChange,
  animatingRef,
  containerRef,
  wrapperRef
}: UseSectionScrollOptions) {
  const touchStartY = useRef(0);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const container = containerRef.current;
    if (!wrapper || !container) return;

    const goTo = (index: number) => {
      if (animatingRef.current) return;
      
      animatingRef.current = true;
      gsap.to(wrapper, {
        y: -window.innerHeight * index,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => {
          onIndexChange(index);
          animatingRef.current = false;
        },
      });
    };

    const onWheel = (e: WheelEvent) => {
      if (animatingRef.current) return;
      
      if (e.deltaY > 30 && activeIndex < 4) {
        e.preventDefault();
        goTo(activeIndex + 1);
      } else if (e.deltaY < -30 && activeIndex > 0) {
        e.preventDefault();
        goTo(activeIndex - 1);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (animatingRef.current) return;
      
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      
      if (dy < -60 && activeIndex < 4) {
        goTo(activeIndex + 1);
      } else if (dy > 60 && activeIndex > 0) {
        goTo(activeIndex - 1);
      }
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, [activeIndex, onIndexChange, animatingRef, containerRef, wrapperRef]);
}