// Production build: bundles src/ with esbuild and compiles Tailwind v4, no dev server needed.
//   node scripts/build.mjs            → index.html + assets/ (GitHub Pages, repo root)
//   node scripts/build.mjs --single   → also dist/filaquote.html (one self-contained file)
import { build } from "esbuild";
import { compile } from "tailwindcss";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const require = createRequire(import.meta.url);
const twDir = path.dirname(require.resolve("tailwindcss/package.json"));
const single = process.argv.includes("--single");

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (/\.(tsx?|css)$/.test(e.name)) out.push(p);
  }
  return out;
}

// 1. JavaScript
const js = await build({
  entryPoints: [path.join(root, "src/main.tsx")],
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2020", "safari15"],
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  write: false,
  legalComments: "none",
});
const jsCode = js.outputFiles[0].text;

// 2. CSS: scan source files for class candidates, then let Tailwind generate only what's used.
const files = await walk(path.join(root, "src"));
const candidates = new Set();
for (const f of files) {
  const src = await fs.readFile(f, "utf8");
  for (const tok of src.split(/[\s"'`{}()<>,;]+/)) if (tok) candidates.add(tok);
}
const cssInput = await fs.readFile(path.join(root, "src/styles.css"), "utf8");
const compiler = await compile(cssInput, {
  base: root,
  async loadStylesheet(id, base) {
    const file = id === "tailwindcss" ? path.join(twDir, "index.css") : path.join(twDir, id.replace(/^tailwindcss\//, ""));
    return { path: file, base: path.dirname(file), content: await fs.readFile(file, "utf8") };
  },
});
const rawCss = compiler.build([...candidates]);
const css = (await build({ stdin: { contents: rawCss, loader: "css" }, minify: true, write: false, logLevel: "silent" })).outputFiles[0].text;

// 3. HTML
const head = `<title>FilaQuote</title>
<meta name="description" content="Free, open-source 3D print cost calculator. Upload an STL and get material, time, electricity and a ready-to-send quote. Runs in your browser.">
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="theme-color" content="#09090b" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#f7f7f8" media="(prefers-color-scheme: light)">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap">`;

await fs.mkdir(path.join(root, "assets"), { recursive: true });
await fs.writeFile(path.join(root, "assets/app.js"), jsCode);
await fs.writeFile(path.join(root, "assets/app.css"), css);
await fs.writeFile(
  path.join(root, "index.html"),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${head}
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#facc15"/><stop offset="1" stop-color="#f97316"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="url(#g)"/><path d="M11 8h10l-2 6h-6z" fill="#1c1003"/><rect x="8" y="18" width="16" height="2.4" rx="1.2" fill="#1c1003"/></svg>')}">
<link rel="stylesheet" href="assets/app.css">
</head>
<body>
<div id="root"></div>
<noscript>FilaQuote needs JavaScript to calculate quotes.</noscript>
<script src="assets/app.js"></script>
</body>
</html>
`,
);

if (single) {
  await fs.mkdir(path.join(root, "dist"), { recursive: true });
  const safeJs = jsCode.replace(/<\/script/gi, "<\\/script");
  await fs.writeFile(
    path.join(root, "dist/filaquote.html"),
    `${head}\n<style>${css}</style>\n<div id="root"></div>\n<script>${safeJs}</script>\n`,
  );
}

const kb = (s) => `${(Buffer.byteLength(s) / 1024).toFixed(0)} KB`;
console.log(`Built: app.js ${kb(jsCode)}, app.css ${kb(css)}${single ? ", dist/filaquote.html" : ""}`);
