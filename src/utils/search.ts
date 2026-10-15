export interface SearchHit {
  /** 命中位置（0-1 百分比，粗略按字符位置估算） */
  percent: number;
  excerpt: string;
}

/**
 * 在文本中全文搜索，返回所有命中（含上下文摘录）。
 * 不区分大小写；keyword 为空返回空数组。
 */
export function searchInContent(content: string, keyword: string, maxHits = 50): SearchHit[] {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return [];
  const lower = content.toLowerCase();
  const hits: SearchHit[] = [];
  let idx = lower.indexOf(kw);
  while (idx !== -1 && hits.length < maxHits) {
    const start = Math.max(0, idx - 20);
    const end = Math.min(content.length, idx + kw.length + 30);
    let excerpt = content.slice(start, end).replace(/\s+/g, ' ').trim();
    if (start > 0) excerpt = '…' + excerpt;
    if (end < content.length) excerpt += '…';
    hits.push({
      percent: (idx / content.length) * 100,
      excerpt,
    });
    idx = lower.indexOf(kw, idx + kw.length);
  }
  return hits;
}
