import { currencySymbol, formatMoney } from "../lib/format";
import { LIMITS, fromCurrency, toCurrency, type Mode, type Settings } from "../lib/pricing";
import { MATERIALS, PRINTERS, findMaterial, findPrinter } from "../lib/presets";
import { Accordion, Button, SegmentedControl } from "./Controls";
import { NumberField, RangeField, SelectField } from "./Fields";
import { Check, Reset, Target } from "./Icons";

interface Props {
  settings: Settings;
  update: <K extends keyof Settings>(k: K, v: Settings[K]) => void;
  patch: (p: Partial<Settings>) => void;
  onReset: () => void;
}

export function ConfigPanel({ settings: s, update, patch, onReset }: Props) {
  const sym = currencySymbol(s.currency);
  /** Money fields: engine stores INR, inputs show the chosen currency. */
  const money = (key: "pricePerKg" | "tariff" | "machineRate" | "laborRate" | "extras") => ({
    value: toCurrency(s[key], s),
    onChange: (v: number) => update(key, fromCurrency(v, s)),
    min: LIMITS[key][0],
    max: toCurrency(LIMITS[key][1], s),
    decimals: 2,
  });
  const lim = (key: keyof typeof LIMITS) => ({ min: LIMITS[key][0], max: LIMITS[key][1] });

  const printer = findPrinter(s.printerId);
  const advancedSummary = `${printer.label} · ${s.watts} W · ${s.layerHeight} mm layers · ${s.failure}% failure${s.tax ? ` · ${s.tax}% tax` : ""}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Mode */}
      <div className="flex flex-col gap-2">
        <SegmentedControl<Mode>
          label="Pricing mode"
          value={s.mode}
          onChange={(m) => update("mode", m)}
          className="w-full sm:w-auto"
          options={[
            { value: "estimate", label: "Quick estimate" },
            { value: "slicer", label: (<><Check size={15} /> Slicer verified</>) },
          ]}
        />
        <p className="text-[12.5px] text-subtle">
          {s.mode === "estimate"
            ? "Weight and time are estimated from the model's shape. Good for fast quotes."
            : "Enter the exact weight and time your slicer reports for a firm price."}
        </p>
      </div>

      {s.mode === "slicer" && (
        <div className="fade-enter grid grid-cols-1 gap-4 rounded-xl border border-line bg-sunk p-4 sm:grid-cols-2">
          <div className="flex items-start gap-2.5 sm:col-span-2">
            <Target size={17} className="mt-0.5 shrink-0 text-accent" />
            <p className="text-[13px] text-muted">
              In Cura, PrusaSlicer or OrcaSlicer, slice the part and copy the total filament weight and estimated print time for <strong className="font-medium text-fg">one unit</strong>, including supports.
            </p>
          </div>
          <NumberField id="slicerGrams" label="Filament weight" suffix="g" step={0.1} decimals={1} value={s.slicerGrams} onChange={(v) => update("slicerGrams", v)} {...lim("slicerGrams")} />
          <NumberField id="slicerMinutes" label="Print time" suffix="min" step={1} decimals={0} value={s.slicerMinutes} onChange={(v) => update("slicerMinutes", v)} {...lim("slicerMinutes")}
            hint={s.slicerMinutes >= 60 ? `= ${Math.floor(s.slicerMinutes / 60)} h ${Math.round(s.slicerMinutes % 60)} min` : "e.g. 2 h 15 min = 135"} />
        </div>
      )}

      {/* Essentials */}
      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
        <SelectField
          id="material"
          label="Filament material"
          value={s.materialId}
          onChange={(id) => {
            const m = findMaterial(id);
            patch(id === "custom" ? { materialId: id } : { materialId: id, density: m.density, pricePerKg: m.pricePerKg });
          }}
          options={MATERIALS.map((m) => ({ value: m.id, label: m.id === "custom" ? m.label : `${m.label} · ${m.density} g/cm³` }))}
        />
        <NumberField
          id="pricePerKg"
          label="Filament price"
          prefix={sym}
          suffix="/ kg"
          step={10}
          tooltip="What you pay for a 1 kg spool, including shipping."
          {...money("pricePerKg")}
        />
        {s.mode === "estimate" && (
          <RangeField
            id="infill"
            label="Infill"
            suffix="%"
            value={s.infill}
            onChange={(v) => update("infill", v)}
            min={0}
            max={100}
            step={5}
            marks={[10, 15, 20, 40, 100]}
            tooltip="How solid the inside is. 10–20% suits most display parts; 40%+ for strong functional parts."
          />
        )}
        <div className={`grid grid-cols-2 gap-4 ${s.mode === "estimate" ? "" : "sm:col-span-2"}`}>
          <NumberField id="quantity" label="Quantity" suffix="pcs" integer value={s.quantity} onChange={(v) => update("quantity", v)} {...lim("quantity")} />
          <NumberField
            id="margin"
            label="Profit margin"
            suffix="%"
            value={s.margin}
            onChange={(v) => update("margin", v)}
            {...lim("margin")}
            tooltip="Share of the selling price you keep as profit. 40% margin on ₹100 cost = ₹167 price (₹67 profit)."
          />
        </div>
      </div>

      {/* Advanced */}
      <Accordion title="Advanced settings" summary={advancedSummary}>
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-4">
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-subtle">Printer & power</h4>
            <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
              <SelectField
                id="printer"
                label="Printer"
                className="sm:col-span-2"
                value={s.printerId}
                onChange={(id) => {
                  const p = findPrinter(id);
                  patch(id === "custom" ? { printerId: id } : { printerId: id, watts: p.watts, throughput: p.throughput, machineRate: p.machineRate });
                }}
                options={PRINTERS.map((p) => ({ value: p.id, label: p.label }))}
                hint="Choosing a printer fills in typical power, speed and machine cost. Edit any of them."
              />
              <NumberField id="watts" label="Printer wattage" suffix="W" step={5} decimals={0} value={s.watts} onChange={(v) => update("watts", v)} {...lim("watts")}
                tooltip="Average power while printing, not the PSU rating. Most printers average 80–150 W with the bed hot." />
              <NumberField id="tariff" label="Electricity tariff" prefix={sym} suffix="/ kWh" step={0.5} {...money("tariff")}
                tooltip="Your rate per unit (kWh) from the electricity bill." />
              <NumberField id="machineRate" label="Machine hourly cost" prefix={sym} suffix="/ h" step={1} {...money("machineRate")}
                tooltip="Wear and depreciation per print hour. Printer price ÷ expected life in hours, plus nozzles, belts and repairs." />
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-subtle">Print profile</h4>
            <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
              <NumberField id="layerHeight" label="Layer height" suffix="mm" step={0.04} value={s.layerHeight} onChange={(v) => update("layerHeight", v)} {...lim("layerHeight")}
                tooltip="Thicker layers print faster. Speed below is measured at 0.20 mm and scaled from there." />
              <NumberField id="wallThickness" label="Wall thickness" suffix="mm" step={0.4} value={s.wallThickness} onChange={(v) => update("wallThickness", v)} {...lim("wallThickness")}
                tooltip="Total solid shell: wall loops × line width. 3 loops × 0.4 mm ≈ 1.2 mm." />
              <NumberField id="throughput" label="Printing speed" suffix="g / h" step={1} decimals={1} value={s.throughput} onChange={(v) => update("throughput", v)} {...lim("throughput")}
                tooltip="Grams your printer lays down per hour at 0.20 mm. Calibrate: slicer grams ÷ slicer hours from a typical job." />
              <NumberField id="density" label="Material density" suffix="g / cm³" step={0.01} value={s.density} onChange={(v) => patch({ density: v, materialId: "custom" })} {...lim("density")} />
              <NumberField id="support" label="Support allowance" suffix="%" step={1} decimals={0} value={s.support} onChange={(v) => update("support", v)} {...lim("support")}
                tooltip="Extra filament for supports, brim and purge, as a share of the part weight." />
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-subtle">Business</h4>
            <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
              <NumberField id="laborMinutes" label="Labor time / unit" suffix="min" step={5} decimals={0} value={s.laborMinutes} onChange={(v) => update("laborMinutes", v)} {...lim("laborMinutes")}
                tooltip="Hands-on time per part: slicing, plate removal, support cleanup, packing." />
              <NumberField id="laborRate" label="Labor rate" prefix={sym} suffix="/ h" step={10} {...money("laborRate")} />
              <NumberField id="failure" label="Failure allowance" suffix="%" step={1} decimals={0} value={s.failure} onChange={(v) => update("failure", v)} {...lim("failure")}
                tooltip="Covers failed or reprinted parts. 5–10% is typical; raise it for tall or tricky prints." />
              <NumberField id="tax" label="Taxes" suffix="%" step={1} value={s.tax} onChange={(v) => update("tax", v)} {...lim("tax")}
                tooltip="Added on the order total, e.g. 18% GST in India. Leave 0 if not registered." />
              <NumberField id="extras" label="Additional charges" prefix={sym} suffix="/ order" step={10} {...money("extras")}
                tooltip="Flat charges per order: packaging, shipping, design time." />
              <NumberField id="usdRate" label="Exchange rate" prefix="₹" suffix="per $1" step={0.5} value={s.usdRate} onChange={(v) => update("usdRate", v)} {...lim("usdRate")}
                hint={`Used when quoting in USD · ${formatMoney(s.usdRate, "INR")} = $1`} />
            </div>
          </section>

          <div>
            <Button variant="ghost" onClick={onReset} icon={<Reset size={16} />} className="-ml-2">Reset all settings</Button>
          </div>
        </div>
      </Accordion>
    </div>
  );
}
