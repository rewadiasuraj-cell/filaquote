import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAnimatedNumber, useKeyboardOpen, useSettings, useTheme } from "./hooks";
import { formatBytes, formatMoney, formatNumber } from "./lib/format";
import { measure, parseSTL, sampleVase, StlError, type MeshInfo } from "./lib/geometry";
import { computeQuote, estimateUsage, slicerUsage, toCurrency } from "./lib/pricing";
import { findMaterial, findPrinter } from "./lib/presets";
import { downloadFile, quoteCSV, quoteLines, quoteText, type QuoteContext } from "./lib/export";
import { Header } from "./components/Header";
import { UploadZone, MAX_BYTES, type UploadStatus } from "./components/UploadZone";
import { ModelViewer } from "./components/ModelViewer";
import { ConfigPanel } from "./components/ConfigPanel";
import { PrintQuote, QuoteCard } from "./components/QuoteCard";
import { BottomSheet, useToast } from "./components/Overlay";
import { Chevron } from "./components/Icons";

const SAMPLE_NAME = "twisted-vase-sample.stl";

function StepCard({ step, title, aside, children }: { step: number; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={`step-${step}`} className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-line-strong font-mono text-[12px] font-medium text-muted">
          {step}
        </span>
        <h2 id={`step-${step}`} className="text-[16px] font-semibold tracking-tight">{title}</h2>
        {aside && <div className="ml-auto">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`min-w-0 bg-surface px-3 py-2.5 ${wide ? "col-span-2 sm:col-span-1" : ""}`}>
      <dt className="text-[12px] text-subtle">{label}</dt>
      <dd className="tnum truncate font-mono text-[14px] font-medium" title={value}>{value}</dd>
    </div>
  );
}

