"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import styles from "./VideoScene.module.css";

export interface VideoSceneProps {
  src: string;
  /** First-frame still used as the poster (shows before play, and for
   *  reduced-motion / slow connections). */
  poster?: string;
  className?: string;
}

/**
 * VideoScene — the full-bleed cinematic clip behind a chapter.
 *
 * One continuous scroll film: each chapter's clip is muted, loops, and plays
 * only while that chapter is on screen (an IntersectionObserver starts and
 * pauses it), so scrolling plays the story and nothing runs off-screen.
 *
 *  - `prefers-reduced-motion: reduce`: the clip never autoplays; its poster
 *    still carries the scene, so the journey stays meaningful with no motion.
 *  - The clip is decorative (`aria-hidden`); the chapter's copy carries the
 *    meaning, exactly as the brand system requires.
 */
export function VideoScene({ src, poster, className }: VideoSceneProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) video.play().catch(() => {});
          else video.pause();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={cn(styles.video, className)}
      muted
      loop
      playsInline
      preload="metadata"
      poster={poster}
      aria-hidden="true"
      tabIndex={-1}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
