import Link from "next/link";
import { cn } from "@/lib/cn";
import type { PortalUser } from "@/content/portal";
import { PortalGlyph } from "./PortalGlyphs";
import { Avatar, initialsFrom } from "./Avatar";
import styles from "./PortalAccount.module.css";

export interface PortalAccountProps {
  user: PortalUser;
  context?: "rail" | "drawer";
}

/**
 * PortalAccount — who is signed in, and the sign-out affordance.
 *
 * Sign-out is a real link that returns the visitor to the public Client Portal
 * landing page — a genuine, navigable action rather than a button that does
 * nothing. What it cannot yet do is destroy a session, because no authenticated
 * session exists in this preview; that is stated plainly beneath it.
 */
export function PortalAccount({ user, context = "rail" }: PortalAccountProps) {
  const initials = initialsFrom(user.fullName);

  return (
    <div className={cn(styles.account, styles[context])}>
      <div className={styles.identity}>
        <Avatar initials={initials} />
        <div className={styles.detail}>
          <span className={styles.name}>{user.fullName}</span>
          <span className={styles.company}>{user.company}</span>
        </div>
      </div>

      <Link href="/client-portal" className={styles.signOut}>
        <span className={styles.signOutGlyph}>
          <PortalGlyph name="signout" />
        </span>
        <span>Sign Out</span>
      </Link>

      <p className={styles.note}>Returns you to the public MAP Holding website.</p>
    </div>
  );
}
