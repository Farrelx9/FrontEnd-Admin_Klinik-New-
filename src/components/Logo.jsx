// Simple abstracted tooth mark. Swap this out for a real clinic logo
// later — kept as inline SVG so the color follows currentColor / theme.
export default function LogoMark({ className = "h-8 w-8" }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--color-teal-700)" />
      <path
        d="M16 8c-2.4 0-3.4 1.1-4.6 1.1-1.5 0-2.6-1-3.6-1-1.3 0-2.1 1.1-2.1 3.3 0 3 1.6 8.4 3.2 10.9.9 1.4 1.6 2 2.3 2 1 0 1.3-1.7 1.7-3.6.3-1.4.6-2.5 1.1-2.5s.8 1.1 1.1 2.5c.4 1.9.7 3.6 1.7 3.6.7 0 1.4-.6 2.3-2 1.6-2.5 3.2-7.9 3.2-10.9 0-2.2-.8-3.3-2.1-3.3-1 0-2.1 1-3.6 1-1.2 0-2.2-1.1-4.6-1.1Z"
        fill="white"
      />
    </svg>
  );
}

export function LogoLockup({ className = "" }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <div className="leading-tight">
        <p className="font-display text-[15px] font-bold text-[var(--color-ink)]">
          Klinik Senyum
        </p>
        <p className="font-body text-[11px] text-[var(--color-muted)]">
          Panel Admin
        </p>
      </div>
    </div>
  );
}
