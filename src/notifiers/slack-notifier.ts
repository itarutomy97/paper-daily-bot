import type { Paper } from '../types.js';
import type { Notifier } from './notifier.js';

export interface SlackMessageBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
}

export interface SlackPayload {
  blocks?: SlackMessageBlock[];
  text?: string;
}

export class SlackNotifier implements Notifier {
  private readonly webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async send(papers: Paper[]): Promise<boolean> {
    // 空配列の場合は送信しない
    if (papers.length === 0) {
      return true;
    }

    try {
      const payload = this.buildPayload(papers);
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  private buildPayload(papers: Paper[]): SlackPayload {
    const today = new Date().toLocaleDateString('ja-JP');
    const blocks: SlackMessageBlock[] = [];

    // ヘッダー
    blocks.push({
      type: 'header',
      text: {
        type: 'plain_text',
        text: ` ${today} の論文更新（${papers.length}件）`,
      },
    });

    // 論文リスト
    for (let i = 0; i < papers.length; i++) {
      const paper = papers[i];
      const citationInfo = paper.citationCount
        ? ` | 引用${paper.citationCount}回`
        : '';

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${i + 1}. ${paper.title}*\n_${paper.authors.slice(0, 3).join('、')}${paper.authors.length > 3 ? '他' : ''}_\n${this.truncate(paper.summary, 200)}${citationInfo}\n<${paper.url}|arXiv> | <${paper.pdfUrl}|PDF>`,
        },
      });
    }

    return { blocks };
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
  }
}
