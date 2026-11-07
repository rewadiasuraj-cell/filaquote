# FilaQuote

**A free, open-source 3D print cost calculator. Upload an STL, check a price.**

FilaQuote turns a 3D model into a quote you can send to a customer: filament, print time, electricity, machine wear, labor, failure allowance, profit margin, tax and a final price. Everything runs in your browser. Models are never uploaded.

**Live app:** https://rewadiasuraj-cell.github.io/filaquote/

## What it does

1. **Upload model.** Drag and drop (desktop) or tap to upload (mobile) any binary or ASCII STL. Interactive 3D preview with rotate, pan and zoom. Exact size, volume and surface area in millimetres.
2. **Configure print.** *Quick estimate* shows only the six settings that matter most. *Advanced settings* hold printer, power, layer height, walls, speed, supports, machine cost, labor, failure allowance, taxes and extra charges.
3. **Instant quote.** Updates as you type. The final price leads, followed by a full cost breakdown and chart.

### Two pricing modes

| Mode | Weight & time come from | Label shown |
|---|---|---|
| **Quick estimate** (default) | The model's geometry | *Geometry estimate · ±20%* |
| **Slicer verified** | What you type in from Cura, PrusaSlicer or OrcaSlicer | *Slicer verified* |

Geometry estimates are never presented as slicer results.

### Also included

- Copy quote (ready for WhatsApp or email), Export CSV, Print / Save as PDF
- INR and USD with a configurable exchange rate; switching currency never changes the real price
- Printer presets (Bambu Lab A1/P1S/X1C, Creality K1/Ender-3 V3 SE, Prusa MK4S) and material presets
- Inline validation, tooltips on technical fields, light/dark/system theme
- Settings saved locally, no account needed
- Mobile: sticky price bar and a full quote bottom sheet; 44 px touch targets; safe-area aware

## How the quote is calculated

All logic lives in [`src/lib/pricing.ts`](src/lib/pricing.ts) (pure functions, unit tested).

| Step | Formula |
|---|---|
| Model volume | Signed tetrahedron sum over every triangle (exact for watertight meshes) |
| Solid shell | `min(volume, surface area × wall thickness)` |
| Printed volume | `shell + (volume − shell) × infill` |
| Filament | `printed volume × density × (1 + support allowance)` |
| Print time | `filament ÷ (speed × layer height ÷ 0.20 mm)` |
| Material | `filament kg × price per kg` |
| Electricity | `kW × hours × tariff` |
| Machine | `hours × machine hourly cost` |
| Labor | `minutes ÷ 60 × labor rate` |
| Production cost | `(material + electricity + machine + labor) × (1 + failure allowance)` |
| Selling price / unit | `production cost ÷ (1 − margin)` |
| Total | `(price × quantity + additional charges) × (1 + tax)` |

**Margin vs markup:** v3 uses a true profit margin (share of the selling price). A 40% margin on a ₹100 cost gives ₹167, of which ₹67 is profit.

**Calibrate it:** slice one typical job, then set *Printing speed* to `slicer grams ÷ slicer hours`.

## Development

```bash
npm install
npm test          # pricing + STL parser unit tests
npm run build     # writes index.html + assets/ for GitHub Pages
```

Stack: React 19, TypeScript, Tailwind CSS v4, esbuild. three.js r128 is lazy-loaded from a CDN the first time the 3D viewer opens, so the quote is usable instantly even on slow phones.

```
src/
  lib/          pricing.ts · geometry.ts · presets.ts · format.ts · export.ts  (no UI code)
  components/   Header, UploadZone, ModelViewer, ConfigPanel, QuoteCard, Fields,
                Controls (segmented, accordion, button, badge), Overlay (sheet, toasts), Tooltip
  hooks.ts      settings, theme, animated numbers, keyboard detection
  App.tsx       three-stage workflow and layout
tests/          node:test unit tests
scripts/build.mjs
```

After changing anything in `src/`, run `npm run build` and commit the updated `index.html` and `assets/`.

## Roadmap

- [ ] 3MF and OBJ upload
- [ ] Import grams and time straight from G-code
- [ ] Multiple parts in one quote
- [ ] Shop logo and terms on the PDF
- [ ] Resin (SLA/MSLA) mode
- [ ] Hindi and other translations

Pull requests are welcome. For big changes, open an issue first.

## License

[MIT](LICENSE)
