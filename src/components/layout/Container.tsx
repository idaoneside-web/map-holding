import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Container.module.css";

export type ContainerSize = "default" | "narrow" | "portal" | "full";

export interface ContainerProps {
  /** `default` 1280 / `narrow` 880 (prose) / `portal` 1440 / `full` viewport with gutters. */
  size?: ContainerSize;
  as?: ElementType;
  className?: string;
  children?: ReactNode;
}

/**
 * Container — the single horizontal constraint primitive.
 * Width comes from layout tokens; gutters are fluid (`--gutter`, 16 → 40px),
 * so desktop / tablet / mobile are served by one implementation.
 */
export function Container({
  size = "default",
  as: Tag = "div",
  className,
  children,
}: ContainerProps) {
  return (
    <Tag className={cn(styles.container, styles[size], className)} data-container={size}>
      {children}
    </Tag>
  );
}
