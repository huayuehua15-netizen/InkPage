import { searchInContent, type SearchHit } from '../utils/search';
import type { Book } from '../db/library';

export interface BookSearchResult {
  book: Book;
  hits: SearchHit[];
}

/** 在书库中全文搜索（书名 + 内容），返回命中的书与摘录 */
export function searchLibrary(books: Book[], keyword: string): BookSearchResult[] {
  const kw = keyword.trim();
  if (!kw) return [];
  const results: BookSearchResult[] = [];
  for (const book of books) {
    const hits = searchInContent(book.content, kw, 5);
    const titleMatch = book.title.toLowerCase().includes(kw.toLowerCase());
    if (hits.length > 0 || titleMatch) {
      results.push({ book, hits });
    }
    if (results.length >= 20) break;
  }
  return results;
}
