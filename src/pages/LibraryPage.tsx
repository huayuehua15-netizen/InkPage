import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../hooks/useLibrary';
import { useSettings } from '../hooks/useSettings';
import { BookCard } from '../components/BookCard';
import { ImportButton, useDropImport } from '../components/ImportButton';
import { SearchResults } from '../components/SearchModal';
import { IconSettings } from '../components/Icons';
import { searchLibrary } from '../utils/librarySearch';
import type { ImportedBook } from '../utils/fileImport';

export function LibraryPage() {
  const navigate = useNavigate();
  const { books, progressMap, loading, importBooks, removeBook } = useLibrary();
  useSettings(); // 确保主题应用到根节点
  const [keyword, setKeyword] = useState('');
  const [toast, setToast] = useState('');
  const toastTimer = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2400);
  }, []);

  const onImport = useCallback(
    async (imported: ImportedBook[]) => {
      await importBooks(imported);
      showToast(`成功导入 ${imported.length} 个文件`);
    },
    [importBooks, showToast]
  );

  const { dragging, onDragOver, onDragLeave, onDrop } = useDropImport(onImport, showToast);

  useEffect(() => {
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [onDragOver, onDragLeave, onDrop]);

  const searchResults = useMemo(
    () => (keyword.trim() ? searchLibrary(books, keyword) : null),
    [books, keyword]
  );

  const openBook = useCallback(
    (id: string) => navigate(`/read/${id}`),
    [navigate]
  );

  return (
    <div className="library-page">
      <header className="app-bar">
        <div className="app-bar__title" style={{ paddingLeft: 12 }}>
          InkPage 阅读器
        </div>
        <button
          className="icon-btn"
          aria-label="设置"
          onClick={() => navigate('/settings')}
        >
          <IconSettings />
        </button>
      </header>

      <div className="library-search">
        <input
          type="search"
          placeholder="搜索书名或全文内容…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      {searchResults ? (
        <SearchResults
          keyword={keyword}
          results={searchResults}
          onOpenBook={(book) => openBook(book.id)}
          onJump={(book, percent) =>
            navigate(
              `/read/${book.id}?p=${percent.toFixed(2)}&q=${encodeURIComponent(keyword.trim())}`
            )
          }
        />
      ) : loading ? (
        <div className="empty-state">
          <div>加载中…</div>
        </div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📖</div>
          <div>
            导入 TXT 或 Markdown 文件开始阅读
            <br />
            支持点击按钮选择，或直接把文件拖进页面
          </div>
          <div style={{ marginTop: 12 }}>
            <ImportButton onImport={onImport} onError={showToast} />
          </div>
        </div>
      ) : (
        <>
          <div className="book-grid">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                percent={progressMap[book.id] ?? 0}
                onOpen={openBook}
                onDelete={(id) => void removeBook(id)}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 16px 24px' }}>
            <ImportButton onImport={onImport} onError={showToast} />
          </div>
        </>
      )}

      {dragging && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)',
            color: '#fff',
            fontSize: 18,
            pointerEvents: 'none',
          }}
        >
          松开即可导入文件
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
