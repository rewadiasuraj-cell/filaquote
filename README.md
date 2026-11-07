# FilaQuote

**A free, open-source 3D print cost calculator that runs entirely in your browser.**

Drop in an STL file and FilaQuote tells you how much filament it needs, how long it will take, and what it really costs you to print — material, machine wear, electricity, labour and a failure buffer — then turns that into a price you can send to a customer.

No sign-up, no server, no uploads. Your models never leave your computer.

## Features

- **STL support** — binary and ASCII, any size your browser can hold
- **Live 3D preview** — drag to rotate, scroll to zoom
- **Real geometry maths** — exact volume and surface area from the mesh, so wall loops and infill are estimated properly instead of guessing "volume × density"
- **Full cost breakdown** — filament, machine depreciation, electricity, labour, failure buffer and markup
- **Material presets** — PLA, PETG, ABS, ASA, TPU, Silk, or your own custom density and price
- **Multi-currency** — ₹ INR, $ USD, € EUR, £ GBP
- **Quantity pricing** — quote 1 piece or 500
- **One-click quote** — copy a clean summary straight into WhatsApp or email
- **Remembers your settings** — saved locally in your browser
- **Light and dark mode**, works on phones

## Quick start

It's a single HTML file. No build step.

```bash
git clone https://github.com/<your-username>/filaquote.git
cd filaquote
# open index.html in your browser, or serve it:
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

### Host it free on GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Choose **Deploy from a branch**, select `main` and `/ (root)`
4. Your calculator is live at `https://<your-username>.github.io/filaquote/`

## How the estimate works

| Step | Formula |
|---|---|
| Model volume | Signed tetrahedron sum over every triangle (exact for watertight meshes) |
| Solid shell | `surface area × wall loops × 0.45 mm` (capped at model volume) |
| Printed volume | `shell + (volume − shell) × infill %` |
| Filament (g) | `printed volume (cm³) × density × (1 + supports & waste %)` |
| Print time | `filament (g) ÷ throughput (g/h)` |
| Machine wear | `print hours × printer price ÷ expected life (h)` |
| Electricity | `watts ÷ 1000 × hours × rate per kWh` |
| Cost | `(filament + wear + power + labour) × (1 + failure buffer %)` |
| Price | `cost × (1 + markup %)` |

**Tip:** slice a couple of your usual prints, then set *Throughput* to `slicer grams ÷ slicer hours`. After that, FilaQuote's time estimates will track your printer closely.

These are estimates. Your slicer is still the source of truth for a specific print.

## Roadmap

Good first contributions:

- [ ] 3MF and OBJ file support
- [ ] Multiple plates / multiple files in one quote
- [ ] Printable PDF quote with your shop's logo
- [ ] Import exact grams and time from G-code
- [ ] Resin (SLA/MSLA) mode with ml-based pricing
- [ ] Translations (Hindi, Spanish, German, …)
- [ ] Shareable quote links

## Contributing

Pull requests are welcome. For a bigger change, open an issue first so we can talk it through.

1. Fork the repo
2. Create a branch: `git checkout -b feature/3mf-support`
3. Commit your changes
4. Open a pull request

Everything lives in `index.html`. The only dependency is [three.js](https://threejs.org/) (r128) loaded from cdnjs for the preview.

## License

[MIT](LICENSE) — free for personal and commercial use.
