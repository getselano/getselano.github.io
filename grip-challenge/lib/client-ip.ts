/** The caller's IP as the edge saw it (Netlify sets the first header). */
export function clientIp(h: Headers): string | null {
  return (
    h.get('x-nf-client-connection-ip') ||
    h.get('x-forwarded-for')?.split(',')[0].trim() ||
    h.get('x-real-ip') ||
    null
  )
}
