import { IconBack, IconBookmark, IconList, IconSettings } from './Icons';

interface Props {
  title: string;
  hidden: boolean;
  onBack: () => void;
  onToc: () => void;
  onBookmark: () => void;
  onSettings: () => void;
  showToc: boolean;
}

/** 阅读页顶部工具栏（沉浸模式可隐藏） */
export function ReaderToolbar({
  title,
  hidden,
  onBack,
  onToc,
  onBookmark,
  onSettings,
  showToc,
}: Props) {
  return (
    <header className={`reader-toolbar ${hidden ? 'hidden' : ''}`}>
      <button className="icon-btn" aria-label="返回" onClick={onBack}>
        <IconBack />
      </button>
      <div className="reader-toolbar__title">{title}</div>
      {showToc && (
        <button className="icon-btn" aria-label="目录" onClick={onToc}>
          <IconList />
        </button>
      )}
      <button className="icon-btn" aria-label="书签" onClick={onBookmark}>
        <IconBookmark />
      </button>
      <button className="icon-btn" aria-label="阅读设置" onClick={onSettings}>
        <IconSettings />
      </button>
    </header>
  );
}
