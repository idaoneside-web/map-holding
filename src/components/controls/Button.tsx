import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  children?: ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { href?: undefined };

type ButtonAsAnchor = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

/**
 * Button — the single actionable primitive.
 *
 * State contract (Phase 1 §F): default · hover · focus-visible · active · disabled.
 * - `md` (default) is 44px tall, the documented minimum target size.
 * - Focus uses the global :focus-visible ring token, never a removed outline.
 * - The hover lift is gated behind `prefers-reduced-motion: no-preference`.
 * - Primary is MAP Gold with MAP Ink text (8.4:1 — AAA).
 */
export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", fullWidth = false, className, children } = props;
  const classes = cn(
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    className,
  );

  if (props.href !== undefined) {
    const {
      variant: _variant,
      size: _size,
      fullWidth: _fullWidth,
      className: _cn,
      children: _c,
      ...anchor
    } = props;
    return (
      <a
        className={classes}
        {...anchor}
        rel={anchor.target === "_blank" ? (anchor.rel ?? "noopener noreferrer") : anchor.rel}
      >
        {children}
      </a>
    );
  }

  const {
    variant: _variant,
    size: _size,
    fullWidth: _fullWidth,
    className: _cn,
    children: _c,
    type = "button",
    ...button
  } = props;
  return (
    <button type={type} className={classes} {...button}>
      {children}
    </button>
  );
}
