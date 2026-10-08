import { Heading } from "@/components/typography/Text";
import { cn } from "@/lib/cn";
import { NavLink } from "@/components/navigation/NavLink";
import type { FooterGroup } from "@/content/navigation";
import styles from "./FooterColumns.module.css";

export interface FooterColumnsProps {
  groups: readonly FooterGroup[];
  className?: string;
}

/**
 * FooterColumns — the grouped footer navigation.
 *
 * Each group is a labelled `<nav>` landmark containing a heading and a list, so
 * the group title is both a visible label and a navigable heading. The `<h3>`
 * level is correct because `Footer` emits the visually-hidden `<h2>Footer</h2>`
 * above these, keeping the document outline strictly descending.
 */
export function FooterColumns({ groups, className }: FooterColumnsProps) {
  return (
    <div className={cn(styles.columns, className)}>
      {groups.map((group) => (
        <nav key={group.title} aria-label={group.title} className={styles.group}>
          <Heading level={3} className={styles.title}>
            {group.title}
          </Heading>
          <ul className={styles.list}>
            {group.items.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href} label={item.label} context="footer" />
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </div>
  );
}
