import { Resend } from 'resend';
import type { Paper } from '../types.js';
import type { Notifier } from './notifier.js';

export interface EmailNotifierOptions {
  apiKey: string;
  from: string;
  to: string;
}

export class EmailNotifier implements Notifier {
  private readonly resend: Resend;
  private readonly options: EmailNotifierOptions;

  constructor(options: EmailNotifierOptions) {
    this.resend = new Resend(options.apiKey);
    this.options = options;
  }

  async send(papers: Paper[]): Promise<boolean> {
    if (papers.length === 0) {
      return true;
    }

    try {
      const html = this.buildHtml(papers);
      const result = await this.resend.emails.send({
        from: this.options.from,
        to: this.options.to,
        subject: `${new Date().toLocaleDateString('ja-JP')} の論文更新（${papers.length}件）`,
        html,
      });

      return !!result.data;
    } catch {
      return false;
    }
  }

  private buildHtml(papers: Paper[]): string {
    const today = new Date().toLocaleDateString('ja-JP');

    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .paper { margin-bottom: 24px; padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; }
    .title { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
    .authors { color: #666; font-size: 14px; margin-bottom: 8px; }
    .summary { font-size: 14px; line-height: 1.6; margin-bottom: 8px; }
    .links { font-size: 14px; }
    .links a { color: #0066cc; text-decoration: none; margin-right: 16px; }
    .citation { color: #0066cc; font-weight: bold; }
  </style>
</head>
<body>
  <h2>${today} の論文更新（${papers.length}件）</h2>
`;

    for (let i = 0; i < papers.length; i++) {
      const p = papers[i];
      const citationInfo = p.citationCount
        ? ` <span class="citation">引用${p.citationCount}回</span>`
        : '';
      const authors = p.authors.slice(0, 3).join('、') + (p.authors.length > 3 ? ' 他' : '');
      const summary = p.summary.length > 200
        ? p.summary.slice(0, 197) + '...'
        : p.summary;

      html += `
  <div class="paper">
    <div class="title">${i + 1}. ${this.escapeHtml(p.title)}</div>
    <div class="authors">${this.escapeHtml(authors)}</div>
    <div class="summary">${this.escapeHtml(summary)}${citationInfo}</div>
    <div class="links">
      <a href="${p.url}">arXiv</a>
      <a href="${p.pdfUrl}">PDF</a>
    </div>
  </div>`;
    }

    html += `
</body>
</html>`;

    return html;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
