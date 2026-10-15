import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export type BookType = 'txt' | 'md';

export interface Book {
  id: string;
  title: string;
  fileName: string;
  type: BookType;
  content: string;
  size: number;
  importedAt: number;
  coverHue: number;
  lastReadAt?: number;
}

export interface ReadingProgress {
  bookId: string;
  /** 滚动条百分比 0-100 */
  percent: number;
  /** 可选：标题锚点（md） */
  anchor?: string;
  updatedAt: number;
}

export interface Bookmark {
  id: string;
  bookId: string;
  percent: number;
  excerpt: string;
  createdAt: number;
}

export type ThemeName = 'day' | 'night' | 'sepia' | 'paper';
export type FontFamily = 'serif' | 'sans' | 'mono';

export interface Settings {
  theme: ThemeName;
  fontSize: number;
  lineHeight: number;
  fontFamily: FontFamily;
  pagePadding: number;
  indentFirstLine: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'day',
  fontSize: 18,
  lineHeight: 1.8,
  fontFamily: 'serif',
  pagePadding: 20,
  indentFirstLine: false,
};

interface ReaderDB extends DBSchema {
  books: {
    key: string;
    value: Book;
    indexes: { 'by-importedAt': number; 'by-lastReadAt': number };
  };
  progress: {
    key: string;
    value: ReadingProgress;
  };
  bookmarks: {
    key: string;
    value: Bookmark;
    indexes: { 'by-bookId': string };
  };
  settings: {
    key: string;
    value: Settings;
  };
}

let dbPromise: Promise<IDBPDatabase<ReaderDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ReaderDB>('inkpage-reader', 1, {
      upgrade(db) {
        const books = db.createObjectStore('books', { keyPath: 'id' });
        books.createIndex('by-importedAt', 'importedAt');
        books.createIndex('by-lastReadAt', 'lastReadAt');
        db.createObjectStore('progress', { keyPath: 'bookId' });
        const bookmarks = db.createObjectStore('bookmarks', { keyPath: 'id' });
        bookmarks.createIndex('by-bookId', 'bookId');
        db.createObjectStore('settings');
      },
    });
  }
  return dbPromise;
}

/* ---------- 书籍 ---------- */

export async function addBook(book: Book): Promise<void> {
  const db = await getDB();
  await db.put('books', book);
}

export async function getAllBooks(): Promise<Book[]> {
  const db = await getDB();
  const books = await db.getAll('books');
  return books.sort((a, b) => (b.lastReadAt ?? b.importedAt) - (a.lastReadAt ?? a.importedAt));
}

export async function getBook(id: string): Promise<Book | undefined> {
  const db = await getDB();
  return db.get('books', id);
}

export async function touchBook(id: string): Promise<void> {
  const db = await getDB();
  const book = await db.get('books', id);
  if (book) {
    book.lastReadAt = Date.now();
    await db.put('books', book);
  }
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['books', 'progress', 'bookmarks'], 'readwrite');
  await tx.objectStore('books').delete(id);
  await tx.objectStore('progress').delete(id);
  const bookmarks = await tx.objectStore('bookmarks').index('by-bookId').getAll(id);
  for (const bm of bookmarks) {
    await tx.objectStore('bookmarks').delete(bm.id);
  }
  await tx.done;
}

/* ---------- 阅读进度 ---------- */

export async function saveProgress(bookId: string, percent: number, anchor?: string): Promise<void> {
  const db = await getDB();
  await db.put('progress', { bookId, percent, anchor, updatedAt: Date.now() });
}

export async function getProgress(bookId: string): Promise<ReadingProgress | undefined> {
  const db = await getDB();
  return db.get('progress', bookId);
}

/* ---------- 书签 ---------- */

export async function addBookmark(bookId: string, percent: number, excerpt: string): Promise<Bookmark> {
  const db = await getDB();
  const bm: Bookmark = {
    id: `${bookId}-${Date.now()}`,
    bookId,
    percent,
    excerpt,
    createdAt: Date.now(),
  };
  await db.put('bookmarks', bm);
  return bm;
}

export async function getBookmarks(bookId: string): Promise<Bookmark[]> {
  const db = await getDB();
  const list = await db.getAllFromIndex('bookmarks', 'by-bookId', bookId);
  return list.sort((a, b) => a.percent - b.percent);
}

export async function deleteBookmark(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('bookmarks', id);
}

/* ---------- 设置 ---------- */

export async function loadSettings(): Promise<Settings> {
  const db = await getDB();
  const saved = await db.get('settings', 'app');
  return { ...DEFAULT_SETTINGS, ...(saved ?? {}) };
}

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, 'app');
}

/* ---------- 全量清理 ---------- */

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['books', 'progress', 'bookmarks'], 'readwrite');
  await tx.objectStore('books').clear();
  await tx.objectStore('progress').clear();
  await tx.objectStore('bookmarks').clear();
  await tx.done;
}
