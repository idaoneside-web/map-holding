import { Link } from "@/components/controls/Link";
import { legalNav } from "@/content/navigation";
import styles from "./LegalBar.module.css";

export interface LegalBarProps {
  /** Copyright year. Passed in so the shell stays a pure function of its inputs. */
  year: number;
  className?: string;
}

/**
 * LegalBar — copyright line plus legal destinations.
 *
 * The notice is deliberately limited to the copyright convention. Legal entity
 * name and registration details are *not* stated here because they have not
 * been supplied, and this project invents no corporate facts (Phase 3 §5).
 */
export function LegalBar({ year, className }: LegalBarProps) {
  return (
    <div className={styles.bar}>
      <p className={styles.copyright}>© {year} MAP Holding. All rights reserved.</p>
      <nav aria-label="Legal" className={styles.nav}>
        <ul className={styles.list}>
          {legalNav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} variant="subtle" className={styles.link}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
