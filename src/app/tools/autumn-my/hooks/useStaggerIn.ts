"use client";
import { useEffect, RefObject } from "react";
import gsap from "gsap";

export interface UseStaggerInOptions {
  duration?: number;
  stagger?: number;
  selector?: string;
  fromVars?: gsap.TweenVars;
  toVars?: gsap.TweenVars;
  autoStart?: boolean;
}

export function useStaggerIn(
  ref: RefObject<HTMLElement>,
  options: UseStaggerInOptions = {}
) {
  const {
    duration = 0.6,
    stagger = 0.15,
    selector = "span",
    fromVars = { opacity: 0, y: 10 },
    toVars = { opacity: 1, y: 0 },
    autoStart = true
  } = options;

  useEffect(() => {
    if (!ref.current || !autoStart) return;

    const elements = Array.from(ref.current.querySelectorAll(selector));
    if (elements.length === 0) return;

    const tl = gsap.timeline();
    tl.fromTo(elements, fromVars, { ...toVars, duration, stagger });

    return () => {
      tl.kill();
    };
  }, [ref, duration, stagger, fromVars, toVars, autoStart, selector]);
}

export function useTypewriter(
  text: string,
  onUpdate: (text: string) => void,
  options: { duration?: number; onComplete?: () => void } = {}
) {
  const { duration = text.length * 0.1, onComplete } = options;

  useEffect(() => {
    const obj = { i: 0 };
    const tl = gsap.to(obj, {
      i: text.length,
      duration,
      ease: "none",
      onUpdate: () => {
        onUpdate(text.slice(0, Math.floor(obj.i)));
      },
      onComplete
    });

    return () => {
      tl.kill();
    };
  }, [text, duration, onUpdate, onComplete]);
}