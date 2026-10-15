import { useCallback, useEffect, useState } from 'react';
import {
  addBook,
  deleteBook,
  getAllBooks,
  getProgress,
  saveProgress,
  type Book,
} from '../db/library';
import type { ImportedBook } from '../utils/fileImport';

export function useLibrary() {
  const [books, setBooks] = useState<Book[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const list = await getAllBooks();
    setBooks(list);
    const map: Record<string, number> = {};
    await Promise.all(
      list.map(async (b) => {
        const p = await getProgress(b.id);
        if (p) map[b.id] = p.percent;
      })
    );
    setProgressMap(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const importBooks = useCallback(
    async (imported: ImportedBook[]) => {
      for (const item of imported) {
        const book: Book = { ...item, id: crypto.randomUUID() };
        await addBook(book);
      }
      await refresh();
    },
    [refresh]
  );

  const removeBook = useCallback(
    async (id: string) => {
      await deleteBook(id);
      await refresh();
    },
    [refresh]
  );

  const markProgress = useCallback(async (bookId: string, percent: number) => {
    await saveProgress(bookId, percent);
    setProgressMap((m) => ({ ...m, [bookId]: percent }));
  }, []);

  return { books, progressMap, loading, importBooks, removeBook, markProgress, refresh };
}
