import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Stack } from "@/components/layout/Stack";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Breadcrumbs, type Crumb } from "@/components/layout/Breadcrumbs";
import { Badge } from "@/components/feedback/Badge";
import { ContentPlaceholder } from "@/components/feedback/ContentPlaceholder";
import { Heading, Text } from "@/components/typography/Text";
import { AccessMatrix } from "./AccessMatrix";
import styles from "./GatedEntry.module.css";

export interface GatedEntryProps {
  eyebrow: string;
  title: string;
  intro: string;
  /** Facts about the environment's scope. Never invented content. */
  facts: readonly string[];
  /** What an authorized principal of this environment will be able to see. */
  visible?: readonly string[];
  /** What must remain structurally unreachable. */
  neverVisible?: readonly string[];
  /** Named content that does not exist yet. */
  outstanding: readonly string[];
  children?: ReactNode;
}

/**
 * GatedEntry — the shared body of a protected *entry point* (Phase 3 §16).
 *
 * It is emphatically NOT a portal, and NOT a login screen. There is no form, no
 * credential field, no session and no check to bypass. What it does is state, in
 * public, how the access boundary is drawn — and it draws that statement from
 * the real contract module via `AccessMatrix`.
 */
export function GatedEntry({
  eyebrow,
  title,
  intro,
  facts,
  visible,
  neverVisible,
  outstanding,
  children,
}: GatedEntryProps) {
  const crumbs: readonly Crumb[] = [{ label: "Home", href: "/" }, { label: title }];

  return (
    <>
      <Section tone="navy-deep" spacing="md">
        <Container>
          <Stack gap="md">
            <Breadcrumbs items={crumbs} />
            <SectionHeader level={1} eyebrow={eyebrow} title={title} lead={intro} />
            <p className={styles.notice}>
              <Badge locked>Protected</Badge>
              <span>
                Not available in this phase. Authentication, sessions and the environment itself are
                later phases — nothing on this page grants access or simulates it.
              </span>
            </p>
          </Stack>
        </Container>
      </Section>

      <Section tone="default" spacing="lg">
        <Container>
          <Stack gap="lg">
            <SectionHeader
              level={2}
              title="Scope"
              lead="What this environment is, and how it is separated from every other part of the group."
            />
            <ul className={styles.facts}>
              {facts.map((fact) => (
                <li key={fact} className={styles.fact}>
                  <span className={styles.factMark} aria-hidden="true" />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </Stack>
        </Container>
      </Section>

      {visible || neverVisible ? (
        <Section tone="subtle" spacing="lg">
          <Container>
            <Stack gap="lg">
              <SectionHeader
                level={2}
                title="What authorization decides"
                lead="Enforced at the data and API layer, never by hiding interface elements."
              />
              <div className={styles.split}>
                {visible ? (
                  <div className={styles.panel}>
                    <Heading level={3} className={styles.panelTitle}>
                      Authorized to see
                    </Heading>
                    <ul className={styles.list}>
                      {visible.map((item) => (
                        <li key={item} className={styles.listItem}>
                          <span className={styles.allowMark} aria-hidden="true">
                            ✓
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {neverVisible ? (
                  <div className={styles.panel}>
                    <Heading level={3} className={styles.panelTitle}>
                      Must never be reachable
                    </Heading>
                    <ul className={styles.list}>
                      {neverVisible.map((item) => (
                        <li key={item} className={styles.listItem}>
                          <span className={styles.denyMark} aria-hidden="true">
                            &times;
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
              {children}
            </Stack>
          </Container>
        </Section>
      ) : null}

      <Section tone="default" spacing="lg">
        <Container>
          <Stack gap="lg">
            <SectionHeader
              level={2}
              title="Authorization model"
              lead="This matrix is generated from the shipped access-control contract, not typed by hand. If a clearance ceiling ever changes, this table changes with it."
            />
            <AccessMatrix />

            <ContentPlaceholder
              variant="panel"
              label="Required before this environment can be built"
              detail="Nothing here is simulated. These are the real prerequisites."
              items={outstanding}
            />

            <Text variant="body-s" tone="muted" className={styles.docNote}>
              Full architecture:{" "}
              <code className={styles.code}>docs/ACCESS-CONTROL-ARCHITECTURE.md</code>
            </Text>
          </Stack>
        </Container>
      </Section>
    </>
  );
}
