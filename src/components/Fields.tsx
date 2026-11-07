import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Tooltip } from "./Tooltip";
import { Chevron } from "./Icons";

interface LabelProps {
  id: string;
  label: string;
  tooltip?: string;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
}

/** Label + control + hint/error row. Shared by every input type. */
export function FieldShell({ id, label, tooltip, hint, error, children, className = "" }: LabelProps) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <div className="flex items-center gap-1.5">
        <label htmlFor={id} className="text-[13px] font-medium text-muted">{label}</label>
        {tooltip && <Tooltip text={tooltip} label={label} />}
      </div>
      {children}
      {error ? (
        <p id={`${id}-msg`} className="text-[12.5px] text-danger" role="alert">{error}</p>
      ) : hint ? (
        <p id={`${id}-msg`} className="text-[12.5px] text-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

const trim = (v: number, dp: number) => {
  if (!Number.isFinite(v)) return "";
  const r = Math.round(v * 10 ** dp) / 10 ** dp;
  return String(r);
};

export interface NumberFieldProps {
  id?: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  /** decimals shown when the value comes from outside */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  tooltip?: string;
  hint?: ReactNode;
  integer?: boolean;
  className?: string;
}

/**
 * Numeric input with inline validation. Invalid text is kept on screen with a message
 * and never pushed into the quote; the last valid value keeps the price stable.
 */
export function NumberField({
  id: idProp, label, value, onChange, min, max, step = 1, decimals = 2, prefix, suffix, tooltip, hint, integer, className,
}: NumberFieldProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [text, setText] = useState(() => trim(value, decimals));
  const [error, setError] = useState<string | null>(null);
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) { setText(trim(value, decimals)); setError(null); }
  }, [value, decimals]);

  const commit = (raw: string) => {
    setText(raw);
    if (raw.trim() === "") { setError("Enter a value."); return; }
    const v = Number(raw.replace(",", "."));
    if (!Number.isFinite(v)) { setError("Use numbers only."); return; }
    if (integer && !Number.isInteger(v)) { setError("Use a whole number."); return; }
    if (v < min) { setError(`Use ${min} or more.`); return; }
    if (v > max) { setError(`Use ${max.toLocaleString()} or less.`); return; }
    setError(null);
    onChange(v);
  };

  return (
    <FieldShell id={id} label={label} tooltip={tooltip} hint={hint} error={error} className={className}>
      <div
        className={`flex h-11 items-center rounded-lg border bg-surface transition-colors focus-within:border-accent ${
          error ? "border-danger" : "border-line hover:border-line-strong"
        }`}
      >
        {prefix && <span className="pl-3 font-mono text-[13px] text-subtle">{prefix}</span>}
        <input
          id={id}
          type="number"
          inputMode={integer ? "numeric" : "decimal"}
          step={step}
          min={min}
          max={max}
          value={text}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${id}-msg` : undefined}
          onFocus={() => (focused.current = true)}
          onBlur={() => {
            focused.current = false;
            if (!error) setText(trim(value, decimals));
          }}
          onChange={(e) => commit(e.target.value)}
          className="tnum h-full w-full min-w-0 bg-transparent px-3 font-mono text-[14px] text-fg outline-none"
        />
        {suffix && <span className="whitespace-nowrap pr-3 font-mono text-[12.5px] text-subtle">{suffix}</span>}
      </div>
    </FieldShell>
  );
}

export function SelectField<T extends string>({
  id: idProp, label, value, onChange, options, tooltip, hint, className,
}: {
  id?: string;
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  tooltip?: string;
  hint?: ReactNode;
  className?: string;
}) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <FieldShell id={id} label={label} tooltip={tooltip} hint={hint} className={className}>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="h-11 w-full appearance-none rounded-lg border border-line bg-surface pl-3 pr-9 text-[14px] font-medium text-fg outline-none transition-colors hover:border-line-strong focus:border-accent"
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Chevron size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-subtle" />
      </div>
    </FieldShell>
  );
}

/** Slider paired with an exact numeric input. */
export function RangeField({
  id: idProp, label, value, onChange, min, max, step = 1, suffix, tooltip, marks,
}: {
  id?: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  tooltip?: string;
  marks?: number[];
}) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const fill = `${((value - min) / (max - min)) * 100}%`;
  return (
    <FieldShell id={id} label={label} tooltip={tooltip}>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="range min-w-0 flex-1"
          style={{ ["--fill" as string]: fill }}
          aria-valuetext={`${value}${suffix ?? ""}`}
        />
        <div className="flex h-11 w-[84px] shrink-0 items-center rounded-lg border border-line bg-surface focus-within:border-accent">
          <input
            aria-label={`${label} exact value`}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            value={value}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v)) onChange(Math.min(max, Math.max(min, v)));
            }}
            className="tnum h-full w-full min-w-0 bg-transparent pl-3 font-mono text-[14px] outline-none"
          />
          {suffix && <span className="pr-3 font-mono text-[12.5px] text-subtle">{suffix}</span>}
        </div>
      </div>
      {marks && (
        <div className="-mt-1 flex flex-wrap gap-1.5" role="group" aria-label={`${label} presets`}>
          {marks.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onChange(m)}
              aria-pressed={value === m}
              className={`h-8 rounded-md border px-2.5 font-mono text-[12px] transition-colors ${
                value === m ? "border-accent text-accent" : "border-line text-muted hover:border-line-strong hover:text-fg"
              }`}
            >
              {m}{suffix}
            </button>
          ))}
        </div>
      )}
    </FieldShell>
  );
}
