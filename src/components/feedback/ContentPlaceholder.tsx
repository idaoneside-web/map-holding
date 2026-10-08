import { cn } from "@/lib/cn";
import styles from "./ContentPlaceholder.module.css";

export interface ContentPlaceholderProps {
  /** The specific item MAP Holding must supply. */
  label: string;
  /** Optional plain-language explanation of what is outstanding and why. */
  detail?: string;
  /**
   * A list of named outstanding items. Rendered as a marked list so a reviewer
   * can see exactly which content is still required.
   */
  items?: readonly string[];
  variant?: "inline" | "panel";
  className?: string;
}

/**
 * ContentPlaceholder — a visibly deliberate marker for content that MAP Holding
 * has not supplied yet (Phase 3 §5, §6).
 *
 * This exists so the project never invents an address, a telephone number, an
 * email address, a registration number, a claim or any other corporate fact.
 * An empty region that *says* it is waiting for content is honest; plausible
 * filler is not. It is styled as an intentional scaffold element, not as an
 * error.
 */
export function ContentPlaceholder({
  label,
  detail,
  items,
  variant = "inline",
  className,
}: ContentPlaceholderProps) {
  return (
    <div className={cn(styles.placeholder, styles[variant], className)}>
      <p className={styles.marker}>
        <span className={styles.pill}>Placeholder</span>
        <span className={styles.label}>{label}</span>
      </p>
      {detail ? <p className={styles.detail}>{detail}</p> : null}
      {items && items.length > 0 ? (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item} className={styles.item}>
              <span className={styles.itemMark} aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
