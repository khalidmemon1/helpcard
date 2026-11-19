/**
 * The one address printed in every QR code. It must keep working for years, so it's our own domain on Cloudflare,
 * never the Cloud Run (run.app) address: if hosting changes, printed cards still scan.
 */
export const SITE = "https://helpcard.nuvolin.com";
