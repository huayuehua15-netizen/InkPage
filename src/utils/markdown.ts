import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js/lib/common';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/** 转义 HTML，防止 txt/用户内容注入 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(text: string, used: Set<string>): string {
  let slug = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w一-龥-]/g, '');
  if (!slug) slug = 'section';
  let unique = slug;
  let i = 2;
  while (used.has(unique)) {
    unique = `${slug}-${i++}`;
  }
  used.add(unique);
  return unique;
}

/**
 * 渲染 Markdown 为 HTML，并返回目录。
 * 标题通过 anchor 插件注入 id，供目录跳转。
 */
export function renderMarkdown(content: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const usedIds = new Set<string>();

  const md = new MarkdownIt({
    html: false, // 安全：不解析原始 HTML
    linkify: true,
    typographer: true,
    highlight(str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="code-block"><code class="hljs language-${escapeHtml(lang)}">${
            hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
          }</code></pre>`;
        } catch {
          /* fallthrough */
        }
      }
      return `<pre class="code-block"><code class="hljs">${escapeHtml(str)}</code></pre>`;
    },
  });

  // 为标题注入 id，记录 TOC
  md.core.ruler.push('inkpage_anchor', (state) => {
    for (const token of state.tokens) {
      if (token.type === 'heading_open') {
        const inline = state.tokens[state.tokens.indexOf(token) + 1];
        const text = inline?.content ?? '';
        const id = slugify(text, usedIds);
        token.attrSet('id', id);
        toc.push({ id, text, level: Number(token.tag.slice(1)) });
      }
    }
  });

  // 任务列表：把列表项开头的 [ ] / [x] 渲染为 checkbox（markdown-it 原生不支持）
  md.core.ruler.push('inkpage_task_list', (state) => {
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== 'list_item_open') continue;
      // 找到该列表项内的首个 inline token（紧随其后的第一个）
      for (let j = i + 1; j < tokens.length && tokens[j].type !== 'list_item_close'; j++) {
        if (tokens[j].type !== 'inline') continue;
        const inline = tokens[j];
        const m = inline.content.match(/^\[([ xX])\]\s+/);
        if (m && inline.children && inline.children.length) {
          const checked = m[1] !== ' ';
          // 从首段纯文本节点中去掉 [ ] 标记
          const first = inline.children[0];
          if (first.type === 'text') {
            first.content = first.content.replace(/^\[([ xX])\]\s+/, '');
          }
          inline.content = inline.content.replace(/^\[([ xX])\]\s+/, '');
          // 在最前面插入 checkbox
          const box = new state.Token('html_inline', '', 0);
          box.content = `<input type="checkbox" disabled${checked ? ' checked' : ''}>`;
          inline.children.unshift(box);
          // 任务列表禁用默认圆点
          if (inline.children[0]) {
            // 尝试给 li 加 class（若 list_item_open 支持 attrSet）
            const li = tokens[i];
            const cls = li.attrGet('class');
            li.attrSet('class', cls ? `${cls} task-list-item` : 'task-list-item');
          }
        }
        break;
      }
    }
  });

  const html = md.render(content);
  return { html, toc };
}

/** txt 纯文本排版：空行分段，保留换行 */
export function renderText(content: string): string {
  const paragraphs = content.split(/\r?\n\s*\r?\n/);
  return paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      return `<p class="txt-paragraph">${escapeHtml(trimmed).replace(/\r?\n/g, '<br>')}</p>`;
    })
    .join('\n');
}

export function renderContent(type: 'txt' | 'md', content: string): { html: string; toc: TocItem[] } {
  if (type === 'md') return renderMarkdown(content);
  return { html: renderText(content), toc: [] };
}
