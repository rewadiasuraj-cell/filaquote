import { useEffect, useRef, useState } from "react";
import type { MeshInfo } from "../lib/geometry";
import { Reset, Spinner } from "./Icons";

/* three.js is lazy-loaded the first time the viewer mounts, so the quote is usable before it arrives. */
const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
const ORBIT_URL = "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ThreeNS = any;
declare global { interface Window { THREE?: ThreeNS } }

let threePromise: Promise<ThreeNS> | null = null;
function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Couldn't load ${src}`));
    document.head.appendChild(s);
  });
}
export function loadThree(): Promise<ThreeNS> {
  if (!threePromise) {
    threePromise = (window.THREE ? Promise.resolve() : loadScript(THREE_URL))
      .then(() => (window.THREE.OrbitControls ? undefined : loadScript(ORBIT_URL)))
      .then(() => window.THREE)
      .catch((e) => { threePromise = null; throw e; });
  }
  return threePromise;
}

function cssColor(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#f97316";
}

interface Ctx {
  T: ThreeNS; renderer: ThreeNS; scene: ThreeNS; camera: ThreeNS; controls: ThreeNS; material: ThreeNS;
  mesh: ThreeNS | null; render: () => void; frame: (m: MeshInfo) => void;
}

export function ModelViewer({ mesh }: { mesh: MeshInfo | null }) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const ctx = useRef<Ctx | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  // Create renderer once three.js has loaded.
  useEffect(() => {
    let disposed = false;
    let ro: ResizeObserver | null = null;
    let mo: MutationObserver | null = null;
    let mq: MediaQueryList | null = null;
    const onScheme = () => { if (ctx.current) { ctx.current.material.color.set(cssColor("--model")); ctx.current.render(); } };

    loadThree().then((T) => {
      if (disposed || !canvas.current || !host.current) return;
      const renderer = new T.WebGLRenderer({ canvas: canvas.current, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(35, 1, 0.1, 10000);
      scene.add(new T.HemisphereLight(0xffffff, 0x404048, 0.9));
      const key = new T.DirectionalLight(0xffffff, 0.75);
      key.position.set(1, 2, 1.4);
      camera.add(key);
      scene.add(camera);
      const material = new T.MeshStandardMaterial({ color: cssColor("--model"), roughness: 0.5, metalness: 0.05, flatShading: true });
      const controls = new T.OrbitControls(camera, canvas.current);
      controls.enableDamping = false;
      controls.screenSpacePanning = true;

      const render = () => renderer.render(scene, camera);
      controls.addEventListener("change", render);

      const frame = (m: MeshInfo) => {
        const r = Math.max(1, Math.hypot(...m.size) / 2);
        const dist = (r / Math.tan((35 * Math.PI) / 360)) * 1.1;
        camera.near = r / 100;
        camera.far = r * 100;
        camera.position.set(dist * 0.62, dist * 0.42, dist * 0.66);
        camera.updateProjectionMatrix();
        controls.target.set(0, 0, 0);
        controls.minDistance = r * 0.3;
        controls.maxDistance = r * 12;
        controls.update();
        render();
      };

      const resize = () => {
        const el = host.current;
        if (!el) return;
        const w = el.clientWidth, h = el.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        render();
      };
      ro = new ResizeObserver(resize);
      ro.observe(host.current);

      mo = new MutationObserver(onScheme);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      mq = matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", onScheme);

      ctx.current = { T, renderer, scene, camera, controls, material, mesh: null, render, frame };
      resize();
      setState("ready");
    }).catch(() => !disposed && setState("error"));

    return () => {
      disposed = true;
      ro?.disconnect();
      mo?.disconnect();
      mq?.removeEventListener("change", onScheme);
      const c = ctx.current;
      if (c) { c.controls.dispose(); c.mesh?.geometry.dispose(); c.material.dispose(); c.renderer.dispose(); }
      ctx.current = null;
    };
  }, []);

  // Swap the displayed mesh.
  useEffect(() => {
    const c = ctx.current;
    if (!c || state !== "ready") return;
    if (c.mesh) { c.scene.remove(c.mesh); c.mesh.geometry.dispose(); c.mesh = null; }
    if (!mesh) { c.render(); return; }
    const g = new c.T.BufferGeometry();
    g.setAttribute("position", new c.T.BufferAttribute(mesh.positions, 3));
    g.computeVertexNormals();
    g.translate(-(mesh.min[0] + mesh.max[0]) / 2, -(mesh.min[1] + mesh.max[1]) / 2, -(mesh.min[2] + mesh.max[2]) / 2);
    const m = new c.T.Mesh(g, c.material);
    m.rotation.x = -Math.PI / 2; // STL files are Z-up
    c.scene.add(m);
    c.mesh = m;
    c.frame(mesh);
  }, [mesh, state]);

  return (
    <div
      ref={host}
      className="viewer-grid relative aspect-[4/3] max-h-[520px] min-h-[220px] w-full max-w-full overflow-hidden rounded-xl border border-line md:aspect-auto md:h-[360px] md:resize-y lg:h-[400px]"
    >
      <canvas
        ref={canvas}
        className="block size-full touch-none cursor-grab active:cursor-grabbing"
        aria-label={mesh ? "Interactive 3D preview. Drag to rotate, right-drag or two fingers to pan, scroll or pinch to zoom." : "3D preview"}
        role="img"
      />
      {state === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-[13px] text-muted">
          <Spinner /> Loading 3D preview…
        </div>
      )}
      {state === "error" && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-[13px] text-muted">
          The 3D preview couldn't load (offline?). Your quote still works.
        </div>
      )}
      {state === "ready" && mesh && (
        <>
          <button
            type="button"
            onClick={() => ctx.current?.frame(mesh)}
            className="absolute right-2 top-2 inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface/90 px-3 text-[12.5px] font-medium text-muted backdrop-blur transition-colors hover:text-fg"
          >
            <Reset size={14} /> Reset view
          </button>
          <p className="pointer-events-none absolute bottom-2 left-3 hidden font-mono text-[11px] text-subtle sm:block">
            Drag rotate · Right-drag pan · Scroll zoom
          </p>
        </>
      )}
    </div>
  );
}
