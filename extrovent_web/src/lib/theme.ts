export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'extrovent_theme';

function apply(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', mode);
  }
}

export function getTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {}
  return 'system';
}

export function setTheme(mode: ThemeMode): void {
  try { localStorage.setItem(STORAGE_KEY, mode); } catch {}
  apply(mode);
}

export function initTheme(): void {
  const mode = getTheme();
  apply(mode);
  // when system, listen to OS changes for live update (data-theme stays unset, CSS media handles it)
  if (mode === 'system') {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener?.('change', () => apply('system'));
  }
}