export default function App() {
  const { settings, update, patch, reset } = useSettings();
  const { pref, setPref } = useTheme();
  const toast = useToast();
  const keyboardOpen = useKeyboardOpen();

  const [mesh, setMesh] = useState<MeshInfo | null>(() => measure(sampleVase()));
  const [modelName, setModelName] = useState(SAMPLE_NAME);
  const [status, setStatus] = useState<UploadStatus>({ kind: "sample" });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const configRef = useRef<HTMLDivElement>(null);

  /* ---------- quote ---------- */
  const quote = useMemo(() => {
    const usage = settings.mode === "slicer"
      ? slicerUsage(settings)
      : estimateUsage(mesh ?? { volumeMm3: 0, areaMm2: 0 }, settings);
    return computeQuote(usage, settings);
  }, [settings, mesh]);

  const material = findMaterial(settings.materialId);
  const materialLabel = settings.materialId === "custom" ? `Custom (${settings.density} g/cm³)` : material.label;
  const ctx: QuoteContext = {
    quote,
    settings,
    modelName,
    size: mesh?.size ?? [0, 0, 0],
    materialLabel,
    printerLabel: findPrinter(settings.printerId).label,
  };

  /* ---------- upload ---------- */
  const onFile = useCallback((file: File) => {
    if (!/\.stl$/i.test(file.name)) {
      setStatus({ kind: "error", name: file.name, message: "Only .stl files are supported. Export your model as STL and try again." });
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus({ kind: "error", name: file.name, message: `This file is ${formatBytes(file.size)}. The limit is 200 MB; try decimating the mesh.` });
      return;
    }
    setStatus({ kind: "loading", name: file.name, size: file.size, progress: 0 });
    const fr = new FileReader();
    fr.onprogress = (e) => {
      if (e.lengthComputable) setStatus({ kind: "loading", name: file.name, size: file.size, progress: e.loaded / e.total });
    };
    fr.onerror = () => setStatus({ kind: "error", name: file.name, message: "The file couldn't be read. Check it isn't open in another app and try again." });
    fr.onload = () => {
      // Let the progress bar paint 100% before the (synchronous) parse.
      setStatus({ kind: "loading", name: file.name, size: file.size, progress: 1 });
      setTimeout(() => {
        try {
          const m = measure(parseSTL(fr.result as ArrayBuffer));
          if (!m.triangles || !(m.volumeMm3 > 0)) throw new StlError("This model has no closed volume. Make sure the mesh is watertight (no holes).");
          setMesh(m);
          setModelName(file.name);
          setStatus({ kind: "success", name: file.name, size: file.size });
          toast(`Loaded ${file.name}`);
        } catch (err) {
          const message = err instanceof StlError ? err.message : "The model couldn't be processed. Try exporting it again as STL.";
          setStatus({ kind: "error", name: file.name, message });
        }
      }, 30);
    };
    fr.readAsArrayBuffer(file);
  }, [toast]);

  const loadSample = () => {
    setMesh(measure(sampleVase()));
    setModelName(SAMPLE_NAME);
    setStatus({ kind: "sample" });
  };

  /* ---------- actions ---------- */
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(quoteText(ctx));
      setCopied(true);
      toast("Quote copied. Paste it into WhatsApp or email.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Copying isn't allowed here. Use Export CSV instead.", "error");
    }
  };
  const onCsv = () => {
    const base = modelName.replace(/\.stl$/i, "").replace(/[^\w-]+/g, "-");
    downloadFile(`quote-${base}.csv`, quoteCSV(ctx), "text/csv;charset=utf-8");
    toast("CSV exported");
  };
  const onPrint = () => { setSheetOpen(false); setTimeout(() => window.print(), 50); };
  const onVerify = () => {
    update("mode", "slicer");
    setSheetOpen(false);
    setTimeout(() => {
      configRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("slicerGrams")?.focus({ preventScroll: true });
    }, 60);
  };
  const onReset = () => { reset(); toast("Settings reset to defaults"); };

  useEffect(() => { if (sheetOpen && keyboardOpen) (document.activeElement as HTMLElement)?.blur(); }, [sheetOpen, keyboardOpen]);

  const total = useAnimatedNumber(toCurrency(quote.total, settings));
  const fmt = (inr: number) => formatMoney(toCurrency(inr, settings), settings.currency);
  const cardProps = { quote, settings, materialLabel, onCopy, onCsv, onPrint, onVerify, copied };

  return (
    <div className="min-h-dvh">
      <Header currency={settings.currency} onCurrency={(c) => update("currency", c)} theme={pref} onTheme={setPref} />

      <main className="no-print mx-auto max-w-[1440px] gutter pb-[calc(112px+env(safe-area-inset-bottom,0px))] pt-6 lg:pb-12 lg:pt-8">
        <div className="mb-6 flex flex-col gap-1.5 lg:mb-8">
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight sm:text-[32px]">3D print quote</h1>
          <p className="max-w-[62ch] text-[15px] text-muted">
            Upload a model, check a few settings, send the price. Files are processed on your device and never uploaded.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
            <StepCard step={1} title="Upload model">
              <div className="flex flex-col gap-4">
                <UploadZone status={status} onFile={onFile} onSample={loadSample} />
                <ModelViewer mesh={mesh} />
                {mesh && (
                  <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-[1.6fr_1fr_1fr_0.8fr]">
                    <Stat label="Size X × Y × Z" value={`${mesh.size.map((v) => formatNumber(v, v < 100 ? 1 : 0)).join(" × ")} mm`} wide />
                    <Stat label="Volume" value={`${formatNumber(mesh.volumeMm3 / 1000, 2)} cm³`} />
                    <Stat label="Surface area" value={`${formatNumber(mesh.areaMm2 / 100, 1)} cm²`} />
                    <Stat label="Triangles" value={mesh.triangles.toLocaleString("en-US")} />
                  </dl>
                )}
              </div>
            </StepCard>

            <div ref={configRef} className="scroll-mt-24">
              <StepCard step={2} title="Configure print">
                <ConfigPanel settings={settings} update={update} patch={patch} onReset={onReset} />
              </StepCard>
            </div>
          </div>

          <aside className="hidden min-w-0 lg:col-span-5 lg:block" aria-label="Step 3: Instant quote">
            <div className="sticky top-[calc(env(safe-area-inset-top,0px)+88px)]">
              <div className="mb-3 flex items-center gap-3">
                <span className="inline-flex size-7 items-center justify-center rounded-full border border-line-strong font-mono text-[12px] font-medium text-muted">3</span>
                <h2 className="text-[16px] font-semibold tracking-tight">Instant quote</h2>
                <span className="ml-auto text-[12.5px] text-subtle">Updates as you type</span>
              </div>
              <QuoteCard {...cardProps} />
            </div>
          </aside>
        </div>

        <footer className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-[13px] text-subtle sm:flex-row sm:justify-between">
          <span>Estimates are a guide; your slicer is the source of truth for a specific print.</span>
          <span>
            MIT licensed ·{" "}
            <a className="text-accent underline-offset-2 hover:underline" href="https://github.com/rewadiasuraj-cell/filaquote" target="_blank" rel="noopener">
              Contribute on GitHub
            </a>
          </span>
        </footer>
      </main>

      {/* Mobile + tablet: sticky quote summary */}
      {!keyboardOpen && !sheetOpen && (
        <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[max(12px,env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-haspopup="dialog"
            className="mx-auto flex w-full max-w-[1440px] items-center gap-3 text-left gutter"
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-center gap-1.5 text-[12px] text-muted">
                <span className={`size-1.5 rounded-full ${quote.source === "slicer" ? "bg-success" : "bg-warn"}`} aria-hidden />
                {quote.source === "slicer" ? "Slicer verified" : "Estimate"} · {fmt(quote.unitPrice)} × {quote.quantity}
              </span>
              <span className="tnum truncate text-[24px] font-semibold leading-tight tracking-tight">{formatMoney(total, settings.currency)}</span>
            </span>
            <span className="accent-gradient inline-flex h-11 shrink-0 items-center gap-1 rounded-lg px-4 text-[14px] font-semibold text-on-accent shadow-card">
              View quote <Chevron size={16} className="rotate-180" />
            </span>
          </button>
        </div>
      )}

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Instant quote">
        <QuoteCard {...cardProps} embedded />
      </BottomSheet>

      <PrintQuote
        title={modelName}
        meta={[
          `${ctx.size.map((v) => formatNumber(v, 1)).join(" × ")} mm · ${materialLabel} · ${settings.infill}% infill`,
          `Filament ${formatNumber(quote.grams, 1)} g · ${quote.source === "slicer" ? "slicer verified" : "geometry estimate"}`,
        ]}
        lines={[
          ...quoteLines(ctx).rows,
          ["Quantity", String(quote.quantity)],
          ...(quote.extras > 0 ? [["Additional charges", fmt(quote.extras)] as [string, string]] : []),
          ...(quote.tax > 0 ? [[`Tax (${settings.tax}%)`, fmt(quote.tax)] as [string, string]] : []),
          ["Total quotation", fmt(quote.total)],
        ]}
      />
    </div>
  );
}
