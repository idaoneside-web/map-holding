/**
 * Resolve a CSS custom property to its *computed* value in the browser.
 *
 * `getPropertyValue` on a custom property returns the raw token text (which may
 * itself be `var(--x)`), so we resolve it by applying it to real property on a
 * throwaway element and reading back the computed result. This is what allows
 * the validation gallery to report the values that actually ship rather than a
 * duplicated copy of the palette.
 */
export function resolveTokenValue(token: string, property = "color", fallback = ""): string {
  if (typeof document === "undefined") return fallback;

  const probe = document.createElement("span");
  probe.style.position = "absolute";
  probe.style.width = "0";
  probe.style.height = "0";
  probe.style.visibility = "hidden";
  probe.style.setProperty(property, `var(${token})`);
  document.body.appendChild(probe);

  // Reading any layout-affecting property forces style resolution.
  void probe.offsetWidth;

  const value = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();

  return value.trim() || fallback;
}
