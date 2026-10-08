"use client";

import { cn } from "@/lib/cn";
import {
  contrastRatio,
  formatRatio,
  isPass,
  parseColor,
  wcagLevel,
  type WcagLevel,
} from "@/lib/contrast";
import { useTokenValue } from "@/lib/use-token-value";
import styles from "./ContrastPair.module.css";

export interface ContrastPairProps {
  /** Foreground token, e.g. `--color-brand-ivory-50`. */
  foreground: string;
  /** Background token, e.g. `--color-brand-navy-900`. */
  background: string;
  /** What the pair is intended for, from Phase 1 §A.5. */
  intent: string;
  /** Set when the intended use is large text (>=24px or >=18.66px bold). */
  largeText?: boolean;
  /** Set when the pair is a UI element or graphic (WCAG 1.4.11 requires 3:1). */
  nonText?: boolean;
}

/**
 * ContrastPair — accessibility validation component.
 *
 * Computes the live WCAG contrast ratio from the *shipped* tokens (resolved from
 * the CSS custom properties) and grades it against the requirement that applies
 * to its intended use, so accessibility is measured rather than asserted.
 */
export function ContrastPair({
  foreground,
  background,
  intent,
  largeText = false,
  nonText = false,
}: ContrastPairProps) {
  const fgValue = useTokenValue(foreground, "color");
  const bgValue = useTokenValue(background, "background-color");
  const fg = parseColor(fgValue);
  const bg = parseColor(bgValue);
  const ratio = fg && bg ? contrastRatio(fg, bg) : null;

  const level: WcagLevel | null = ratio === null ? null : wcagLevel(ratio, { largeText, nonText });
  const passed = isPass(level);

  return (
    <tr>
      <td>
        <span
          className={styles.specimen}
          style={{ color: `var(${foreground})`, backgroundColor: `var(${background})` }}
        >
          Aa
        </span>
      </td>
      <td>
        <code>{foreground}</code>
        <br />
        <span className={styles.on}>on</span> <code>{background}</code>
      </td>
      <td>{intent}</td>
      <td className={styles.right}>{ratio === null ? "…" : formatRatio(ratio)}</td>
      <td className={cn(styles.right, passed ? styles.pass : styles.fail)}>{level ?? "…"}</td>
    </tr>
  );
}
