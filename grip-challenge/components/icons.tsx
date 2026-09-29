// Inline stroke icons (spec §8: SVG stroke, no emoji).
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

function Svg({ size = 24, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const Flame = (p: P) => (
  <Svg {...p}>
    <path d="M12 3c.6 3.2-1.8 5-3.3 7A6.5 6.5 0 0 0 12 21a6.5 6.5 0 0 0 6.5-6.5c0-3.4-2-5.3-3.5-7-.4 1.6-1.2 2.6-2.3 3C13.5 8 13.4 5.2 12 3Z" />
    <path d="M12 21a2.8 2.8 0 0 1-2.8-2.8c0-1.9 1.6-2.6 2.8-4.2 1.2 1.6 2.8 2.3 2.8 4.2A2.8 2.8 0 0 1 12 21Z" />
  </Svg>
)
export const Check = (p: P) => (
  <Svg strokeWidth={3} {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
)
export const Home = (p: P) => (
  <Svg {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20h5v-6h4v6h5V9.5" />
  </Svg>
)
export const Chart = (p: P) => (
  <Svg {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Svg>
)
export const Users = (p: P) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
  </Svg>
)
export const Utensils = (p: P) => (
  <Svg {...p}>
    <path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10" />
    <path d="M17 21V3c-2.2 1.2-3.5 3.6-3.5 6.5V13H17" />
  </Svg>
)
export const Dumbbell = (p: P) => (
  <Svg {...p}>
    <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
  </Svg>
)
export const Scale = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <path d="M8.5 9a5 5 0 0 1 7 0L13 12" />
  </Svg>
)
export const Calendar = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="16" rx="3" />
    <path d="M3 9.5h18M8 3v3M16 3v3" />
  </Svg>
)
export const Chevron = (p: P) => (
  <Svg {...p}>
    <path d="m14.5 6-6 6 6 6" />
  </Svg>
)
export const Gift = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M5 12v9h14v-9M12 8v13M12 8S10.5 3.5 8 4.2C6 4.8 7 8 12 8Zm0 0s1.5-4.5 4-3.8C18 4.8 17 8 12 8Z" />
  </Svg>
)
export const Target = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" />
  </Svg>
)
export const Alert = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5 2.5 20h19L12 3.5Z" />
    <path d="M12 10v4M12 17.2v.1" />
  </Svg>
)
export const Phone = (p: P) => (
  <Svg {...p}>
    <path d="M5 3.5h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 6.8 6.8l1.4-2.2 4.5 1.5V19a2 2 0 0 1-2 2A17 17 0 0 1 3 5.5a2 2 0 0 1 2-2Z" />
  </Svg>
)
export const Message = (p: P) => (
  <Svg {...p}>
    <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12Z" />
  </Svg>
)
export const Plus = (p: P) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)
export const Clock = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
)
export const Leaf = (p: P) => (
  <Svg {...p}>
    <path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15" />
    <path d="M5 19 12 12" />
  </Svg>
)
export const Trophy = (p: P) => (
  <Svg {...p}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4M12 13v4M8.5 20h7M10 17h4" />
  </Svg>
)
export const Logout = (p: P) => (
  <Svg {...p}>
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M9 16l-4-4 4-4M5 12h10" />
  </Svg>
)
export const Grip = (p: P) => (
  <Svg {...p}>
    <path d="M7 12V7.5a1.5 1.5 0 0 1 3 0V11M10 10.5V6a1.5 1.5 0 0 1 3 0v4.5M13 10V7a1.5 1.5 0 0 1 3 0v5M16 10.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 5 14.5V12a1.5 1.5 0 0 1 2-1.4" />
  </Svg>
)
