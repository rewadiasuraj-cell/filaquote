/** STL parsing and mesh measurement. Runs entirely in the browser. */

export interface MeshInfo {
  positions: Float32Array;
  triangles: number;
  volumeMm3: number;
  areaMm2: number;
  size: [number, number, number];
  min: [number, number, number];
  max: [number, number, number];
}

export class StlError extends Error {}

export function parseSTL(buf: ArrayBuffer): Float32Array {
  if (buf.byteLength < 15) throw new StlError("This file is empty. Export the model again as STL.");
  const dv = new DataView(buf);
  if (buf.byteLength >= 84) {
    const n = dv.getUint32(80, true);
    if (n > 0 && 84 + n * 50 === buf.byteLength) {
      const pos = new Float32Array(n * 9);
      let o = 84;
      for (let i = 0; i < n; i++) {
        o += 12; // facet normal, recomputed later
        for (let j = 0; j < 9; j++) {
          pos[i * 9 + j] = dv.getFloat32(o, true);
          o += 4;
        }
        o += 2; // attribute byte count
      }
      return pos;
    }
  }
  const text = new TextDecoder().decode(buf);
  if (!/^\s*solid/i.test(text) || !/facet/i.test(text)) {
    throw new StlError("This doesn't look like an STL file. Export your model from your CAD tool as STL (binary or ASCII).");
  }
  const re = /vertex\s+([-+\d.eE]+)\s+([-+\d.eE]+)\s+([-+\d.eE]+)/g;
  const out: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push(+m[1], +m[2], +m[3]);
  if (!out.length || out.length % 9 !== 0) {
    throw new StlError("The STL file is incomplete or damaged. Try exporting it again.");
  }
  return new Float32Array(out);
}

export function measure(positions: Float32Array): MeshInfo {
  let vol = 0;
  let area = 0;
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 9) {
    const ax = positions[i], ay = positions[i + 1], az = positions[i + 2];
    const bx = positions[i + 3], by = positions[i + 4], bz = positions[i + 5];
    const cx = positions[i + 6], cy = positions[i + 7], cz = positions[i + 8];
    // Signed volume of the tetrahedron (origin, a, b, c)
    vol += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    area += Math.sqrt(nx * nx + ny * ny + nz * nz) / 2;
    for (let k = 0; k < 9; k++) {
      const a = k % 3;
      const v = positions[i + k];
      if (v < min[a]) min[a] = v;
      if (v > max[a]) max[a] = v;
    }
  }
  return {
    positions,
    triangles: positions.length / 9,
    volumeMm3: Math.abs(vol),
    areaMm2: area,
    size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]],
    min,
    max,
  };
}

/** A closed, 80 mm twisted star vase used as the first-run sample. */
export function sampleVase(): Float32Array {
  const P = 10, RINGS = 40, H = 80, TWIST = Math.PI * 0.4;
  const ring = (h: number) => {
    const t = h / RINGS;
    const bulge = 22 + 9 * Math.sin(Math.PI * t * 0.9 + 0.3);
    return Array.from({ length: P }, (_, i) => {
      const a = (i / P) * Math.PI * 2 + TWIST * t;
      const r = i % 2 ? bulge * 0.78 : bulge;
      return [r * Math.cos(a), r * Math.sin(a), t * H] as const;
    });
  };
  const rings = Array.from({ length: RINGS + 1 }, (_, h) => ring(h));
  const tri: number[] = [];
  const push = (...v: ReadonlyArray<readonly [number, number, number]>) => v.forEach((p) => tri.push(p[0], p[1], p[2]));
  for (let h = 0; h < RINGS; h++) {
    const L = rings[h], U = rings[h + 1];
    for (let i = 0; i < P; i++) {
      const j = (i + 1) % P;
      push(L[i], L[j], U[j]);
      push(L[i], U[j], U[i]);
    }
  }
  const cb = [0, 0, 0] as const, ct = [0, 0, H] as const;
  const B = rings[0], T = rings[RINGS];
  for (let i = 0; i < P; i++) {
    const j = (i + 1) % P;
    push(cb, B[j], B[i]);
    push(ct, T[i], T[j]);
  }
  return new Float32Array(tri);
}
