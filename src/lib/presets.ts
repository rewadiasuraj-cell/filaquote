/**
 * Material and printer presets.
 * All money values are stored in INR. The UI converts to USD using the
 * user's exchange rate, so switching currency never changes the real price.
 */

export interface MaterialPreset {
  id: string;
  label: string;
  /** g/cm³ */
  density: number;
  /** INR per kg spool */
  pricePerKg: number;
}

export interface PrinterPreset {
  id: string;
  label: string;
  /** Average draw while printing, watts */
  watts: number;
  /** Grams of filament laid down per hour at 0.20 mm layers */
  throughput: number;
  /** Depreciation + maintenance, INR per print hour */
  machineRate: number;
}

export const MATERIALS: MaterialPreset[] = [
  { id: "pla", label: "PLA", density: 1.24, pricePerKg: 1100 },
  { id: "petg", label: "PETG", density: 1.27, pricePerKg: 1300 },
  { id: "abs", label: "ABS", density: 1.04, pricePerKg: 1300 },
  { id: "asa", label: "ASA", density: 1.07, pricePerKg: 1800 },
  { id: "tpu", label: "TPU 95A", density: 1.21, pricePerKg: 2200 },
  { id: "silk", label: "Silk PLA", density: 1.24, pricePerKg: 1400 },
  { id: "custom", label: "Custom", density: 1.24, pricePerKg: 1100 },
];

export const PRINTERS: PrinterPreset[] = [
  { id: "a1", label: "Bambu Lab A1", watts: 95, throughput: 22, machineRate: 10 },
  { id: "p1s", label: "Bambu Lab P1S", watts: 130, throughput: 28, machineRate: 16 },
  { id: "x1c", label: "Bambu Lab X1 Carbon", watts: 150, throughput: 30, machineRate: 25 },
  { id: "k1", label: "Creality K1", watts: 150, throughput: 25, machineRate: 12 },
  { id: "ender3v3", label: "Creality Ender-3 V3 SE", watts: 120, throughput: 12, machineRate: 5 },
  { id: "mk4s", label: "Prusa MK4S", watts: 90, throughput: 20, machineRate: 20 },
  { id: "custom", label: "Custom printer", watts: 120, throughput: 18, machineRate: 10 },
];

export const findMaterial = (id: string) => MATERIALS.find((m) => m.id === id) ?? MATERIALS[0];
export const findPrinter = (id: string) => PRINTERS.find((p) => p.id === id) ?? PRINTERS[0];
