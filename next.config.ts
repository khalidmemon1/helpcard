import type { NextConfig } from "next";

// A plain static site in out/: there's no database and the card lives in the QR, so no Node server is needed.
// The same out/ folder is served by Cloud Run (Dockerfile, nginx) and by Cloudflare (wrangler.jsonc).
const nextConfig: NextConfig = { output: "export", turbopack: { root: __dirname } };

export default nextConfig;
