"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "@/hooks/useInView";

type Props = {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
};

export default function StatCounter({ value, decimals = 1, duration = 1100, className }: Props) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);
  const [containerRef, inView] = useInView({ threshold: 0.1 });

  useEffect(() => {
    if (!inView) return;
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration, inView]);

  return (
    <span ref={containerRef as React.RefObject<HTMLSpanElement>} className={className}>
      {display.toFixed(decimals)}
    </span>
  );
}
