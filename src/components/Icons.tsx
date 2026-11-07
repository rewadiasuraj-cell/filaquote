import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = ({ size = 18, ...p }: P) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...p,
});

export const Upload = (p: P) => (<svg {...base(p)}><path d="M12 16V4" /><path d="m6 10 6-6 6 6" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg>);
export const Cube = (p: P) => (<svg {...base(p)}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5" /><path d="M12 12v9" /></svg>);
export const Check = (p: P) => (<svg {...base(p)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>);
export const Alert = (p: P) => (<svg {...base(p)}><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>);
export const Info = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></svg>);
export const Chevron = (p: P) => (<svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>);
export const Sun = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>);
export const Moon = (p: P) => (<svg {...base(p)}><path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" /></svg>);
export const Monitor = (p: P) => (<svg {...base(p)}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>);
export const Copy = (p: P) => (<svg {...base(p)}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a1 1 0 0 1 1-1h10" /></svg>);
export const Download = (p: P) => (<svg {...base(p)}><path d="M12 4v12" /><path d="m6 10 6 6 6-6" /><path d="M4 20h16" /></svg>);
export const Printer = (p: P) => (<svg {...base(p)}><path d="M7 9V3h10v6" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M7 14h10v7H7z" /></svg>);
export const Reset = (p: P) => (<svg {...base(p)}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>);
export const Close = (p: P) => (<svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const Swap = (p: P) => (<svg {...base(p)}><path d="M4 8h13l-3-3" /><path d="M20 16H7l3 3" /></svg>);
export const Target = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></svg>);
export const Github = ({ size = 18, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.7s.8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .6 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z" />
  </svg>
);
export const Logo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
    <defs>
      <linearGradient id="fq-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#facc15" />
        <stop offset="1" stopColor="#f97316" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="8" fill="url(#fq-g)" />
    <path d="M11 8h10l-2 6h-6z" fill="#1c1003" />
    <rect x="8" y="18" width="16" height="2.4" rx="1.2" fill="#1c1003" />
    <rect x="10" y="22" width="12" height="2.4" rx="1.2" fill="#1c1003" opacity=".7" />
  </svg>
);
export const Spinner = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ animation: "spin 0.8s linear infinite" }}>
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth="2.5" />
    <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
