import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/**
 * MAP Holding — ESLint (flat config).
 * `eslint-config-next` v16 already ships a flat-config array that bundles the
 * Next, React, hooks, import and TypeScript plugins, so nothing is re-declared.
 */
const config = [
  ...nextCoreWebVitals,

  {
    files: ["src/components/brand/**/*.tsx"],
    rules: {
      /**
       * Approved brand lockups are fixed-size, pre-optimised raster assets that are
       * copied verbatim from the identity board. They are served directly rather
       * than routed through the framework image optimiser, which would only
       * re-encode artwork that must not change (Phase 2 §6).
       */
      "@next/next/no-img-element": "off",
    },
  },

  {
    ignores: [".next/**", "out/**", "build/**", "node_modules/**", "preview/**", "next-env.d.ts"],
  },
];

export default config;
