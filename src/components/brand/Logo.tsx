import { logoAssets, type LogoVariant } from "@/lib/brand";
import { cn } from "@/lib/cn";
import styles from "./Logo.module.css";

export interface LogoProps {
  /** Which approved lockup to render. Defaults to the horizontal nav/footer lockup. */
  variant?: LogoVariant;
  /** Rendered width in CSS pixels. Height is derived from the asset's intrinsic ratio. */
  size?: number;
  /** Accessible name. Pass `""` when the lockup is purely decorative. */
  alt?: string;
  className?: string;
  /** Rendered immediately instead of lazily (use for above-the-fold lockups). */
  priority?: boolean;
}

/**
 * Logo — renders an approved MAP Holding lockup.
 *
 * Brand rules enforced here:
 *  - aspect ratio is locked to the approved asset, so the mark can never stretch;
 *  - the source file is never substituted, recoloured or redrawn;
 *  - width is floored at the variant's documented minimum legible size.
 *
 * The logo is a fixed-size, pre-optimised brand asset, so it is served directly
 * rather than through the framework image optimiser (see eslint override).
 */
export function Logo({
  variant = "horizontal-dark",
  size,
  alt = "MAP Holding",
  className,
  priority = false,
}: LogoProps) {
  const asset = logoAssets[variant];
  const width = Math.max(size ?? asset.minWidth, asset.minWidth);
  const height = Math.round((width / asset.width) * asset.height);

  return (
    <img
      src={asset.src}
      alt={alt}
      width={width}
      height={height}
      // Keep the intrinsic ratio explicit for any layout that overrides width.
      style={{ width, height: "auto", aspectRatio: `${asset.width} / ${asset.height}` }}
      className={cn(styles.logo, className)}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
    />
  );
}
