import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type Settings,
} from '../db/library';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void loadSettings().then((s) => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  /** 应用主题与排版到文档根节点 */
  useEffect(() => {
    if (!loaded) return;
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);
    root.style.setProperty('--reader-size', `${settings.fontSize}px`);
    root.style.setProperty('--reader-lh', String(settings.lineHeight));
    root.style.setProperty('--reader-pad', `${settings.pagePadding}px`);
    const fontMap = {
      serif: 'var(--font-serif)',
      sans: 'var(--font-sans)',
      mono: 'var(--font-mono)',
    } as const;
    root.style.setProperty('--reader-font', fontMap[settings.fontFamily]);
  }, [settings, loaded]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      void saveSettings(next);
      return next;
    });
  }, []);

  return { settings, update, loaded };
}
