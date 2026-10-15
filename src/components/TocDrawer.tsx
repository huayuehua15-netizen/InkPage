import type { TocItem } from '../utils/markdown';

interface Props {
  toc: TocItem[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

/** 目录侧边抽屉（md 标题树） */
export function TocDrawer({ toc, onSelect, onClose }: Props) {
  return (
    <>
      <div className="drawer-mask" onClick={onClose} />
      <nav className="side-drawer">
        <div className="drawer__title">目录</div>
        {toc.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 0' }}>
            <div>本文档没有可识别的标题目录</div>
          </div>
        ) : (
          <ul className="toc-list">
            {toc.map((item) => (
              <li
                key={item.id}
                className={`lvl-${item.level}`}
                onClick={() => onSelect(item.id)}
              >
                {item.text || '（无标题）'}
              </li>
            ))}
          </ul>
        )}
      </nav>
    </>
  );
}
