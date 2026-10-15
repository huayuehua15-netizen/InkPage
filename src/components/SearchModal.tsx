import type { BookSearchResult } from '../utils/librarySearch';
import type { Book } from '../db/library';

interface Props {
  keyword: string;
  results: BookSearchResult[];
  onOpenBook: (book: Book) => void;
  onJump: (book: Book, percent: number) => void;
}

/** 高亮关键词 */
function highlight(text: string, keyword: string) {
  const kw = keyword.trim();
  if (!kw) return text;
  const parts = text.split(new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'));
  return parts.map((p, i) =>
    p.toLowerCase() === kw.toLowerCase() ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>
  );
}

/** 书库内全文搜索结果面板 */
export function SearchResults({ keyword, results, onOpenBook, onJump }: Props) {
  if (results.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">🔍</div>
        <div>没有找到与「{keyword}」相关的内容</div>
      </div>
    );
  }

  return (
    <div className="search-results">
      {results.map(({ book, hits }) => (
        <div key={book.id}>
          <div
            className="search-results__item"
            onClick={() => onOpenBook(book)}
            style={{ cursor: 'pointer' }}
          >
            <div className="search-results__book">
              {highlight(book.title, keyword)}
            </div>
            {hits.length === 0 && (
              <div className="search-results__excerpt">书名命中，点击打开书籍</div>
            )}
          </div>
          {hits.map((hit, i) => (
            <div
              key={i}
              className="search-results__item"
              onClick={() => onJump(book, hit.percent)}
              style={{ cursor: 'pointer', paddingLeft: 16 }}
            >
              <div className="search-results__excerpt">
                {highlight(hit.excerpt, keyword)}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
