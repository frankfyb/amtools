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
  const viewportHeightRef = useRef<number>(0);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const container = containerRef.current;
    if (!wrapper || !container) return;

    const computeViewportHeight = () => {
      const vv = typeof window !== "undefined" && typeof (window as unknown as { visualViewport?: { height: number } }).visualViewport !== "undefined"
        ? (window as unknown as { visualViewport: { height: number } }).visualViewport.height
        : window.innerHeight;
      viewportHeightRef.current = vv;
    };

    computeViewportHeight();
    gsap.set(wrapper, { y: -viewportHeightRef.current * activeIndex });

    const goTo = (index: number) => {
      if (animatingRef.current) return;
      
      animatingRef.current = true;
      gsap.to(wrapper, {
        y: -viewportHeightRef.current * index,
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

    const onTouchMove = (e: TouchEvent) => {
      if (animatingRef.current) e.preventDefault();
    };

    const onResize = () => {
      computeViewportHeight();
      gsap.set(wrapper, { y: -viewportHeightRef.current * activeIndex });
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchend", onTouchEnd, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [activeIndex, onIndexChange, animatingRef, containerRef, wrapperRef]);
}