import type { Metadata } from "next";
import { PortalSettingsContent } from "./SettingsContent";

export const metadata: Metadata = {
  title: "Settings",
  description: "Account, security, notification and session settings.",
  robots: { index: false, follow: false },
};

/**
 * /client-portal/settings — the client's control over their own environment.
 */
export default function PortalSettingsPage() {
  return <PortalSettingsContent />;
}
