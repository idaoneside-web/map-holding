import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./GradientSurface.module.css";

export type GradientName = "brand" | "warm" | "cool" | "navy" | "ivory";

export interface GradientSurfaceProps {
  /** Only logo-derived gradients are available, in the mark's amber→blue→teal order. */
  gradient?: GradientName;
  radius?: "none" | "sm" | "md" | "lg" | "xl";
  /** Whether the surface provides its own internal padding. */
  padded?: boolean;
  className?: string;
  children?: ReactNode;
}

/**
 * GradientSurface — a brand-gradient surface primitive.
 * Intended for logo-adjacent panels, hero accents, highlight cards, image
 * overlays and premium decorative elements. Deliberately has no "rainbow"
 * or off-brand option.
 */
export function GradientSurface({
  gradient = "brand",
  radius = "md",
  padded = false,
  className,
  children,
}: GradientSurfaceProps) {
  return (
    <div
      className={cn(
        styles.surface,
        styles[gradient],
        styles[`radius-${radius}`],
        padded && styles.padded,
        className,
      )}
      data-gradient={gradient}
    >
      {children}
    </div>
  );
}
