import {
  deleteBookmark,
  getBookmarks,
  type Bookmark,
} from '../db/library';
import { useEffect, useState } from 'react';

interface Props {
  bookId: string;
  refreshKey: number;
  onSelect: (bm: Bookmark) => void;
}

/** 当前书的书签列表（底部抽屉内使用） */
export function BookmarkList({ bookId, refreshKey, onSelect }: Props) {
  const [items, setItems] = useState<Bookmark[]>([]);

  useEffect(() => {
    void getBookmarks(bookId).then(setItems);
  }, [bookId, refreshKey]);

  if (items.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '32px 0' }}>
        <div className="empty-state__icon">📑</div>
        <div>还没有书签，阅读时点顶部的书签图标添加</div>
      </div>
    );
  }

  return (
    <div>
      {items.map((bm) => (
        <div key={bm.id} className="bookmark-item" onClick={() => onSelect(bm)}>
          <div className="bookmark-item__body">
            <div className="bookmark-item__percent">{Math.round(bm.percent)}%</div>
            <div className="bookmark-item__excerpt">{bm.excerpt || '（无摘录）'}</div>
          </div>
          <button
            className="bookmark-item__del"
            aria-label="删除书签"
            onClick={(e) => {
              e.stopPropagation();
              void deleteBookmark(bm.id).then(() =>
                setItems((list) => list.filter((x) => x.id !== bm.id))
              );
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
