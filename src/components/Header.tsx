import type { Currency } from "../lib/pricing";
import type { ThemePref } from "../hooks";
import { SegmentedControl } from "./Controls";
import { Github, Logo, Monitor, Moon, Sun } from "./Icons";

const NEXT: Record<ThemePref, ThemePref> = { system: "light", light: "dark", dark: "system" };
const THEME_LABEL: Record<ThemePref, string> = { system: "System theme", light: "Light theme", dark: "Dark theme" };

export function ThemeToggle({ pref, onChange }: { pref: ThemePref; onChange: (p: ThemePref) => void }) {
  const Icon = pref === "light" ? Sun : pref === "dark" ? Moon : Monitor;
  return (
    <button
      type="button"
      onClick={() => onChange(NEXT[pref])}
      aria-label={`${THEME_LABEL[pref]}. Switch to ${THEME_LABEL[NEXT[pref]].toLowerCase()}`}
      title={THEME_LABEL[pref]}
      className="inline-flex size-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-sunk hover:text-fg"
    >
      <Icon size={19} />
    </button>
  );
}

export function CurrencySelector({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  return (
    <SegmentedControl
      label="Currency"
      size="sm"
      value={value}
      onChange={onChange}
      options={[
        { value: "INR", label: (<><span aria-hidden>₹</span><span className="hidden min-[360px]:inline">INR</span><span className="sr-only min-[360px]:hidden">INR</span></>) },
        { value: "USD", label: (<><span aria-hidden>$</span><span className="hidden min-[360px]:inline">USD</span><span className="sr-only min-[360px]:hidden">USD</span></>) },
      ]}
    />
  );
}

export function Header({
  currency, onCurrency, theme, onTheme,
}: { currency: Currency; onCurrency: (c: Currency) => void; theme: ThemePref; onTheme: (t: ThemePref) => void }) {
  return (
    <header className="no-print sticky top-[env(safe-area-inset-top,0px)] z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 gutter">
        <a href="#" className="flex h-11 min-w-0 items-center gap-2.5 rounded-lg" aria-label="FilaQuote home">
          <Logo />
          <span className="text-[17px] font-semibold tracking-tight">FilaQuote</span>
          <span className="hidden rounded-md border border-line px-1.5 py-0.5 font-mono text-[11px] text-subtle sm:inline">v3</span>
        </a>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <CurrencySelector value={currency} onChange={onCurrency} />
          <ThemeToggle pref={theme} onChange={onTheme} />
          <a
            href="https://github.com/rewadiasuraj-cell/filaquote"
            target="_blank"
            rel="noopener"
            aria-label="FilaQuote on GitHub"
            className="hidden size-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-sunk hover:text-fg sm:inline-flex"
          >
            <Github size={19} />
          </a>
        </div>
      </div>
    </header>
  );
}
