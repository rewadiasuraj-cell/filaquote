/**
 * FilaQuote pricing engine.
 * Pure functions only: no DOM, no React. Every money value is in INR.
 */
import { findMaterial, findPrinter } from "./presets";

export type Currency = "INR" | "USD";
export type Mode = "estimate" | "slicer";

export interface Settings {
  mode: Mode;
  currency: Currency;
  /** INR per 1 USD */
  usdRate: number;

  materialId: string;
  density: number;
  pricePerKg: number;
  infill: number;
  quantity: number;
  /** True profit margin, % of selling price (0–90) */
  margin: number;

  printerId: string;
  watts: number;
  tariff: number;
  layerHeight: number;
  wallThickness: number;
  throughput: number;
  support: number;
  machineRate: number;
  laborMinutes: number;
  laborRate: number;
  failure: number;
  tax: number;
  extras: number;

  slicerGrams: number;
  slicerMinutes: number;
}

const pla = findMaterial("pla");
const a1 = findPrinter("a1");

export const DEFAULT_SETTINGS: Settings = {
  mode: "estimate",
  currency: "INR",
  usdRate: 84,

  materialId: pla.id,
  density: pla.density,
  pricePerKg: pla.pricePerKg,
  infill: 15,
  quantity: 1,
  margin: 40,

  printerId: a1.id,
  watts: a1.watts,
  tariff: 8,
  layerHeight: 0.2,
  wallThickness: 1.2,
  throughput: a1.throughput,
  support: 5,
  machineRate: a1.machineRate,
  laborMinutes: 10,
  laborRate: 200,
  failure: 8,
  tax: 0,
  extras: 0,

  slicerGrams: 0,
  slicerMinutes: 0,
};

/** Valid ranges, shared by the engine (clamping) and the UI (inline validation). */
export const LIMITS: Record<keyof Omit<Settings, "mode" | "currency" | "materialId" | "printerId">, [number, number]> = {
  usdRate: [1, 1000],
  density: [0.5, 3],
  pricePerKg: [0, 100000],
  infill: [0, 100],
  quantity: [1, 100000],
  margin: [0, 90],
  watts: [0, 5000],
  tariff: [0, 100],
  layerHeight: [0.04, 1],
  wallThickness: [0.2, 10],
  throughput: [1, 500],
  support: [0, 300],
  machineRate: [0, 10000],
  laborMinutes: [0, 6000],
  laborRate: [0, 100000],
  failure: [0, 100],
  tax: [0, 100],
  extras: [0, 10000000],
  slicerGrams: [0, 100000],
  slicerMinutes: [0, 100000],
};

export interface Geometry {
  volumeMm3: number;
  areaMm2: number;
}

export interface Usage {
  /** Filament per unit, grams (incl. supports and purge) */
  grams: number;
  /** Print time per unit, hours */
  hours: number;
  /** "estimate" = derived from mesh geometry, "slicer" = entered from a slicer */
  source: Mode;
}

export interface Quote extends Usage {
  material: number;
  electricity: number;
  machine: number;
  labor: number;
  failure: number;
  productionCost: number;
  profit: number;
  unitPrice: number;
  quantity: number;
  itemsTotal: number;
  extras: number;
  subtotal: number;
  tax: number;
  total: number;
}

const clamp = (v: number, [lo, hi]: [number, number]) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);

/** Filament and time from mesh geometry. An estimate, never a slicer result. */
export function estimateUsage(g: Geometry, s: Settings): Usage {
  const volume = Math.max(0, g.volumeMm3);
  const wall = clamp(s.wallThickness, LIMITS.wallThickness);
  const shell = Math.min(volume, Math.max(0, g.areaMm2) * wall);
  const core = volume - shell;
  const printedMm3 = shell + core * (clamp(s.infill, LIMITS.infill) / 100);
  const partGrams = (printedMm3 / 1000) * clamp(s.density, LIMITS.density);
  const grams = partGrams * (1 + clamp(s.support, LIMITS.support) / 100);
  // Thicker layers move more plastic per hour, roughly in proportion.
  const effectiveThroughput = clamp(s.throughput, LIMITS.throughput) * (clamp(s.layerHeight, LIMITS.layerHeight) / 0.2);
  const hours = grams / effectiveThroughput;
  return { grams, hours, source: "estimate" };
}

/** Filament and time typed in from a slicer (Cura, PrusaSlicer, OrcaSlicer). */
export function slicerUsage(s: Settings): Usage {
  return {
    grams: clamp(s.slicerGrams, LIMITS.slicerGrams),
    hours: clamp(s.slicerMinutes, LIMITS.slicerMinutes) / 60,
    source: "slicer",
  };
}

export function computeQuote(usage: Usage, s: Settings): Quote {
  const { grams, hours } = usage;
  const material = (grams / 1000) * clamp(s.pricePerKg, LIMITS.pricePerKg);
  const electricity = (clamp(s.watts, LIMITS.watts) / 1000) * hours * clamp(s.tariff, LIMITS.tariff);
  const machine = hours * clamp(s.machineRate, LIMITS.machineRate);
  const labor = (clamp(s.laborMinutes, LIMITS.laborMinutes) / 60) * clamp(s.laborRate, LIMITS.laborRate);
  const base = material + electricity + machine + labor;
  const failure = base * (clamp(s.failure, LIMITS.failure) / 100);
  const productionCost = base + failure;

  // A margin is a share of the selling price: price = cost / (1 − margin).
  const m = clamp(s.margin, LIMITS.margin) / 100;
  const unitPrice = productionCost / (1 - m);
  const profit = unitPrice - productionCost;

  const quantity = Math.round(clamp(s.quantity, LIMITS.quantity));
  const itemsTotal = unitPrice * quantity;
  const extras = clamp(s.extras, LIMITS.extras);
  const subtotal = itemsTotal + extras;
  const tax = subtotal * (clamp(s.tax, LIMITS.tax) / 100);
  const total = subtotal + tax;

  return {
    ...usage,
    material, electricity, machine, labor, failure, productionCost,
    profit, unitPrice, quantity, itemsTotal, extras, subtotal, tax, total,
  };
}

/** Money conversion helpers: engine values are INR. */
export const toCurrency = (inr: number, s: Pick<Settings, "currency" | "usdRate">) =>
  s.currency === "USD" ? inr / s.usdRate : inr;
export const fromCurrency = (v: number, s: Pick<Settings, "currency" | "usdRate">) =>
  s.currency === "USD" ? v * s.usdRate : v;
