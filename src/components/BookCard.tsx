import type { Book } from '../db/library';

interface Props {
  book: Book;
  percent: number;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export function BookCard({ book, percent, onOpen, onDelete }: Props) {
  return (
    <div className="book-card" onClick={() => onOpen(book.id)}>
      <div
        className="book-card__cover"
        style={{
          background: `linear-gradient(135deg, hsl(${book.coverHue}, 42%, 58%), hsl(${
            (book.coverHue + 40) % 360
          }, 48%, 42%))`,
        }}
      >
        <span className="book-card__type">{book.type === 'md' ? 'Markdown' : 'TXT'}</span>
      </div>
      <div className="book-card__body">
        <div className="book-card__title">{book.title}</div>
        <div className="book-card__meta">
          {formatDate(book.lastReadAt ?? book.importedAt)} · {(book.size / 1024).toFixed(0)} KB
        </div>
        <div className="book-card__progress">
          <i style={{ width: `${Math.round(percent)}%` }} />
        </div>
      </div>
      <button
        className="book-card__delete"
        aria-label="删除书籍"
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(`确定删除《${book.title}》？阅读进度与书签将一并删除。`)) {
            onDelete(book.id);
          }
        }}
      >
        ×
      </button>
    </div>
  );
}
