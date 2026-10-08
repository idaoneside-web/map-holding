import type { Metadata } from "next";
import { PortalProfileContent } from "./ProfileContent";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your MAP Holding client account details.",
  robots: { index: false, follow: false },
};

/**
 * /client-portal/profile — the client's own account details.
 */
export default function PortalProfilePage() {
  return <PortalProfileContent />;
}
