import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp, type URLOpenListenerEvent } from '@capacitor/app';
import { addBook, getAllBooks, type Book } from '../db/library';
import { readNativeFile } from '../utils/fileImport';

/**
 * 原生（Android）文件打开处理：
 * 文件管理器中"用 InkPage 打开" txt/md 时，导入书籍并跳转阅读。
 * 同名书籍会更新内容后复用，避免重复导入。
 */
export function useNativeFileOpen(onError?: (msg: string) => void) {
  const navigate = useNavigate();
  const busyRef = useRef(false);
  // 用 ref 保存 onError，避免 effect 因调用方内联函数反复重注册监听器
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleUri = async (uri: string) => {
      if (!uri || busyRef.current) return;
      // 有扩展名时必须是支持的格式；无扩展名（如下载 provider 的 msf: URI）时
      // 由 intent-filter 的 mimeType 保证是文本，按 txt 尝试导入
      const decoded = decodeURIComponent(uri);
      const extMatch = decoded.match(/\.([a-z0-9]+)(?:\?|$)/i);
      if (extMatch && !/^(txt|md|markdown|mdown|mkd)$/i.test(extMatch[1])) return;
      busyRef.current = true;
      try {
        const imported = await readNativeFile(uri);
        const existing = (await getAllBooks()).find(
          (b) => b.fileName === imported.fileName
        );
        const id = existing?.id ?? crypto.randomUUID();
        const book: Book = {
          ...imported,
          id,
          // 复用同名书时保留上次阅读时间戳以便排序稳定
          lastReadAt: existing?.lastReadAt,
        };
        await addBook(book);
        navigate(`/read/${id}`);
      } catch (e) {
        onErrorRef.current?.(e instanceof Error ? e.message : '打开文件失败');
      } finally {
        busyRef.current = false;
      }
    };

    // 冷启动：通过文件打开方式启动应用
    void CapApp.getLaunchUrl().then((res) => {
      if (res?.url) void handleUri(res.url);
    });

    // 热启动：应用已在运行时打开新文件
    let handle: { remove: () => Promise<void> } | undefined;
    void CapApp.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      void handleUri(event.url);
    }).then((h) => {
      handle = h;
    });

    return () => {
      void handle?.remove();
    };
  }, [navigate]);
}
