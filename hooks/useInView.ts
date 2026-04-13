"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Returns [ref, hasBeenVisible].
 * hasBeenVisible flips to true the first time the element enters the viewport
 * and stays true — so animations only play once (on scroll-in, not scroll-out).
 */
export function useInView(options?: IntersectionObserverInit): [React.RefObject<HTMLElement | null>, boolean] {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, ...options },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, options]);

  return [ref, visible];
}
