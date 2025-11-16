"use client";
import { useEffect, useState, RefObject } from "react";
import gsap from "gsap";

interface UseLeafFallOptions {
  count?: number;
  duration?: number;
  delay?: number;
}

export function useLeafFall(
  ref: RefObject<HTMLElement>,
  options: UseLeafFallOptions = {}
) {
  const { count = 18, duration = 8, delay = 0.35 } = options;
  const [leafCount, setLeafCount] = useState(count);

  useEffect(() => {
    // 自适应叶子数量：移动端10片，桌面端使用指定数量
    const adaptiveCount = window.innerWidth < 768 ? 10 : count;
    setLeafCount(adaptiveCount);
  }, [count]);

  useEffect(() => {
    if (!ref.current) return;

    const leaves = Array.from(ref.current.querySelectorAll("span"));
    
    leaves.forEach((leaf, idx) => {
      const startX = Math.random() * window.innerWidth;
      
      // 设置初始位置
      gsap.set(leaf, {
        left: startX,
        top: -20,
        x: 0,
        y: 0,
        rotation: 0
      });

      // 创建飘落动画
      gsap.to(leaf, {
        y: window.innerHeight + 60,
        x: startX + (Math.random() * 120 - 60),
        rotation: Math.random() * 180 - 90,
        duration: duration + Math.random() * 4,
        ease: "power1.inOut",
        repeat: -1,
        delay: idx * delay
      });
    });

    return () => {
      // 清理动画
      leaves.forEach(leaf => {
        gsap.killTweensOf(leaf);
      });
    };
  }, [ref, leafCount, duration, delay]);

  return leafCount;
}