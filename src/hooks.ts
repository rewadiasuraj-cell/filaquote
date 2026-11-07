import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_SETTINGS, type Settings } from "./lib/pricing";

const SETTINGS_KEY = "filaquote.settings.v3";
const THEME_KEY = "filaquote.theme";

function readStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function writeStorage(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: preferences just won't persist */
  }
}

/** Settings persisted to localStorage, merged over defaults so new fields get sane values. */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => ({
    ...DEFAULT_SETTINGS,
    ...(readStorage<Partial<Settings>>(SETTINGS_KEY) ?? {}),
  }));
  useEffect(() => writeStorage(SETTINGS_KEY, settings), [settings]);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
  }, []);
  const patch = useCallback((p: Partial<Settings>) => setSettings((s) => ({ ...s, ...p })), []);
  const reset = useCallback(() => {
    writeStorage(SETTINGS_KEY, null);
    setSettings(DEFAULT_SETTINGS);
  }, []);
  return { settings, update, patch, reset };
}

export type ThemePref = "system" | "light" | "dark";

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(() => readStorage<ThemePref>(THEME_KEY) ?? "system");
  useEffect(() => {
    const root = document.documentElement;
    if (pref === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", pref);
    writeStorage(THEME_KEY, pref);
  }, [pref]);
  return { pref, setPref };
}

const reducedMotion = () =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Eases a number toward its target over ~220ms so price changes are easy to follow. */
export function useAnimatedNumber(target: number, duration = 220): number {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  const raf = useRef(0);
  useEffect(() => {
    if (reducedMotion() || !Number.isFinite(target)) {
      setValue(target);
      from.current = target;
      return;
    }
    const start = performance.now();
    const origin = from.current;
    cancelAnimationFrame(raf.current);
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      const v = origin + (target - origin) * eased;
      from.current = v;
      setValue(v);
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}

/** True when an on-screen keyboard is likely open (visual viewport noticeably shorter than layout). */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const check = () => setOpen(window.innerHeight - vv.height > 150);
    vv.addEventListener("resize", check);
    return () => vv.removeEventListener("resize", check);
  }, []);
  return open;
}

export function useMediaQuery(q: string): boolean {
  const [match, setMatch] = useState(() => typeof matchMedia !== "undefined" && matchMedia(q).matches);
  useEffect(() => {
    const m = matchMedia(q);
    const on = () => setMatch(m.matches);
    m.addEventListener("change", on);
    on();
    return () => m.removeEventListener("change", on);
  }, [q]);
  return match;
}
