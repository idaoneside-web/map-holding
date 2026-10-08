import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Text.module.css";

export type TextVariant =
  | "display-xl"
  | "display-l"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "body-l"
  | "body"
  | "body-s"
  | "caption"
  | "eyebrow"
  | "button"
  | "nav"
  | "metric";

export type TextTone = "strong" | "default" | "muted" | "accent" | "gold" | "inherit";

export interface TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  as?: ElementType;
  id?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Text — the typography primitive. Every size, weight, line-height and tracking
 * value comes from the Phase 1 type tokens; no component defines its own type.
 */
export function Text({
  variant = "body",
  tone = "inherit",
  as,
  id,
  className,
  children,
}: TextProps) {
  const Tag: ElementType = as ?? NON_PARAGRAPH_ELEMENTS[variant] ?? "p";
  return (
    <Tag id={id} className={cn(styles.text, styles[variant], styles[`tone-${tone}`], className)}>
      {children}
    </Tag>
  );
}

/**
 * `Text` never renders a heading element. Heading structure belongs to `Heading`,
 * so a large type specimen can never accidentally insert an extra `h1` or skip a
 * level in the document outline.
 */
const NON_PARAGRAPH_ELEMENTS: Partial<Record<TextVariant, ElementType>> = {
  button: "span",
  nav: "span",
};

export interface HeadingProps extends Omit<TextProps, "as"> {
  /** Heading level. Drives the tag name and, by default, the type variant. */
  level?: 1 | 2 | 3 | 4;
  /** Optional type-scale override, e.g. `variant="display-xl"` on an `h1`. */
  variant?: TextVariant;
}

/**
 * Heading — the only primitive that produces `h1`–`h4`.
 * Keeps document outline order (one h1 per page, descending levels) tied to the
 * visual scale from Phase 1 §B.2.
 */
export function Heading({
  level = 2,
  variant,
  tone = "strong",
  className,
  children,
  ...rest
}: HeadingProps) {
  const tag = `h${level}` as const;
  return (
    <Text as={tag} variant={variant ?? tag} tone={tone} className={className} {...rest}>
      {children}
    </Text>
  );
}

/**
 * Eyebrow — tracked uppercase label. Directly mirrors the wordmark's
 * `PEOPLE • RESOURCES • OPPORTUNITY` treatment (0.18em tracking).
 */
export function Eyebrow({ tone = "gold", className, children, ...rest }: TextProps) {
  return (
    <Text variant="eyebrow" tone={tone} className={className} {...rest}>
      {children}
    </Text>
  );
}
