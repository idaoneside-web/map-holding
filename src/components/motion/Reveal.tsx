"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Reveal.module.css";

export interface RevealProps {
  children: ReactNode;
  /** Stagger offset in ms. Phase 1 caps stagger at 80ms between siblings. */
  delay?: number;
  className?: string;
}

/**
 * Reveal — the approved scroll-in motion: subtle fade + controlled rise,
 * observed once per element. Under `prefers-reduced-motion: reduce` the element
 * is fully visible immediately (CSS handles it), so motion is never required
 * for content to be readable.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      // No observer available: trigger on the next frame rather than synchronously
      // during commit, so the CSS transition still runs instead of double-rendering.
      const frame = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(styles.reveal, shown && styles.shown, className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
