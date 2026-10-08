"use client";

import { useState, useCallback } from "react";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Button } from "@/components/controls/Button";
import { Reveal } from "@/components/motion/Reveal";
import { Panel } from "@/components/portal/Panel";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { portalUser, toUserEditForm, type PortalUserEditForm } from "@/content/portal";
import { saveUserEdit, loadUserEdit } from "@/lib/portal-storage";
import { Text } from "@/components/typography/Text";
import styles from "./page.module.css";

export function PortalProfileContent() {
  const loadInitialForm = (): PortalUserEditForm => {
    const edit = loadUserEdit();
    if (edit) {
      return {
        firstName: edit.firstName,
        lastName: edit.lastName,
        company: edit.company,
        email: edit.email,
        phone: edit.phone,
        country: edit.country,
      };
    }
    return toUserEditForm(portalUser);
  };

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PortalUserEditForm>(loadInitialForm);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleChange = useCallback(
    (field: keyof PortalUserEditForm, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setError("");
      setSaved(false);
    },
    [],
  );

  const handleSave = useCallback(() => {
    if (!form.firstName.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    saveUserEdit(form);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [form]);

  const user = (() => {
    const edit = loadUserEdit();
    if (!edit) return portalUser;
    const fullName = edit.firstName + " " + edit.lastName;
    return {
      ...portalUser,
      firstName: edit.firstName,
      lastName: edit.lastName,
      fullName: fullName.trim(),
      company: edit.company,
      email: edit.email,
      phone: edit.phone,
      country: edit.country,
    };
  })();

  return (
    <Container size="portal">
      <Stack gap="xl">
        <PortalPageHeader
          eyebrow="Profile"
          title="Your profile"
          lead="The account details MAP Holding holds for you."
        />

        <Reveal>
          <Panel
            title="Account information"
            level={2}
            action={
              <div className={styles.actions}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(true);
                    setError("");
                  }}
                >
                  Edit Profile
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Change Password
                </Button>
              </div>
            }
          >
            {editing ? (
              <EditForm
                form={form}
                onChange={handleChange}
                onSave={handleSave}
                onCancel={() => {
                  setEditing(false);
                  setError("");
                }}
                saved={saved}
                error={error}
              />
            ) : (
              <dl className={styles.fields}>
                <Field term="Name" value={user.fullName} />
                <Field term="Company" value={user.company} />
                <Field term="Email" value={user.email} />
                <Field term="Phone" value={user.phone} />
                <Field term="Country" value={user.country} />
                <Field term="Account reference" value={user.accountRef} />
                <Field term="Client since" value={user.clientSince} />
              </dl>
            )}
          </Panel>
        </Reveal>

        <Reveal>
          <Panel title="Password" level={2}>
            <Text variant="body-s" tone="muted">
              Changing your password requires a real authentication system. In this preview
              environment no password store exists, so password changes cannot be performed. When
              the portal connects to an identity provider this control will become active.
            </Text>
          </Panel>
        </Reveal>
      </Stack>
    </Container>
  );
}

function EditForm({
  form,
  onChange,
  onSave,
  onCancel,
  saved,
  error,
}: {
  form: PortalUserEditForm;
  onChange: (field: keyof PortalUserEditForm, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saved: boolean;
  error: string;
}) {
  return (
    <>
      <div className={styles.editGrid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="profile-first">
            First name
          </label>
          <input
            id="profile-first"
            className={styles.input}
            value={form.firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="profile-last">
            Last name
          </label>
          <input
            id="profile-last"
            className={styles.input}
            value={form.lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="profile-company">
            Company
          </label>
          <input
            id="profile-company"
            className={styles.input}
            value={form.company}
            onChange={(e) => onChange("company", e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="profile-email">
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            className={styles.input}
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="profile-phone">
            Phone
          </label>
          <input
            id="profile-phone"
            className={styles.input}
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="profile-country">
            Country
          </label>
          <input
            id="profile-country"
            className={styles.input}
            value={form.country}
            onChange={(e) => onChange("country", e.target.value)}
          />
        </div>
      </div>
      {error && (
        <Text variant="body-s" tone="default" className={styles.error}>
          {error}
        </Text>
      )}
      {saved && (
        <Text variant="body-s" tone="gold" className={styles.saved}>
          Changes saved locally.
        </Text>
      )}
      <div className={styles.editActions}>
        <Button variant="primary" size="sm" onClick={onSave}>
          Save changes
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      <Text variant="caption" tone="muted" className={styles.previewNote}>
        Preview mode — changes are stored locally in your browser only.
      </Text>
    </>
  );
}

function Field({ term, value }: { term: string; value: string }) {
  return (
    <div className={styles.field}>
      <dt className={styles.term}>{term}</dt>
      <dd className={styles.value}>{value}</dd>
    </div>
  );
}
