"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/controls/Button";
import styles from "./PortalLoginForm.module.css";

/**
 * PortalLoginForm — the Secure Client Login form.
 *
 * It is a real form that performs a real, navigable action: submitting moves the
 * visitor into the client portal. What it is NOT is an authentication system —
 * no credentials are transmitted or verified, and nothing is stored, because
 * there is no identity provider in this phase. That limitation is stated in the
 * form itself rather than hidden, so the interface never claims a security
 * guarantee the application does not yet provide.
 */
export function PortalLoginForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    router.push("/client-portal/dashboard");
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="portal-email">
          Email address
        </label>
        <input
          id="portal-email"
          name="email"
          type="email"
          className={styles.input}
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="portal-password">
          Password
        </label>
        <input
          id="portal-password"
          name="password"
          type="password"
          className={styles.input}
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </div>

      <Button type="submit" variant="primary" size="lg" fullWidth disabled={submitting}>
        {submitting ? "Signing in…" : "Sign in"}
      </Button>

      <p className={styles.notice}>
        <strong>Preview sign-in.</strong> Authentication is a later phase: no credentials are
        verified and nothing is stored. Submitting takes you straight into the portal preview.
      </p>
    </form>
  );
}
