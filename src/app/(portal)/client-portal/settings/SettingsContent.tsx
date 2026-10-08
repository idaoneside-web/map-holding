"use client";

import { useState, useCallback } from "react";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Reveal } from "@/components/motion/Reveal";
import { Panel } from "@/components/portal/Panel";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { loadSettings, saveSettings, type PortalSettings } from "@/lib/portal-storage";
import { Text } from "@/components/typography/Text";
import styles from "./page.module.css";

export function PortalSettingsContent() {
  const [settings, setSettings] = useState<PortalSettings>(() => loadSettings());
  const [saved, setSaved] = useState(false);

  const handleToggle = useCallback((key: keyof PortalSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleTimeout = useCallback((minutes: number) => {
    setSettings((prev) => ({ ...prev, sessionTimeoutMinutes: minutes }));
  }, []);

  const handleSave = useCallback(() => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [settings]);

  return (
    <Container size="portal">
      <Stack gap="xl">
        <PortalPageHeader
          eyebrow="Settings"
          title="Your settings"
          lead="How your client environment behaves for you."
        />

        <Reveal>
          <Panel title="Account" level={2}>
            <div className={styles.row}>
              <p className={styles.note}>
                Your account details and how MAP Holding reaches you.
              </p>
              <a href="/client-portal/profile" className={styles.actionLink}>
                Manage account
              </a>
            </div>
          </Panel>
        </Reveal>

        <Reveal>
          <Panel title="Security" level={2}>
            <div className={styles.row}>
              <p className={styles.note}>
                Sign-in method and active sessions. Password changes require a real authentication
                system and are not available in preview mode.
              </p>
              <span className={styles.disabledHint}>Requires authenticated backend</span>
            </div>
          </Panel>
        </Reveal>

        <Reveal>
          <Panel title="Notifications" level={2}>
            <div className={styles.settingsRow}>
              <div className={styles.settingItem}>
                <div className={styles.settingLabel}>
                  <span className={styles.settingTitle}>Email notifications</span>
                  <span className={styles.settingDesc}>
                    Receive updates about your applications and projects by email.
                  </span>
                </div>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={() => handleToggle("emailNotifications")}
                  />
                  <span className={styles.toggleSlider} />
                </label>
              </div>
              <div className={styles.settingItem}>
                <div className={styles.settingLabel}>
                  <span className={styles.settingTitle}>In-portal notifications</span>
                  <span className={styles.settingDesc}>
                    See alerts within the client environment.
                  </span>
                </div>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={() => handleToggle("pushNotifications")}
                  />
                  <span className={styles.toggleSlider} />
                </label>
              </div>
            </div>
            <div className={styles.saveBar}>
              {saved ? (
                <Text variant="body-s" tone="gold">
                  Settings saved locally.
                </Text>
              ) : (
                <Text variant="caption" tone="muted">
                  Preview mode — settings are stored locally in your browser only.
                </Text>
              )}
            </div>
          </Panel>
        </Reveal>

        <Reveal>
          <Panel title="Session" level={2}>
            <div className={styles.settingsRow}>
              <div className={styles.settingItem}>
                <div className={styles.settingLabel}>
                  <span className={styles.settingTitle}>Session timeout</span>
                  <span className={styles.settingDesc}>
                    Auto-end the session after inactivity.
                  </span>
                </div>
                <div className={styles.timeoutGroup}>
                  {[15, 30, 60, 120].map((min) => (
                    <button
                      key={min}
                      type="button"
                      className={`${styles.timeoutBtn} ${settings.sessionTimeoutMinutes === min ? styles.timeoutBtnActive : ""}`}
                      onClick={() => handleTimeout(min)}
                    >
                      {min}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.saveBar}>
              {saved ? (
                <Text variant="body-s" tone="gold">
                  Settings saved locally.
                </Text>
              ) : (
                <Text variant="caption" tone="muted">
                  Preview mode — session settings are stored locally in your browser only.
                </Text>
              )}
            </div>
          </Panel>
        </Reveal>
      </Stack>
    </Container>
  );
}
