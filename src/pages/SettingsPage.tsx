import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import { clearAllData } from '../db/library';
import { ReadingSettings, ThemePreviews } from '../components/SettingsPanel';
import { IconBack } from '../components/Icons';

export function SettingsPage() {
  const navigate = useNavigate();
  const { settings, update } = useSettings();
  const [toast, setToast] = useState('');

  const handleClear = async () => {
    if (!window.confirm('确定清除全部数据？所有书籍、阅读进度与书签将被删除，且不可恢复。')) {
      return;
    }
    await clearAllData();
    setToast('已清除全部数据');
    window.setTimeout(() => navigate('/'), 900);
  };

  return (
    <div className="settings-page">
      <header className="app-bar">
        <button className="icon-btn" aria-label="返回" onClick={() => navigate('/')}>
          <IconBack />
        </button>
        <div className="app-bar__title">设置</div>
      </header>

      <div className="settings-section">
        <ThemePreviews settings={settings} update={update} />
      </div>

      <div className="settings-section__title">阅读排版</div>
      <div className="settings-section">
        <ReadingSettings settings={settings} update={update} />
      </div>

      <div className="settings-section__title">数据</div>
      <div className="settings-section">
        <div className="setting-row">
          <span className="setting-row__label">清除全部数据</span>
          <button className="danger-btn" style={{ padding: '8px 18px' }} onClick={() => void handleClear()}>
            清除
          </button>
        </div>
      </div>

      <div className="settings-section__title">关于</div>
      <div className="settings-section">
        <div className="about-text">
          <strong>InkPage 阅读器</strong> v1.0.0
          <br />
          一款开源、免登录的本地 TXT / Markdown 阅读器。
          <br />
          所有书籍与阅读数据仅保存在你的设备（浏览器 IndexedDB）中，不上传任何服务器。
          <br />
          项目地址：GitHub 开源仓库（MIT 协议）
          <br />
          Markdown 图片仅支持网络链接图片；本地相对路径图片暂不支持。
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
