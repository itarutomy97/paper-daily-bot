export interface SemanticScholarOptions {
  apiKey?: string;
}

interface SemanticScholarResponse {
  citationCount?: number;
}

export class SemanticScholarClient {
  private readonly baseUrl = 'https://api.semanticscholar.org/graph/v1';
  private readonly options: SemanticScholarOptions;

  constructor(options: SemanticScholarOptions = {}) {
    this.options = options;
  }

  async getCitationCount(arxivId: string): Promise<number> {
    try {
      const url = `${this.baseUrl}/paper/arXiv:${arxivId}?fields=citationCount`;
      const headers: Record<string, string> = {};
      if (this.options.apiKey) {
        headers['x-api-key'] = this.options.apiKey;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        return 0;
      }

      const data = (await response.json()) as SemanticScholarResponse;
      return data.citationCount ?? 0;
    } catch {
      return 0;
    }
  }
}
