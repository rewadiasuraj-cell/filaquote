import { formatDuration, formatMoney, formatNumber } from "./format";
import { toCurrency, type Quote, type Settings } from "./pricing";

export interface QuoteContext {
  quote: Quote;
  settings: Settings;
  modelName: string;
  size: [number, number, number];
  materialLabel: string;
  printerLabel: string;
}

export function quoteLines(c: QuoteContext) {
  const { quote: q, settings: s } = c;
  const m = (inr: number) => formatMoney(toCurrency(inr, s), s.currency);
  return {
    m,
    rows: [
      ["Material", m(q.material)],
      ["Electricity", m(q.electricity)],
      ["Machine", m(q.machine)],
      ["Labor", m(q.labor)],
      ["Failure allowance", m(q.failure)],
      ["Production cost / unit", m(q.productionCost)],
      ["Profit margin", m(q.profit)],
      ["Selling price / unit", m(q.unitPrice)],
    ] as [string, string][],
  };
}

export function quoteText(c: QuoteContext): string {
  const { quote: q, settings: s } = c;
  const { m } = quoteLines(c);
  const verified = q.source === "slicer" ? "slicer verified" : "estimated from model geometry";
  return [
    `Quote · ${c.modelName}`,
    `${c.size.map((v) => formatNumber(v, 1)).join(" × ")} mm · ${c.materialLabel} · ${s.infill}% infill`,
    `Filament ${formatNumber(q.grams, 1)} g · Print time ${formatDuration(q.hours)} (${verified})`,
    ``,
    `Price per unit: ${m(q.unitPrice)}`,
    `Quantity: ${q.quantity}`,
    q.extras > 0 ? `Additional charges: ${m(q.extras)}` : null,
    q.tax > 0 ? `Tax (${s.tax}%): ${m(q.tax)}` : null,
    `Total: ${m(q.total)}`,
  ].filter((l) => l !== null).join("\n");
}

const csvCell = (v: string | number) => {
  const t = String(v);
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

export function quoteCSV(c: QuoteContext): string {
  const { quote: q, settings: s } = c;
  const cur = (inr: number) => toCurrency(inr, s).toFixed(2);
  const rows: (string | number)[][] = [
    ["Field", "Value", "Unit"],
    ["Model", c.modelName, ""],
    ["Size X", c.size[0].toFixed(2), "mm"],
    ["Size Y", c.size[1].toFixed(2), "mm"],
    ["Size Z", c.size[2].toFixed(2), "mm"],
    ["Material", c.materialLabel, ""],
    ["Printer", c.printerLabel, ""],
    ["Infill", s.infill, "%"],
    ["Usage source", q.source === "slicer" ? "Slicer verified" : "Geometry estimate", ""],
    ["Filament per unit", q.grams.toFixed(2), "g"],
    ["Print time per unit", (q.hours * 60).toFixed(1), "min"],
    ["Material cost", cur(q.material), s.currency],
    ["Electricity cost", cur(q.electricity), s.currency],
    ["Machine cost", cur(q.machine), s.currency],
    ["Labor cost", cur(q.labor), s.currency],
    ["Failure allowance", cur(q.failure), s.currency],
    ["Production cost per unit", cur(q.productionCost), s.currency],
    ["Profit margin", `${s.margin}`, "%"],
    ["Profit per unit", cur(q.profit), s.currency],
    ["Selling price per unit", cur(q.unitPrice), s.currency],
    ["Quantity", q.quantity, "pcs"],
    ["Additional charges", cur(q.extras), s.currency],
    ["Tax", cur(q.tax), s.currency],
    ["Total quotation", cur(q.total), s.currency],
  ];
  return rows.map((r) => r.map(csvCell).join(",")).join("\n");
}

export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
