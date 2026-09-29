'use client'
export function PrintButton() {
  return <button className="btn light small no-print" onClick={() => window.print()}>הדפסה / שמירה כ-PDF</button>
}
