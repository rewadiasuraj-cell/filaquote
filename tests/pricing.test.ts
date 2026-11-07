import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SETTINGS, computeQuote, estimateUsage, slicerUsage, toCurrency, fromCurrency, type Settings } from "../src/lib/pricing.ts";
import { measure, parseSTL, sampleVase, StlError } from "../src/lib/geometry.ts";

const near = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);
const s = (o: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS, ...o });

/** 10 mm cube as 12 outward-facing triangles */
function cube(n = 10): Float32Array {
  const v = [[0,0,0],[n,0,0],[n,n,0],[0,n,0],[0,0,n],[n,0,n],[n,n,n],[0,n,n]];
  const f = [[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]];
  return new Float32Array(f.flatMap((t) => t.flatMap((i) => v[i])));
}

test("cube volume and area are exact", () => {
  const m = measure(cube());
  near(m.volumeMm3, 1000);
  near(m.areaMm2, 600);
  assert.deepEqual(m.size, [10, 10, 10]);
});

test("binary STL round-trips", () => {
  const pos = cube();
  const n = pos.length / 9;
  const buf = new ArrayBuffer(84 + n * 50);
  const dv = new DataView(buf);
  dv.setUint32(80, n, true);
  for (let i = 0; i < n; i++) for (let j = 0; j < 9; j++) dv.setFloat32(84 + i * 50 + 12 + j * 4, pos[i * 9 + j], true);
  near(measure(parseSTL(buf)).volumeMm3, 1000);
});

test("ASCII STL parses and junk is rejected", () => {
  const ascii = "solid t\nfacet normal 0 0 1\nouter loop\nvertex 0 0 0\nvertex 1 0 0\nvertex 0 1 0\nendloop\nendfacet\nendsolid t";
  assert.equal(parseSTL(new TextEncoder().encode(ascii).buffer as ArrayBuffer).length, 9);
  assert.throws(() => parseSTL(new TextEncoder().encode("hello world, not a model").buffer as ArrayBuffer), StlError);
});

test("sample vase is closed (positive, stable volume)", () => {
  const m = measure(sampleVase());
  assert.ok(m.volumeMm3 > 100_000 && m.volumeMm3 < 200_000);
});

test("solid cube at 100% infill weighs volume × density", () => {
  const u = estimateUsage({ volumeMm3: 1000, areaMm2: 600 }, s({ infill: 100, support: 0, density: 1.24 }));
  near(u.grams, 1.24);
});

test("shell is capped at the model volume", () => {
  const u = estimateUsage({ volumeMm3: 1000, areaMm2: 600 }, s({ infill: 0, support: 0, wallThickness: 5, density: 1 }));
  near(u.grams, 1);
});

test("thicker layers print faster", () => {
  const g = { volumeMm3: 50_000, areaMm2: 8_000 };
  assert.ok(estimateUsage(g, s({ layerHeight: 0.28 })).hours < estimateUsage(g, s({ layerHeight: 0.2 })).hours);
});

test("quote adds up line by line", () => {
  const set = s({ pricePerKg: 1000, watts: 100, tariff: 10, machineRate: 20, laborMinutes: 30, laborRate: 120, failure: 10, margin: 50, quantity: 3, extras: 50, tax: 18 });
  const q = computeQuote({ grams: 100, hours: 2, source: "slicer" }, set);
  near(q.material, 100);
  near(q.electricity, 2);
  near(q.machine, 40);
  near(q.labor, 60);
  near(q.failure, 20.2);
  near(q.productionCost, 222.2);
  near(q.unitPrice, 444.4); // 50% margin doubles cost
  near(q.profit, 222.2);
  near(q.subtotal, 444.4 * 3 + 50);
  near(q.tax, (444.4 * 3 + 50) * 0.18);
  near(q.total, (444.4 * 3 + 50) * 1.18);
});

test("margin is a share of price, not a markup", () => {
  const q = computeQuote({ grams: 0, hours: 0, source: "slicer" }, s({ laborMinutes: 60, laborRate: 60, failure: 0, margin: 40 }));
  near(q.profit / q.unitPrice, 0.4);
});

test("invalid inputs are clamped, never NaN", () => {
  const q = computeQuote({ grams: 10, hours: 1, source: "slicer" }, s({ margin: 150, quantity: -4, tax: NaN }));
  assert.ok(Number.isFinite(q.total));
  assert.equal(q.quantity, 1);
});

test("slicer mode uses entered grams and minutes", () => {
  const u = slicerUsage(s({ slicerGrams: 42, slicerMinutes: 90 }));
  near(u.grams, 42);
  near(u.hours, 1.5);
});

test("currency conversion round-trips", () => {
  const usd = { currency: "USD" as const, usdRate: 84 };
  near(fromCurrency(toCurrency(1234, usd), usd), 1234);
  near(toCurrency(840, usd), 10);
});
