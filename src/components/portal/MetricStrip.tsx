import Link from "next/link";
import { cn } from "@/lib/cn";
import { portalMetrics } from "@/content/portal";
import styles from "./MetricStrip.module.css";

export interface MetricStripProps {
  className?: string;
}

/**
 * MetricStrip — the dashboard's "what do I have" row.
 *
 * Rendered as a single bordered strip divided by hairlines rather than four
 * separate cards: fewer boxes, less visual noise, and the numbers read as one
 * set. Each metric links to the area it counts.
 */
export function MetricStrip({ className }: MetricStripProps) {
  return (
    <ul className={cn(styles.strip, className)}>
      {portalMetrics.map((metric) => (
        <li key={metric.id} className={styles.item}>
          <Link href={metric.href} className={styles.link}>
            <span className={styles.value}>{metric.value}</span>
            <span className={styles.label}>{metric.label}</span>
            {metric.hint ? <span className={styles.hint}>{metric.hint}</span> : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
