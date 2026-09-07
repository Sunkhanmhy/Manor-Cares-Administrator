import type { SVGProps } from 'react';

export type IconName =
  | 'dashboard'
  | 'users'
  | 'user-plus'
  | 'calendar'
  | 'sparkles'
  | 'truck'
  | 'car'
  | 'briefcase'
  | 'dollar'
  | 'card'
  | 'receipt'
  | 'trending-up'
  | 'megaphone'
  | 'tag'
  | 'headset'
  | 'star'
  | 'wrench'
  | 'bar-chart'
  | 'bell'
  | 'shield'
  | 'scroll'
  | 'settings'
  | 'logout'
  | 'check-circle'
  | 'x-circle'
  | 'sun'
  | 'skip-forward'
  | 'flag'
  | 'alert-triangle'
  | 'target'
  | 'clock'
  | 'refund'
  | 'leaf'
  | 'map-pin'
  | 'plus'
  | 'arrow-right'
  | 'menu';

/** Every icon is a flat, single-color 24x24 line drawing (2px stroke, round caps/joins). */
const PATHS: Record<IconName, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
    </>
  ),
  users: (
    <>
      <circle cx="8.5" cy="7.5" r="3" />
      <path d="M2.5 20a6 6 0 0 1 12 0" />
      <circle cx="17" cy="8.5" r="2.4" />
      <path d="M15 13.5c2.9.5 5 2.9 5 6.2" />
    </>
  ),
  'user-plus': (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M18 8v6" />
      <path d="M15 11h6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </>
  ),
  sparkles: (
    <>
      <circle cx="7" cy="16" r="2.1" />
      <circle cx="13.5" cy="18" r="1.3" />
      <circle cx="16" cy="8" r="3.1" />
      <circle cx="10" cy="9" r="1.5" />
    </>
  ),
  truck: (
    <>
      <rect x="1.5" y="7" width="13" height="9" rx="1.5" />
      <path d="M14.5 10h3.7L21 13.3V16h-2" />
      <circle cx="6" cy="18.2" r="1.8" />
      <circle cx="17" cy="18.2" r="1.8" />
      <path d="M8 18.2h6.2" />
    </>
  ),
  car: (
    <>
      <path d="M4 15.5 5.6 10a2 2 0 0 1 1.9-1.4h9a2 2 0 0 1 1.9 1.4L20 15.5" />
      <rect x="2.5" y="15.5" width="19" height="4.5" rx="1.5" />
      <circle cx="7" cy="20" r="1.6" />
      <circle cx="17" cy="20" r="1.6" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2.5" y="7" width="19" height="12.5" rx="2" />
      <path d="M8.5 7V5.5A2 2 0 0 1 10.5 3.5h3A2 2 0 0 1 15.5 5.5V7" />
      <path d="M2.5 12.5h19" />
    </>
  ),
  dollar: (
    <>
      <path d="M12 2.5v19" />
      <path d="M16.5 6.5c0-1.9-2-3-4.5-3s-4.5 1.2-4.5 3 2 2.6 4.5 3 4.5 1.1 4.5 3-2 3-4.5 3-4.5-1.1-4.5-3" />
    </>
  ),
  card: (
    <>
      <rect x="2" y="5.5" width="20" height="13" rx="2.2" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 2.5h12v19l-2.5-1.6L13 21.5l-2.5-1.6L8 21.5l-2-1.6z" />
      <path d="M8.5 8h7" />
      <path d="M8.5 12h7" />
      <path d="M8.5 16h4.5" />
    </>
  ),
  'trending-up': (
    <>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 6h6v6" />
    </>
  ),
  megaphone: (
    <>
      <path d="M3 10v4a1.5 1.5 0 0 0 1.5 1.5H6l4.5 4V4.5L6 8.5H4.5A1.5 1.5 0 0 0 3 10z" />
      <path d="M14 8.5a4 4 0 0 1 0 7" />
      <path d="M17.5 6a7.5 7.5 0 0 1 0 12" />
    </>
  ),
  tag: (
    <>
      <path d="M12.5 3.5H5A1.5 1.5 0 0 0 3.5 5v7.5a1.5 1.5 0 0 0 .44 1.06l9 9a1.5 1.5 0 0 0 2.12 0l7.5-7.5a1.5 1.5 0 0 0 0-2.12l-9-9a1.5 1.5 0 0 0-1.06-.44z" />
      <circle cx="8" cy="8.5" r="1.6" />
    </>
  ),
  headset: (
    <>
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <rect x="2.5" y="13" width="4" height="6" rx="1.5" />
      <rect x="17.5" y="13" width="4" height="6" rx="1.5" />
      <path d="M20 19v.5a3 3 0 0 1-3 3h-3" />
    </>
  ),
  star: <path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z" />,
  wrench: (
    <path d="M14.7 6.3a4 4 0 0 0-5.6 5l-6.6 6.6 2.6 2.6 6.6-6.6a4 4 0 0 0 5-5.6l-2.7 2.7-2-2z" />
  ),
  'bar-chart': (
    <>
      <path d="M4 20V10" />
      <path d="M11 20V4" />
      <path d="M18 20v-7" />
      <path d="M2.5 20.5h19" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0v4.5l1.8 3H4.2L6 13.5z" />
      <path d="M9.5 20a2.5 2.5 0 0 0 5 0" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.5 4.5 5.5v5.7c0 5 3.2 8 7.5 10.3 4.3-2.3 7.5-5.3 7.5-10.3V5.5z" />
      <path d="M8.7 12l2.4 2.4 4.2-4.6" />
    </>
  ),
  scroll: (
    <>
      <rect x="5" y="3.5" width="13" height="17" rx="2.2" />
      <path d="M8.5 8h6" />
      <path d="M8.5 12h6" />
      <path d="M8.5 16h3.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a7.7 7.7 0 0 0 0-3l1.9-1.5-2-3.4-2.3.8a7.7 7.7 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.4a7.7 7.7 0 0 0-2.6 1.5l-2.3-.8-2 3.4L4.6 10.5a7.7 7.7 0 0 0 0 3l-1.9 1.5 2 3.4 2.3-.8a7.7 7.7 0 0 0 2.6 1.5l.4 2.4h4l.4-2.4a7.7 7.7 0 0 0 2.6-1.5l2.3.8 2-3.4z" />
    </>
  ),
  logout: (
    <>
      <path d="M9 3.5H6A2.5 2.5 0 0 0 3.5 6v12A2.5 2.5 0 0 0 6 20.5h3" />
      <path d="M14 16l4.5-4-4.5-4" />
      <path d="M18.3 12H9.5" />
    </>
  ),
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.3l2.6 2.6L16.2 9" />
    </>
  ),
  'x-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" />
    </>
  ),
  'skip-forward': (
    <>
      <path d="M5 5l9 7-9 7V5z" />
      <path d="M18 5v14" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4h11l-2.2 4L16 12H5" />
    </>
  ),
  'alert-triangle': (
    <>
      <path d="M12 3.5 21.5 20h-19z" />
      <path d="M12 9.5v5" />
      <path d="M12 17.3v.1" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.5l3.8 2.2" />
    </>
  ),
  refund: (
    <>
      <path d="M7.5 8.5H15a5 5 0 0 1 0 10h-2.5" />
      <path d="M11 4.5 7 8.5l4 4" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c8 0 14-6 14-14 0 0-13-1-14 12z" />
      <path d="M6 18c2-3 4-6 9-10.5" />
    </>
  ),
  'map-pin': (
    <>
      <path d="M12 21s-7-6.4-7-11.5A7 7 0 0 1 19 9.5C19 14.6 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.4" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  'arrow-right': (
    <>
      <path d="M4 12h16" />
      <path d="M13 5l7 7-7 7" />
    </>
  ),
  menu: (
    <>
      <path d="M4 6.5h16" />
      <path d="M4 12h16" />
      <path d="M4 17.5h16" />
    </>
  ),
};

export function Icon({ name, size = 24, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
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
      {PATHS[name]}
    </svg>
  );
}
