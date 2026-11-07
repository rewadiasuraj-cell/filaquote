import type { ReactNode } from "react";
import { useAnimatedNumber } from "../hooks";
import { formatDuration, formatMoney, formatNumber } from "../lib/format";
import { toCurrency, type Quote, type Settings } from "../lib/pricing";
import { Badge, Button } from "./Controls";
import { Check, Copy, Download, Info, Printer, Target } from "./Icons";

const SEGMENTS = [
  { key: "material", label: "Material", color: "var(--chart-1)" },
  { key: "machine", label: "Machine", color: "var(--chart-2)" },
  { key: "electricity", label: "Electricity", color: "var(--chart-3)" },
  { key: "labor", label: "Labor", color: "var(--chart-4)" },
  { key: "failure", label: "Failure", color: "var(--chart-5)" },
] as const;

export function CostBreakdown({ quote, fmt }: { quote: Quote; fmt: (inr: number) => string }) {
  const total = quote.productionCost || 1;
  const parts = SEGMENTS.map((s) => ({ ...s, value: quote[s.key] })).filter((p) => p.value > 0.0001);
  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="sr-only">Production cost breakdown per unit</figcaption>
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-sunk" aria-hidden>
        {parts.map((p) => (
          <div key={p.key} className="h-full transition-[width] duration-200" style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
        {parts.map((p) => (
          <li key={p.key} className="flex min-w-0 items-center gap-2 text-[12.5px] text-muted">
            <span className="size-2 shrink-0 rounded-sm" style={{ background: p.color }} aria-hidden />
            <span className="truncate">{p.label}</span>
            <span className="tnum ml-auto font-mono text-subtle" title={fmt(p.value)}>{Math.round((p.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

function Row({ label, value, sub, strong, muted }: { label: ReactNode; value: string; sub?: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-2 ${strong ? "font-semibold" : ""}`}>
      <dt className={`min-w-0 text-[13.5px] ${muted ? "text-muted" : ""}`}>
        {label}
        {sub && <span className="ml-1.5 font-mono text-[11.5px] font-normal text-subtle">{sub}</span>}
      </dt>
      <dd className="tnum shrink-0 font-mono text-[13.5px]">{value}</dd>
    </div>
  );
}

export interface QuoteCardProps {
  quote: Quote;
  settings: Settings;
  materialLabel: string;
  onCopy: () => void;
  onCsv: () => void;
  onPrint: () => void;
  onVerify: () => void;
  copied: boolean;
  embedded?: boolean;
}

export function QuoteCard({ quote: q, settings: s, materialLabel, onCopy, onCsv, onPrint, onVerify, copied, embedded }: QuoteCardProps) {
  const fmt = (inr: number) => formatMoney(toCurrency(inr, s), s.currency);
  const total = useAnimatedNumber(toCurrency(q.total, s));
  const isEstimate = q.source === "estimate";
  const empty = q.grams <= 0 && q.hours <= 0;

  return (
    <section
      aria-label="Live quotation"
      className={embedded ? "" : "overflow-hidden rounded-2xl border border-line bg-surface shadow-card"}
    >
      {!embedded && <div className="accent-gradient h-1" aria-hidden />}
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        {/* Primary result */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] font-medium text-muted">Total quotation</p>
            {isEstimate ? (
              <Badge tone="warn"><Info size={13} /> Geometry estimate · ±20%</Badge>
            ) : (
              <Badge tone="success"><Check size={13} /> Slicer verified</Badge>
            )}
          </div>
          <p className="tnum text-[40px] font-semibold leading-none tracking-tight sm:text-[48px]" aria-live="polite">
            {formatMoney(total, s.currency)}
          </p>
          <p className="tnum text-[13.5px] text-muted">
            {fmt(q.unitPrice)} per unit × {q.quantity}
            {q.extras > 0 && ` + ${fmt(q.extras)} extras`}
            {q.tax > 0 && ` + ${s.tax}% tax`}
          </p>
        </div>

        {/* Usage */}
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-line">
          <div className="border-r border-line p-3">
            <p className="text-[12px] text-subtle">Filament / unit</p>
            <p className="tnum font-mono text-[16px] font-medium">{formatNumber(q.grams, 1)} g</p>
            <p className="truncate text-[12px] text-subtle">{materialLabel}</p>
          </div>
          <div className="p-3">
            <p className="text-[12px] text-subtle">Print time / unit</p>
            <p className="tnum font-mono text-[16px] font-medium">{formatDuration(q.hours)}</p>
            <p className="text-[12px] text-subtle">{isEstimate ? "estimated" : "from slicer"}</p>
          </div>
        </div>

        {empty && !isEstimate && (
          <p className="rounded-lg bg-warn-bg px-3 py-2 text-[13px] text-warn">Enter the filament weight and print time from your slicer to price this job.</p>
        )}

        {isEstimate && (
          <button
            type="button"
            onClick={onVerify}
            className="no-print flex items-start gap-2.5 rounded-lg bg-sunk px-3 py-2.5 text-left text-[13px] text-muted transition-colors hover:text-fg"
          >
            <Target size={16} className="mt-0.5 shrink-0 text-accent" />
            <span>
              Calculated from the model's shape, not a slicer. For a firm price,{" "}
              <span className="font-medium text-accent underline underline-offset-2">enter your slicer's weight and time</span>.
            </span>
          </button>
        )}

        {/* Breakdown */}
        <div>
          <h3 className="mb-3 text-[13px] font-medium text-muted">Cost breakdown per unit</h3>
          <CostBreakdown quote={q} fmt={fmt} />
        </div>

        <dl className="divide-y divide-line border-y border-line">
          <Row label="Material" sub={`${formatNumber(q.grams, 1)} g`} value={fmt(q.material)} muted />
          <Row label="Electricity" sub={`${formatNumber((s.watts / 1000) * q.hours, 2)} kWh`} value={fmt(q.electricity)} muted />
          <Row label="Machine" sub={formatDuration(q.hours)} value={fmt(q.machine)} muted />
          <Row label="Labor" sub={`${s.laborMinutes} min`} value={fmt(q.labor)} muted />
          <Row label="Failure allowance" sub={`${s.failure}%`} value={fmt(q.failure)} muted />
          <Row label="Production cost" value={fmt(q.productionCost)} strong />
          <Row label="Profit margin" sub={`${s.margin}%`} value={fmt(q.profit)} muted />
          <Row label="Selling price per unit" value={fmt(q.unitPrice)} strong />
          {q.quantity > 1 && <Row label="Quantity" sub={`× ${q.quantity}`} value={fmt(q.itemsTotal)} muted />}
          {q.extras > 0 && <Row label="Additional charges" value={fmt(q.extras)} muted />}
          {q.tax > 0 && <Row label="Tax" sub={`${s.tax}%`} value={fmt(q.tax)} muted />}
          <Row label="Total quotation" value={fmt(q.total)} strong />
        </dl>

        {/* Actions */}
        <div className="no-print flex flex-col gap-2">
          <Button variant="primary" onClick={onCopy} icon={copied ? <Check size={17} /> : <Copy size={17} />}>
            {copied ? "Quote copied" : "Copy quote"}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={onCsv} icon={<Download size={16} />}>Export CSV</Button>
            <Button onClick={onPrint} icon={<Printer size={16} />}>Print / PDF</Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Plain, printer-friendly quote document, shown only when printing. */
export function PrintQuote({ title, lines, meta }: { title: string; lines: [string, string][]; meta: string[] }) {
  return (
    <div className="hidden print:block" aria-hidden>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Quotation</h1>
      <p style={{ marginBottom: 16, color: "#555" }}>{title}</p>
      {meta.map((m) => <p key={m} style={{ margin: "2px 0", color: "#333" }}>{m}</p>)}
      <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse", fontSize: 13 }}>
        <tbody>
          {lines.map(([k, v]) => (
            <tr key={k} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "6px 0" }}>{k}</td>
              <td style={{ padding: "6px 0", textAlign: "right", fontFamily: "monospace" }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: 24, fontSize: 11, color: "#777" }}>Generated with FilaQuote · {new Date().toLocaleDateString()}</p>
    </div>
  );
}
