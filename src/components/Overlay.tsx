import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Close, Alert } from "./Icons";

/* ---------------- Bottom sheet ---------------- */

export function BottomSheet({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>("button, [href], input, select, [tabindex]:not([tabindex='-1'])");
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      returnFocus.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fade-enter absolute inset-0 bg-black/45" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="sheet-enter absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-2xl border-t border-line bg-surface outline-none"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line py-2 gutter">
          <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-line-strong" aria-hidden />
          <h2 className="pt-2 text-[15px] font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quote"
            className="mt-1 inline-flex size-11 items-center justify-center rounded-lg text-muted hover:bg-sunk hover:text-fg"
          >
            <Close size={20} />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain pb-[max(16px,env(safe-area-inset-bottom,0px))]">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- Toasts ---------------- */

type ToastTone = "success" | "error";
interface ToastItem { id: number; text: string; tone: ToastTone }
const ToastCtx = createContext<(text: string, tone?: ToastTone) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((text: string, tone: ToastTone = "success") => {
    const id = Date.now() + Math.random();
    setItems((t) => [...t.slice(-2), { id, text, tone }]);
    setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom,0px))] z-[60] flex flex-col items-center gap-2 gutter lg:bottom-6 lg:items-end"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className="toast-enter pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-3 text-[13.5px] shadow-card"
          >
            <span className={t.tone === "success" ? "text-success" : "text-danger"}>
              {t.tone === "success" ? <Check size={16} /> : <Alert size={16} />}
            </span>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
