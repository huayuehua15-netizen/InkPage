import { useCallback, useRef, useState } from 'react';
import { readBookFiles } from '../utils/fileImport';
import type { ImportedBook } from '../utils/fileImport';
import { IconPlus } from './Icons';

interface Props {
  onImport: (books: ImportedBook[]) => void | Promise<void>;
  variant?: 'button' | 'fab';
  onError?: (msg: string) => void;
}

/** 文件导入：点击选择或拖拽（拖拽监听挂在 window 上由调用方复用） */
export function ImportButton({ onImport, variant = 'button', onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!files || (files as FileList).length === 0) return;
      setBusy(true);
      try {
        const books = await readBookFiles(files);
        if (books.length > 0) await onImport(books);
      } catch (e) {
        onError?.(e instanceof Error ? e.message : '导入失败');
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [onImport, onError]
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,.markdown,.mdown,.mkd,text/plain,text/markdown"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => void handleFiles(e.target.files!)}
      />
      {variant === 'fab' ? (
        <button
          className="icon-btn"
          aria-label="导入文件"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
        >
          <IconPlus />
        </button>
      ) : (
        <button
          className="primary-btn"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? '导入中…' : '导入 TXT / MD 文件'}
        </button>
      )}
    </>
  );
}

/** 全局拖拽导入：拖到页面任意位置松手即导入 */
export function useDropImport(onImport: (books: ImportedBook[]) => void | Promise<void>, onError?: (msg: string) => void) {
  const [dragging, setDragging] = useState(false);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent) => {
    if (e.relatedTarget === null) setDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        void readBookFiles(files)
          .then((books) => onImport(books))
          .catch((err) => onError?.(err instanceof Error ? err.message : '导入失败'));
      }
    },
    [onImport, onError]
  );

  return { dragging, onDragOver, onDragLeave, onDrop };
}
