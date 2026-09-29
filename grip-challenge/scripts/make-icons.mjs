// Renders the PWA icons (PNG) from an inline SVG with the pre-installed Chromium.
import { chromium } from 'playwright'
const hand = `<path d="M7 12V7.5a1.5 1.5 0 0 1 3 0V11M10 10.5V6a1.5 1.5 0 0 1 3 0v4.5M13 10V7a1.5 1.5 0 0 1 3 0v5M16 10.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 5 14.5V12a1.5 1.5 0 0 1 2-1.4" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`
const svg = (size, pad, radius) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
  <rect width="24" height="24" rx="${radius}" fill="#0F6E56"/>
  <g transform="translate(${pad} ${pad}) scale(${(24 - 2 * pad) / 24})">${hand}</g></svg>`
const out = [
  ['icon-192.png', 192, 3.5, 5],
  ['icon-512.png', 512, 3.5, 5],
  ['icon-maskable-512.png', 512, 6, 0],
  ['apple-touch-icon.png', 180, 3.5, 0],
]
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
const page = await browser.newPage()
for (const [name, size, pad, radius] of out) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg(size, pad, radius)}</body></html>`)
  await page.locator('svg').screenshot({ path: `public/icons/${name}`, omitBackground: true })
}
await browser.close()
