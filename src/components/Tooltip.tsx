import { useEffect, useId, useRef, useState } from "react";
import { Info } from "./Icons";

/** Accessible info tooltip: opens on hover, focus or tap; closes on Escape or outside tap. */
export function Tooltip({ text, label }: { text: string; label: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={`About ${label}`}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="relative inline-flex size-5 items-center justify-center rounded-full text-subtle transition-colors hover:text-fg after:absolute after:-inset-3 after:content-['']"
      >
        <Info size={15} />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="fade-enter absolute bottom-full left-1/2 z-30 mb-2 w-60 max-w-[70vw] -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-2 text-[13px] font-normal leading-snug text-fg shadow-card"
        >
          {text}
        </span>
      )}
    </span>
  );
}
