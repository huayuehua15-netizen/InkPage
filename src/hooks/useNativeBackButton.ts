import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * 原生（Android）返回键处理：
 * - 阅读页/设置页 → 返回上一页
 * - 书库首页（根路径）→ 退出应用（默认行为）
 */
export function useNativeBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let handle: { remove: () => Promise<void> } | undefined;
    void CapApp.addListener('backButton', ({ canGoBack }) => {
      if (location.pathname !== '/') {
        navigate(-1);
      } else if (canGoBack) {
        navigate(-1);
      } else {
        void CapApp.exitApp();
      }
    }).then((h) => {
      handle = h;
    });
    return () => {
      void handle?.remove();
    };
  }, [navigate, location.pathname]);
}
