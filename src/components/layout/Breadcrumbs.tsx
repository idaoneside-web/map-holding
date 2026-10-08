import Link from "next/link";
import { cn } from "@/lib/cn";
import styles from "./Breadcrumbs.module.css";

export interface Crumb {
  readonly label: string;
  /** Omit on the final crumb — it is the current page and is not a link. */
  readonly href?: string;
}

export interface BreadcrumbsProps {
  /** Ordered trail. The final entry is rendered as the current page. */
  items: readonly Crumb[];
  className?: string;
}

/**
 * Breadcrumbs — hierarchical location disclosure.
 *
 * Uses a labelled `<nav>` wrapping an ordered list, which is the pattern screen
 * readers announce correctly. The last crumb carries `aria-current="page"` and
 * is plain text, so the trail never links to where the user already is.
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn(styles.nav, className)}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className={styles.item}>
              {item.href && !isLast ? (
                <Link href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              ) : (
                <span className={styles.current} aria-current="page">
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <span className={styles.separator} aria-hidden="true">
                  /
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
