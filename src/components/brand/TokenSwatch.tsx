"use client";

import { cn } from "@/lib/cn";
import { useTokenValue } from "@/lib/use-token-value";
import styles from "./TokenSwatch.module.css";

export type TokenSwatchKind = "color" | "gradient" | "size";

export interface TokenSwatchProps {
  /** The CSS custom property name, e.g. `--color-brand-gold-500`. */
  token: string;
  label?: string;
  kind?: TokenSwatchKind;
  className?: string;
}

/**
 * TokenSwatch — validation component.
 *
 * Resolves the *computed* value of a design token in the browser and prints it,
 * so the gallery proves the token layer is genuinely wired up rather than
 * echoing hard-coded strings.
 */
export function TokenSwatch({ token, label, kind = "color", className }: TokenSwatchProps) {
  // Resolved, not raw: a custom property may itself be a `var(--x)` alias.
  const value = useTokenValue(token, kind === "gradient" ? "background-image" : "color");

  return (
    <figure className={cn(styles.swatch, className)}>
      <div
        className={cn(styles.chip, kind === "gradient" && styles.chipGradient)}
        style={
          kind === "gradient"
            ? { backgroundImage: `var(${token})` }
            : { backgroundColor: `var(${token})` }
        }
      />
      <figcaption className={styles.meta}>
        {label ? <span className={styles.label}>{label}</span> : null}
        <code className={styles.token}>{token}</code>
        <code className={styles.value} title={value}>
          {value || "…"}
        </code>
      </figcaption>
    </figure>
  );
}
