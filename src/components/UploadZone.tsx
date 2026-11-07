import { useRef, useState } from "react";
import { formatBytes } from "../lib/format";
import { Alert, Check, Cube, Spinner, Swap, Upload } from "./Icons";

export type UploadStatus =
  | { kind: "sample" }
  | { kind: "loading"; name: string; size: number; progress: number }
  | { kind: "success"; name: string; size: number }
  | { kind: "error"; name: string; message: string };

export const MAX_BYTES = 200 * 1024 * 1024;

export function UploadZone({
  status, onFile, onSample,
}: { status: UploadStatus; onFile: (f: File) => void; onSample: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const pick = () => input.current?.click();

  const statusRow = (() => {
    switch (status.kind) {
      case "loading":
        return (
          <div className="flex min-w-0 items-center gap-3" aria-live="polite">
            <span className="text-accent"><Spinner size={20} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium">{status.name}</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                <div className="accent-gradient h-full transition-[width] duration-200" style={{ width: `${Math.round(status.progress * 100)}%` }} />
              </div>
              <p className="mt-1 text-[12.5px] text-subtle">Reading model · {formatBytes(status.size)}</p>
            </div>
          </div>
        );
      case "success":
        return (
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-success-bg text-success"><Check size={18} /></span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium" title={status.name}>{status.name}</p>
              <p className="text-[12.5px] text-subtle">{formatBytes(status.size)} · loaded on this device only</p>
            </div>
          </div>
        );
      case "error":
        return (
          <div className="flex min-w-0 items-start gap-3" role="alert">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-danger-bg text-danger"><Alert size={18} /></span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium">{status.name}</p>
              <p className="text-[12.5px] text-danger">{status.message}</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-sunk text-muted"><Cube size={18} /></span>
            <div className="min-w-0">
              <p className="text-[14px] font-medium">Sample model: twisted vase</p>
              <p className="text-[12.5px] text-subtle">Upload your STL to quote a real part</p>
            </div>
          </div>
        );
    }
  })();

  const hasModel = status.kind === "success";

  return (
    <div
      onDragEnter={(e) => { e.preventDefault(); setOver(true); }}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false); }}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
      className={`rounded-xl border-[1.5px] border-dashed p-4 transition-colors duration-200 sm:p-5 ${
        over ? "border-accent bg-warn-bg" : "border-line-strong"
      }`}
    >
      <input
        ref={input}
        type="file"
        accept=".stl,model/stl,application/sla"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {statusRow}
        <div className="flex shrink-0 gap-2">
          {hasModel && (
            <button type="button" onClick={onSample} className="h-11 rounded-lg px-3 text-[13.5px] font-medium text-muted transition-colors hover:bg-sunk hover:text-fg">
              Use sample
            </button>
          )}
          <button
            type="button"
            onClick={pick}
            disabled={status.kind === "loading"}
            className="accent-gradient inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-[14px] font-semibold text-on-accent shadow-card transition-all hover:brightness-105 disabled:opacity-60 sm:flex-none"
          >
            {hasModel ? <Swap size={17} /> : <Upload size={17} />}
            {hasModel ? "Replace model" : (<><span className="sm:hidden">Tap to upload STL</span><span className="hidden sm:inline">Upload STL</span></>)}
          </button>
        </div>
      </div>
      <p className="mt-3 hidden text-[12.5px] text-subtle sm:block">
        {over ? "Drop to load the model" : "or drag and drop a .stl file anywhere in this box · up to 200 MB"}
      </p>
    </div>
  );
}
