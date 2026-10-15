import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App';

import './styles/themes.css';
import './styles/global.css';
import './styles/reader.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 注册 Service Worker（仅 Web/PWA 部署启用；原生 APP 内不注册，避免缓存旧资源）
if ('serviceWorker' in navigator && import.meta.env.PROD && !Capacitor.isNativePlatform()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* 离线缓存失败不影响使用 */
    });
  });
}
