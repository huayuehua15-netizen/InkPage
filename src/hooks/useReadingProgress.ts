import { useCallback, useEffect, useRef, useState } from 'react';
import { getProgress, saveProgress } from '../db/library';

/**
 * 阅读进度：进入时恢复滚动位置，滚动时防抖保存。
 *
 * 注意：只有用户真实滚动过（dirty）才允许保存进度，
 * 避免 React StrictMode 的挂载-卸载模拟或未加载完成时
 * 用 0 覆盖已保存的进度。
 */
export function useReadingProgress(bookId: string, containerReady: boolean) {
  const [percent, setPercent] = useState(0);
  const [initialPercent, setInitialPercent] = useState<number | null>(null);
  const saveTimer = useRef<number | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!containerReady) return;
    let cancelled = false;
    void getProgress(bookId).then((p) => {
      if (!cancelled) setInitialPercent(p?.percent ?? 0);
    });
    return () => {
      cancelled = true;
    };
  }, [bookId, containerReady]);

  const onScroll = useCallback(
    (el: HTMLElement) => {
      const max = el.scrollHeight - el.clientHeight;
      const p = max > 0 ? Math.min(100, Math.max(0, (el.scrollTop / max) * 100)) : 0;
      dirtyRef.current = true;
      setPercent(p);
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        void saveProgress(bookId, p);
      }, 400);
    },
    [bookId]
  );

  /** 立即保存（离开页面前调用）；仅在有真实滚动时保存 */
  const flush = useCallback(
    (p: number) => {
      if (!dirtyRef.current) return;
      void saveProgress(bookId, p);
    },
    [bookId]
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  return { percent, setPercent, initialPercent, onScroll, flush };
}
