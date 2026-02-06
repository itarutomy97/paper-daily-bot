import { XMLParser } from 'fast-xml-parser';
import type { Paper } from '../types.js';

export interface ArxivFetcherOptions {
  maxResults?: number;
  daysBack?: number;
}

export class ArxivFetcher {
  private readonly query: string;
  private readonly options: ArxivFetcherOptions;
  private readonly parser: XMLParser;

  constructor(query: string, options: ArxivFetcherOptions = {}) {
    this.query = query;
    this.options = {
      maxResults: options.maxResults ?? 20,
      daysBack: options.daysBack ?? 1,
    };
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    });
  }

  async fetchPapers(): Promise<Paper[]> {
    try {
      const apiUrl = this.buildApiUrl();
      const response = await fetch(apiUrl);
      const text = await response.text();
      return this.parseResponse(text);
    } catch {
      // エラー時は空リストを返す
      return [];
    }
  }

  private buildApiUrl(): string {
    const baseUrl = 'http://export.arxiv.org/api/query';
    const params = new URLSearchParams({
      search_query: this.query,
      start: '0',
      max_results: String(this.options.maxResults),
      sortBy: 'submittedDate',
      sortOrder: 'descending',
    });
    return `${baseUrl}?${params.toString()}`;
  }

  private parseResponse(xmlText: string): Paper[] {
    const parsed = this.parser.parse(xmlText);
    const feed = parsed.feed;

    if (!feed || !feed.entry) {
      return [];
    }

    const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];
    return entries
      .filter((e: unknown): e is Record<string, unknown> => typeof e === 'object' && e !== null)
      .map((entry: Record<string, unknown>) => this.parseEntry(entry));
  }

  private parseEntry(entry: Record<string, unknown>): Paper {
    const title = this.ensureString(entry.title);
    const summary = this.ensureString(entry.summary);
    const published = new Date(this.ensureString(entry.published));
    const id = this.ensureString(entry.id);
    const arxivId = this.extractArxivId(id);

    // 著者
    const authors: string[] = [];
    const authorData = entry.author;
    const authorList = Array.isArray(authorData) ? authorData : [authorData];
    for (const author of authorList) {
      if (author && typeof author === 'object') {
        const name = author.name;
        if (typeof name === 'string') {
          authors.push(name);
        }
      }
    }

    // URL
    const pdfUrl = id.replace('/abs/', '/pdf/') + '.pdf';

    return {
      title: title.trim(),
      authors,
      summary: summary.replace(/\s+/g, ' ').trim(),
      published,
      url: id,
      pdfUrl,
      arxivId,
    };
  }

  private ensureString(value: unknown): string {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return '';
    return String(value);
  }

  private extractArxivId(url: string): string {
    const match = url.match(/(\d+\.\d+)/);
    return match ? match[1] : '';
  }
}
