import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Sora } from "next/font/google";

/* Token layer first, then the base layer. Global CSS is imported only here. */
import "@/styles/tokens/color.css";
import "@/styles/tokens/type.css";
import "@/styles/tokens/space.css";
import "@/styles/tokens/radius.css";
import "@/styles/tokens/shadow.css";
import "@/styles/tokens/border.css";
import "@/styles/tokens/motion.css";
import "@/styles/tokens/layout.css";
import "@/styles/base/reset.css";
import "@/styles/base/globals.css";

/**
 * Fonts are fetched at build time and self-hosted by the framework, so there is
 * no runtime font-CDN dependency (Phase 1 §B.1 / §N). The generated CSS
 * variables feed the `--font-family-*` typography tokens.
 *
 * Only the weights the type scale actually uses are loaded: Sora 400/600 for
 * display and headings, Inter 400/500/600 for body, UI, labels and buttons.
 */
const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-sora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MAP Holding — People • Resources • Opportunity",
    template: "%s — MAP Holding",
  },
  description:
    "MAP Holding. People • Resources • Opportunity. Phase 3 of the public site: shell, navigation and structural routes.",
  applicationName: "MAP Holding",
  /* The public shell is indexable; the gated groups opt out per group and the
     internal brand gallery opts out individually (Phase 1 §M). */
  robots: { index: true, follow: true },
  icons: { icon: "/brand/icon-256.png" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
