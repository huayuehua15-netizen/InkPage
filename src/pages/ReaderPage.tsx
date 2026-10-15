import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getBook, addBookmark, touchBook, type Book } from '../db/library';
import { renderContent, type TocItem } from '../utils/markdown';
import { useSettings } from '../hooks/useSettings';
import { useReadingProgress } from '../hooks/useReadingProgress';
import { ReaderToolbar } from '../components/ReaderToolbar';
import { TocDrawer } from '../components/TocDrawer';
import { BookmarkList } from '../components/BookmarkList';
import { ReadingSettings } from '../components/SettingsPanel';

type Drawer = 'none' | 'toc' | 'settings' | 'bookmark';

export function ReaderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings, update } = useSettings();
  const [book, setBook] = useState<Book | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [drawer, setDrawer] = useState<Drawer>('none');
  const [immersive, setImmersive] = useState(false);
  const [toast, setToast] = useState('');
  const [bmRefresh, setBmRefresh] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const restored = useRef(false);
  const toastTimer = useRef<number | null>(null);

  const { percent, setPercent, initialPercent, onScroll, flush } = useReadingProgress(
    id ?? '',
    book !== null
  );

  useEffect(() => {
    if (!id) return;
    void getBook(id).then((b) => {
      if (b) {
        setBook(b);
        void touchBook(b.id);
      } else {
        setNotFound(true);
      }
    });
  }, [id]);

  const rendered = useMemo(
    () => (book ? renderContent(book.type, book.content) : null),
    [book]
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 1800);
  }, []);

  /* 恢复进度：搜索跳转（q 关键词优先，p 百分比兜底）或恢复上次进度 */
  useEffect(() => {
    if (!rendered || restored.current) return;
    const pParam = searchParams.get('p');
    const qParam = searchParams.get('q');
    const target = pParam !== null ? Number(pParam) : initialPercent;
    if (target === null && qParam === null) return;
    const pct = Math.min(100, Math.max(0, target ?? 0));
    // 等待布局完成；图片加载可能改变高度，最多重试 20 次
    let attempts = 0;
    let timer: number | undefined;
    const apply = () => {
      // 搜索跳转：精确定位第一个包含关键词的块级元素
      if (qParam) {
        const kw = qParam.toLowerCase();
        const els = contentRef.current?.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, blockquote, td');
        if (els) {
          for (const el of Array.from(els)) {
            if ((el.textContent ?? '').toLowerCase().includes(kw)) {
              el.scrollIntoView({ block: 'start' });
              window.scrollBy(0, -80); // 让目标落到工具栏下方
              const max = document.documentElement.scrollHeight - window.innerHeight;
              const p = max > 0 ? (window.scrollY / max) * 100 : 0;
              setPercent(p);
              restored.current = true;
              setSearchParams({}, { replace: true });
              return;
            }
          }
        }
        // 关键词未找到则按百分比兜底
      }
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0) {
        window.scrollTo(0, (pct / 100) * max);
        setPercent(pct);
        restored.current = true;
        if (pParam !== null || qParam !== null) setSearchParams({}, { replace: true });
        return;
      }
      if (++attempts < 20) timer = window.setTimeout(apply, 100);
    };
    const raf = requestAnimationFrame(() => requestAnimationFrame(apply));
    return () => {
      cancelAnimationFrame(raf);
      if (timer) window.clearTimeout(timer);
    };
  }, [rendered, initialPercent, searchParams, setSearchParams, setPercent]);

  /* 滚动保存进度 */
  const percentRef = useRef(percent);
  percentRef.current = percent;
  useEffect(() => {
    const handler = () => onScroll(document.documentElement);
    window.addEventListener('scroll', handler, { passive: true });
    return () => {
      window.removeEventListener('scroll', handler);
      flush(percentRef.current);
    };
  }, [onScroll, flush]);

  const jumpToPercent = useCallback(
    (p: number) => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: (p / 100) * max, behavior: 'smooth' });
      setPercent(p);
      setDrawer('none');
    },
    [setPercent]
  );

  const jumpToHeading = useCallback((headingId: string) => {
    document.getElementById(headingId)?.scrollIntoView({ behavior: 'smooth' });
    setDrawer('none');
  }, []);

  const handleBookmark = useCallback(() => {
    if (!id) return;
    // 摘录：取视口内第一段可见文字
    let excerpt = '';
    const els = contentRef.current?.querySelectorAll('p, li, h1, h2, h3, blockquote');
    if (els) {
      for (const el of Array.from(els)) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom > 80 && rect.top < window.innerHeight * 0.5) {
          excerpt = (el.textContent ?? '').trim().slice(0, 60);
          break;
        }
      }
    }
    void addBookmark(id, percent, excerpt).then(() => {
      setBmRefresh((k) => k + 1);
      showToast(`已添加书签（${Math.round(percent)}%）`);
    });
  }, [id, percent, showToast]);

  /* 点击正文中央切换沉浸模式（链接/按钮除外） */
  const handleContentClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a, button, input, pre, table')) return;
    setImmersive((v) => !v);
  }, []);

  if (notFound) {
    return (
      <div className="empty-state" style={{ minHeight: '100dvh' }}>
        <div className="empty-state__icon">😕</div>
        <div>书籍不存在或已被删除</div>
        <button className="primary-btn" onClick={() => navigate('/')}>
          返回书库
        </button>
      </div>
    );
  }

  if (!book || !rendered) {
    return (
      <div className="empty-state" style={{ minHeight: '100dvh' }}>
        <div>加载中…</div>
      </div>
    );
  }

  return (
    <div className="reader-page">
      <div className="reader-progressbar" style={{ width: `${percent}%` }} />

      <ReaderToolbar
        title={book.title}
        hidden={immersive}
        onBack={() => navigate('/')}
        onToc={() => setDrawer('toc')}
        onBookmark={() => setDrawer('bookmark')}
        onSettings={() => setDrawer('settings')}
        showToc={rendered.toc.length > 0}
      />

      <main
        ref={contentRef}
        className={`reader-content reader-body ${settings.indentFirstLine ? 'indent' : ''}`}
        onClick={handleContentClick}
        dangerouslySetInnerHTML={{ __html: rendered.html }}
      />

      <div className={`reader-bottombar ${immersive ? 'hidden' : ''}`}>
        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={percent}
          onChange={(e) => {
            const p = Number(e.target.value);
            setPercent(p);
            const max = document.documentElement.scrollHeight - window.innerHeight;
            window.scrollTo(0, (p / 100) * max);
          }}
        />
        <div className="reader-bottombar__row">
          <span>{Math.round(percent)}%</span>
          <span>{book.type === 'md' ? 'Markdown' : 'TXT'}</span>
          <span>点击正文切换沉浸模式</span>
        </div>
      </div>

      {drawer === 'toc' && (
        <TocDrawer
          toc={rendered.toc as TocItem[]}
          onSelect={jumpToHeading}
          onClose={() => setDrawer('none')}
        />
      )}

      {drawer === 'bookmark' && (
        <>
          <div className="drawer-mask" onClick={() => setDrawer('none')} />
          <div className="drawer">
            <div className="drawer__handle" />
            <div className="drawer__title">书签</div>
            <BookmarkList
              bookId={book.id}
              refreshKey={bmRefresh}
              onSelect={(bm) => jumpToPercent(bm.percent)}
            />
            <button
              className="primary-btn"
              style={{ width: '100%', marginTop: 16 }}
              onClick={handleBookmark}
            >
              在当前位置添加书签
            </button>
          </div>
        </>
      )}

      {drawer === 'settings' && (
        <>
          <div className="drawer-mask" onClick={() => setDrawer('none')} />
          <div className="drawer">
            <div className="drawer__handle" />
            <div className="drawer__title">阅读设置</div>
            <ReadingSettings settings={settings} update={update} />
          </div>
        </>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
