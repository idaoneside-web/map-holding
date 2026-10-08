import { cn } from "@/lib/cn";
import type { ApplicationStage, StageState } from "@/content/portal";
import styles from "./ProgressTracker.module.css";

export interface ProgressTrackerProps {
  stages: readonly ApplicationStage[];
  /** Optional accessible name for the ordered process. */
  label?: string;
  className?: string;
}

const STATE_LABEL: Record<StageState, string> = {
  complete: "Completed",
  active: "Current step",
  attention: "Action required",
  upcoming: "Not yet reached",
};

/**
 * ProgressTracker — the guided application process (Application → Documents →
 * Review → Decision).
 *
 * The point of this component is orientation: the client should see immediately
 * where they are, what is done, what is waiting and what comes next. State is
 * therefore carried by three signals — the marker glyph, the textual note and an
 * `aria` description — never by colour alone (Phase 1 §L).
 *
 * Horizontal from 768px; a clean vertical rail below it, so the process reads
 * equally well on a phone.
 */
export function ProgressTracker({
  stages,
  label = "Application progress",
  className,
}: ProgressTrackerProps) {
  return (
    <ol className={cn(styles.tracker, className)} aria-label={label}>
      {stages.map((stage) => (
        <li
          key={stage.id}
          className={cn(styles.stage, styles[stage.state])}
          data-state={stage.state}
        >
          <span className={styles.markerWrap}>
            <Marker state={stage.state} />
          </span>
          <span className={styles.text}>
            <span className={styles.label}>{stage.label}</span>
            {stage.note ? <span className={styles.note}>{stage.note}</span> : null}
            <span className="u-visually-hidden">{STATE_LABEL[stage.state]}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function Marker({ state }: { state: StageState }) {
  if (state === "complete") {
    return (
      <span className={styles.check} aria-hidden="true">
        ✓
      </span>
    );
  }
  if (state === "attention") {
    return (
      <span className={styles.bang} aria-hidden="true">
        !
      </span>
    );
  }
  if (state === "active") {
    return <span className={styles.dot} aria-hidden="true" />;
  }
  return <span className={styles.dotHollow} aria-hidden="true" />;
}
