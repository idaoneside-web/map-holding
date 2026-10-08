"use client";

import { useSyncExternalStore, useState } from "react";
import { Button } from "@/components/controls/Button";
import { Reveal } from "@/components/motion/Reveal";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { Heading, Text } from "@/components/typography/Text";
import styles from "./MotionLab.module.css";

const QUERY = "(prefers-reduced-motion: reduce)";

/** `null` means "not measured yet" — the server render cannot know the preference. */
type MotionPreference = boolean | null;

function subscribeToPreference(onChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const getPreference = (): MotionPreference => window.matchMedia(QUERY).matches;

const getServerPreference = (): MotionPreference => null;

/**
 * MotionLab — interactive validation of the Phase 1 §I motion system.
 *
 * Reports the live `prefers-reduced-motion` preference and lets the approved
 * reveal motion be replayed. The same CSS powers reduced-motion behaviour, so
 * toggling the OS setting is the real test.
 */
export function MotionLab() {
  const reduced = useSyncExternalStore(subscribeToPreference, getPreference, getServerPreference);
  const [runId, setRunId] = useState(0);

  return (
    <div className={styles.lab}>
      <div className={styles.readout}>
        <Text variant="body-s" tone="muted">
          Live preference
        </Text>
        <StatusBadge tone={reduced ? "info" : "success"}>
          {reduced === null ? "measuring…" : reduced ? "reduced motion: on" : "reduced motion: off"}
        </StatusBadge>
        <Text variant="body-s" tone="default" className={styles.hint}>
          <code>{QUERY}</code> evaluates to{" "}
          <code>{reduced === null ? "…" : reduced ? "true" : "false"}</code>.{" "}
          {reduced
            ? "Durations and distances collapse to ~0; content is shown instantly and the stagger is removed."
            : "Reveal uses a fade + rise with a staggered delay capped at 80ms between siblings."}
        </Text>
      </div>

      <div className={styles.stage} key={runId}>
        {[0, 80, 160].map((delay) => (
          <Reveal key={delay} delay={delay}>
            <div className={styles.tile}>
              <Text variant="caption" tone="muted">
                delay {delay}ms
              </Text>
              <Heading level={4} tone="strong">
                Rise + fade
              </Heading>
            </div>
          </Reveal>
        ))}
      </div>

      <div className={styles.controls}>
        <Button size="sm" variant="outline" onClick={() => setRunId((n) => n + 1)}>
          Replay reveal
        </Button>
        <Button size="sm" variant="primary" className={styles.glow}>
          Primary CTA (hover for gold glow)
        </Button>
      </div>
    </div>
  );
}
