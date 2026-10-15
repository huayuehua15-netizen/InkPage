import type { FontFamily, Settings, ThemeName } from '../db/library';

interface Props {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

const THEMES: { key: ThemeName; label: string }[] = [
  { key: 'day', label: '日间' },
  { key: 'night', label: '夜间' },
  { key: 'sepia', label: '护眼' },
  { key: 'paper', label: '羊皮纸' },
];

const FONTS: { key: FontFamily; label: string }[] = [
  { key: 'serif', label: '衬线' },
  { key: 'sans', label: '无衬线' },
  { key: 'mono', label: '等宽' },
];

/** 阅读排版设置项（阅读页抽屉与设置页共用） */
export function ReadingSettings({ settings, update }: Props) {
  return (
    <div>
      <div className="setting-row">
        <span className="setting-row__label">主题</span>
        <div className="segmented">
          {THEMES.map((t) => (
            <button
              key={t.key}
              className={settings.theme === t.key ? 'active' : ''}
              onClick={() => update({ theme: t.key })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="setting-row">
        <span className="setting-row__label">字号 {settings.fontSize}px</span>
        <input
          type="range"
          min={14}
          max={24}
          step={1}
          value={settings.fontSize}
          onChange={(e) => update({ fontSize: Number(e.target.value) })}
        />
      </div>

      <div className="setting-row">
        <span className="setting-row__label">行距 {settings.lineHeight.toFixed(1)}</span>
        <input
          type="range"
          min={1.4}
          max={2.4}
          step={0.1}
          value={settings.lineHeight}
          onChange={(e) => update({ lineHeight: Number(e.target.value) })}
        />
      </div>

      <div className="setting-row">
        <span className="setting-row__label">字体</span>
        <div className="segmented">
          {FONTS.map((f) => (
            <button
              key={f.key}
              className={settings.fontFamily === f.key ? 'active' : ''}
              onClick={() => update({ fontFamily: f.key })}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="setting-row">
        <span className="setting-row__label">页边距 {settings.pagePadding}px</span>
        <input
          type="range"
          min={8}
          max={40}
          step={2}
          value={settings.pagePadding}
          onChange={(e) => update({ pagePadding: Number(e.target.value) })}
        />
      </div>

      <div className="setting-row">
        <span className="setting-row__label">首行缩进（TXT）</span>
        <button
          className={`switch ${settings.indentFirstLine ? 'on' : ''}`}
          aria-label="首行缩进"
          onClick={() => update({ indentFirstLine: !settings.indentFirstLine })}
        />
      </div>
    </div>
  );
}

export function ThemePreviews({
  settings,
  update,
}: Props) {
  return (
    <div className="theme-preview">
      {THEMES.map((t) => (
        <button
          key={t.key}
          className={settings.theme === t.key ? 'active' : ''}
          onClick={() => update({ theme: t.key })}
        >
          <span className={`theme-preview__dot ${t.key}`} />
          {t.label}
        </button>
      ))}
    </div>
  );
}
