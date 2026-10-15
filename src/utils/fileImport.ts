import type { BookType } from '../db/library';

const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.markdown', '.mdown', '.mkd'];

function getBookType(fileName: string): BookType | null {
  const lower = fileName.toLowerCase();
  const ext = lower.slice(lower.lastIndexOf('.'));
  if (!SUPPORTED_EXTENSIONS.includes(ext)) return null;
  return ext === '.txt' ? 'txt' : 'md';
}

/** 简单 hash 生成封面色相 */
function hashHue(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) % 360;
  }
  return h;
}

/** base64 → ArrayBuffer */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * 解码文本：
 * 1. 先按 UTF-8 严格解码（带 BOM 自动剥离）
 * 2. 若出现替换字符（乱码特征），回退 GBK 解码（中文 txt 常见编码）
 */
function decodeText(buffer: ArrayBuffer): string {
  try {
    const utf8 = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return utf8.replace(/^\uFEFF/, '');
  } catch {
    try {
      return new TextDecoder('gbk').decode(buffer);
    } catch {
      return new TextDecoder('utf-8').decode(buffer).replace(/^\uFEFF/, '');
    }
  }
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '');
}

export interface ImportedBook {
  title: string;
  fileName: string;
  type: BookType;
  content: string;
  size: number;
  importedAt: number;
  coverHue: number;
}

/** 由文件名 + 内容构建导入书籍对象 */
function buildImported(fileName: string, content: string, size: number): ImportedBook {
  return {
    title: stripExtension(fileName) || '未命名',
    fileName,
    type: getBookType(fileName) ?? 'txt',
    content,
    size,
    importedAt: Date.now(),
    coverHue: hashHue(fileName + size),
  };
}

export async function readBookFile(file: File): Promise<ImportedBook> {
  const type = getBookType(file.name);
  if (!type) {
    throw new Error(`不支持的文件格式：${file.name}（仅支持 .txt / .md / .markdown）`);
  }
  const buffer = await file.arrayBuffer();
  const content = decodeText(buffer);
  if (!content.trim()) {
    throw new Error(`文件内容为空：${file.name}`);
  }
  return buildImported(file.name, content, file.size);
}

export async function readBookFiles(files: FileList | File[]): Promise<ImportedBook[]> {
  const results: ImportedBook[] = [];
  const errors: string[] = [];
  for (const file of Array.from(files)) {
    try {
      results.push(await readBookFile(file));
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  if (results.length === 0 && errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
  return results;
}

/**
 * 从原生（Android）分享/打开的文件 URI 导入书籍。
 * 二进制读取后自行解码，保证 GBK 中文 txt 不乱码。
 */
export async function readNativeFile(uri: string, fileName?: string): Promise<ImportedBook> {
  const { Filesystem } = await import('@capacitor/filesystem');
  const name =
    fileName ||
    decodeURIComponent(uri.split('/').pop() || '') ||
    `未命名-${Date.now()}`;
  const type = getBookType(name);
  if (!type) {
    throw new Error(`不支持的文件格式：${name}（仅支持 .txt / .md / .markdown）`);
  }
  const result = await Filesystem.readFile({ path: uri });
  const raw = result.data;
  let buffer: ArrayBuffer;
  if (typeof raw === 'string') {
    buffer = base64ToBuffer(raw);
  } else {
    // Blob / ArrayBuffer 等 Web 返回形态
    buffer = raw instanceof Blob ? await raw.arrayBuffer() : (raw as ArrayBuffer);
  }
  const content = decodeText(buffer);
  if (!content.trim()) {
    throw new Error(`文件内容为空：${name}`);
  }
  return buildImported(name, content, buffer.byteLength);
}
