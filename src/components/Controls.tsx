import { useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Chevron } from "./Icons";

/** Radio-group styled as a segmented control. Arrow keys move the selection. */
export function SegmentedControl<T extends string>({
  value, onChange, options, label, size = "md", className = "",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; title?: string }[];
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const idx = options.findIndex((o) => o.value === value);
  const move = (d: number) => {
    const n = (idx + d + options.length) % options.length;
    onChange(options[n].value);
    refs.current[n]?.focus();
  };
  const h = size === "sm" ? "h-9" : "h-11";
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`inline-flex rounded-lg border border-line bg-sunk p-1 ${className}`}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); move(1); }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      }}
    >
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={`${h} flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-[13.5px] font-medium transition-all duration-200 ${
              active ? "bg-surface text-fg shadow-card" : "text-muted hover:text-fg"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Accordion({
  title, summary, children, defaultOpen = false,
}: {
  title: string;
  summary?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="rounded-xl border border-line">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-14 w-full items-center gap-3 rounded-xl px-4 text-left transition-colors hover:bg-sunk"
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[14.5px] font-semibold">{title}</span>
            {summary && <span className="truncate text-[12.5px] text-subtle">{summary}</span>}
          </span>
          <Chevron size={18} className={`shrink-0 text-subtle transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </h3>
      <div className="collapse-grid" data-open={open}>
        <div id={id} role="region" aria-label={title} inert={!open ? true : undefined}>
          <div className="border-t border-line px-4 pb-5 pt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

type Variant = "primary" | "secondary" | "ghost";
export function Button({
  variant = "secondary", icon, children, className = "", ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; icon?: ReactNode }) {
  const styles: Record<Variant, string> = {
    primary: "accent-gradient text-on-accent font-semibold shadow-card hover:brightness-105 active:brightness-95",
    secondary: "border border-line bg-surface text-fg hover:border-line-strong hover:bg-sunk",
    ghost: "text-muted hover:bg-sunk hover:text-fg",
  };
  return (
    <button
      type="button"
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-[14px] font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 ${styles[variant]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export function Badge({ tone, children }: { tone: "success" | "warn" | "neutral"; children: ReactNode }) {
  const t = {
    success: "bg-success-bg text-success",
    warn: "bg-warn-bg text-warn",
    neutral: "bg-sunk text-muted",
  }[tone];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${t}`}>{children}</span>;
}
