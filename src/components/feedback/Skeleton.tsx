import { cn } from "@/lib/cn";
import styles from "./Skeleton.module.css";

export interface SkeletonProps {
  /** CSS length for the bar width. Defaults to full width. */
  width?: string;
  /** CSS length for the bar height. */
  height?: string;
  /** Renders a pill instead of a slightly rounded bar. */
  shape?: "text" | "block" | "circle";
  className?: string;
}

/**
 * Skeleton — the loading placeholder.
 *
 * Accessibility notes: the shimmer is a `background-image` animation, and the
 * global reduced-motion rule collapses it, at which point the element is simply
 * a flat tint and still communicates "loading" alongside the accessible label
 * applied by the caller. Decorative marks are hidden from assistive tech.
 */
export function Skeleton({ width, height, shape = "text", className }: SkeletonProps) {
  return (
    <span
      className={cn(styles.skeleton, styles[`shape-${shape}`], className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

/** A short stack of text bars, for list/table placeholders. */
export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <span className={cn(styles.textStack, className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} width={index === lines - 1 ? "62%" : "100%"} />
      ))}
    </span>
  );
}
