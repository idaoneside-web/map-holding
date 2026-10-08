import { cn } from "@/lib/cn";
import type { ImageRatio } from "@/content/pages";
import styles from "./ImageSlot.module.css";

export interface ImageSlotProps {
  /** What will occupy the frame. Never invented imagery — a labelled frame. */
  label: string;
  ratio?: ImageRatio;
  className?: string;
}

const RATIO_CLASS: Record<ImageRatio, string> = {
  "16/9": "r169",
  "4/3": "r43",
  "3/2": "r32",
  "1/1": "r11",
  "3/4": "r34",
};

/**
 * ImageSlot — a reserved, labelled frame for artwork that does not exist yet
 * (Phase 3 §6 "imagery slots").
 *
 * The aspect ratio is fixed at layout time so that dropping real imagery in
 * later causes no layout shift (Phase 1 §K, CLS < 0.1). The frame is visible
 * text, not a broken `<img>`, so the scaffold never renders a broken asset.
 */
export function ImageSlot({ label, ratio = "16/9", className }: ImageSlotProps) {
  return (
    <div className={cn(styles.slot, styles[RATIO_CLASS[ratio]], className)} data-ratio={ratio}>
      <span className={styles.inner}>
        <span className={styles.marker}>Image slot</span>
        <span className={styles.label}>{label}</span>
        <span className={styles.aspect}>{ratio}</span>
      </span>
    </div>
  );
}
