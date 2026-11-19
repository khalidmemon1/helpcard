/**
 * helpcard.nuvolin.com on Cloudflare (free), in front of Cloud Run.
 * - Build files (/_next/static/…) always come from Cloudflare's own copy: Google never serves the heavy bytes.
 * - Pages come from Cloud Run (env.ORIGIN), cached at Cloudflare's edge for 10 minutes, so however many people visit,
 *   Cloud Run only sees a few requests per edge location per 10 minutes and stays inside Google's free tier.
 * - If Cloud Run is slow, failing or switched off (no ORIGIN, billing unlinked…), Cloudflare serves its own copy of
 *   the same build, so printed QR codes keep working no matter what.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
    if (url.pathname.startsWith("/_next/static/") || !env.ORIGIN) return env.ASSETS.fetch(request);

    try {
      const res = await fetch(env.ORIGIN + url.pathname + url.search, {
        cf: { cacheEverything: true, cacheTtl: 600 },
        signal: AbortSignal.timeout(2500),
        redirect: "manual", // a redirect or error from the origin → our own copy, never someone else's page
      });
      if (res.status === 200) return res;
    } catch {
      // fall through to Cloudflare's copy
    }
    return env.ASSETS.fetch(request);
  },
};
