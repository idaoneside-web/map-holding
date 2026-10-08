import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * Deployment: the Phase 3 site is entirely static (every route prerenders —
   * no API routes, route handlers, server actions, cookies() or headers()), so
   * it is emitted as a static export and hosted as static assets on Cloudflare
   * Pages. This adds no runtime dependency and does not change the rendered
   * output; it only replaces the Node server with pre-generated files.
   */
  output: "export",

  /**
   * Next.js 16 blocks requests for dev resources (the HMR client, dev chunk
   * endpoints) from origins it does not recognise. Browsing the dev server on
   * `http://127.0.0.1:3100` was silently blocked, which prevented client
   * hydration entirely — the SSR HTML rendered, but no component booted, so the
   * mobile drawer and the 3D hero never initialised.
   *
   * `localhost` is recognised by default; `127.0.0.1` and the LAN address are
   * listed so the site can also be opened for local device testing over Wi-Fi.
   */
  allowedDevOrigins: ["127.0.0.1", "localhost", "172.20.10.3"],
};

export default nextConfig;
