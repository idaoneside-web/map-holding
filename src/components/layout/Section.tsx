import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Section.module.css";

export type SectionTone =
  | "default"
  | "raised"
  | "subtle"
  | "navy"
  | "navy-deep"
  | "navy-raised"
  | "gradient-navy"
  | "gradient-ivory"
  | "gradient-brand";

export type SectionSpacing = "none" | "sm" | "md" | "lg" | "xl";

export interface SectionProps {
  /** Surface + theme primitive. Dark tones re-point the semantic text/border
   *  tokens locally, so nested components adapt without knowing the ground. */
  tone?: SectionTone;
  spacing?: SectionSpacing;
  as?: ElementType;
  id?: string;
  className?: string;
  children?: ReactNode;
}

const DARK_TONES: ReadonlySet<SectionTone> = new Set([
  "navy",
  "navy-deep",
  "navy-raised",
  "gradient-navy",
]);

/**
 * Section — background/theme primitive for full-width bands.
 * Using a dark tone flips `--color-text-*`, `--color-border-*` and
 * `--color-bg-raised` for every descendant, which is how the brand system
 * stays consistent without per-component dark variants.
 */
export function Section({
  tone = "default",
  spacing = "lg",
  as: Tag = "section",
  id,
  className,
  children,
}: SectionProps) {
  return (
    <Tag
      id={id}
      className={cn(
        styles.section,
        styles[`tone-${tone}`],
        styles[`spacing-${spacing}`],
        className,
      )}
      data-tone={tone}
      data-dark={DARK_TONES.has(tone) ? "true" : undefined}
    >
      {children}
    </Tag>
  );
}
