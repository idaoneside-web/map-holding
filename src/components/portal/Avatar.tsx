import { cn } from "@/lib/cn";
import styles from "./Avatar.module.css";

export interface AvatarProps {
  /** One or two initials derived from the signed-in client's name. */
  initials: string;
  size?: number;
  /** Decorative by default: the name is always rendered as adjacent text. */
  decorative?: boolean;
  className?: string;
}

/**
 * Avatar — the client's initials mark.
 *
 * Deliberately typographic rather than photographic: no client portrait exists
 * and none will be invented. It carries the brand gradient ring so the private
 * environment still reads as MAP Holding.
 */
export function Avatar({ initials, size = 40, decorative = true, className }: AvatarProps) {
  return (
    <span
      className={cn(styles.avatar, className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      aria-hidden={decorative || undefined}
    >
      <span className={styles.inner}>{initials}</span>
    </span>
  );
}

/** Derives one or two uppercase initials from a display name. */
export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
