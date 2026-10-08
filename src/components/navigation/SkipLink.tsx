import styles from "./SkipLink.module.css";

export interface SkipLinkProps {
  /** Element id to jump to. Must exist on the page (rendered by the shell). */
  targetId?: string;
}

/**
 * SkipLink — the first focusable element in the document.
 *
 * Lets a keyboard user bypass the header navigation and land directly in
 * `<main>`. It is visually hidden until focused, at which point it becomes a
 * fully visible, high-contrast control (Phase 1 §L).
 */
export function SkipLink({ targetId = "main-content" }: SkipLinkProps) {
  return (
    <a href={`#${targetId}`} className={styles.skip}>
      Skip to main content
    </a>
  );
}
