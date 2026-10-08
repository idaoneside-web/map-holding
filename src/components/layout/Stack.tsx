import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Stack.module.css";

export interface StackProps {
  gap?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Cross-axis alignment. */
  align?: "start" | "center" | "end" | "stretch";
  as?: ElementType;
  className?: string;
  children?: ReactNode;
}

/** Stack — single-axis flow primitive for vertical rhythm. */
export function Stack({
  gap = "md",
  align = "stretch",
  as: Tag = "div",
  className,
  children,
}: StackProps) {
  return (
    <Tag className={cn(styles.stack, styles[`gap-${gap}`], styles[`align-${align}`], className)}>
      {children}
    </Tag>
  );
}
