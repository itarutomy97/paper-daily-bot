import { ArxivFetcher } from './fetchers/arxiv-fetcher.js';
import { SemanticScholarClient } from './fetchers/semantic-scholar-client.js';
import { SlackNotifier } from './notifiers/slack-notifier.js';
import type { Notifier } from './notifiers/notifier.js';
import { filterByMinCitations } from './filters/paper-filter.js';
import type { Paper } from './types.js';

export interface PaperBotOptions {
  arxivQuery: string;
  maxPapers?: number;
  daysBack?: number;
  minCitations?: number;
  // Notifierを直接指定（DI）
  notifier?: Notifier;
  // 互換性のため残すSlack Webhook URL
  slackWebhookUrl?: string;
  semanticScholarApiKey?: string;
}

export class PaperBot {
  private readonly options: Required<
    Omit<PaperBotOptions, 'notifier' | 'slackWebhookUrl' | 'semanticScholarApiKey'>
  > & {
    notifier: Notifier;
    semanticScholarApiKey?: string;
  };
  private readonly arxivFetcher: ArxivFetcher;
  private readonly semanticScholar: SemanticScholarClient;

  constructor(options: PaperBotOptions) {
    // Notifierの決定: DIされたもの or Webhook URLから作成
    const notifier =
      options.notifier ??
      (options.slackWebhookUrl
        ? new SlackNotifier(options.slackWebhookUrl)
        : (() => {
            throw new Error('Either notifier or slackWebhookUrl is required');
          })());

    this.options = {
      maxPapers: options.maxPapers ?? 20,
      daysBack: options.daysBack ?? 1,
      minCitations: options.minCitations ?? 0,
      arxivQuery: options.arxivQuery,
      notifier,
      semanticScholarApiKey: options.semanticScholarApiKey,
    };

    this.arxivFetcher = new ArxivFetcher(this.options.arxivQuery, {
      maxResults: this.options.maxPapers,
      daysBack: this.options.daysBack,
    });

    this.semanticScholar = new SemanticScholarClient({
      apiKey: this.options.semanticScholarApiKey,
    });
  }

  async run(): Promise<boolean> {
    // 1. arXivから論文取得
    const papers = await this.arxivFetcher.fetchPapers();
    if (papers.length === 0) {
      console.log('No papers found');
      return true;
    }

    // 2. Semantic Scholarで引用数付与
    for (const paper of papers) {
      const citationCount = await this.semanticScholar.getCitationCount(
        paper.arxivId
      );
      paper.citationCount = citationCount;
    }

    // 3. フィルタリング
    const filtered = filterByMinCitations(papers, this.options.minCitations);

    if (filtered.length === 0) {
      console.log('No papers after filtering');
      return true;
    }

    // 4. Notifierで送信
    const success = await this.options.notifier.send(filtered);
    return success;
  }
}
