/**
 * 論文データ型
 */
export interface Paper {
  /** 論文タイトル */
  title: string;
  /** 著者リスト */
  authors: string[];
  /** 要約（アブストラクト） */
  summary: string;
  /** 公開日 */
  published: Date;
  /** arXiv URL */
  url: string;
  /** PDF URL */
  pdfUrl: string;
  /** arXiv ID */
  arxivId: string;
  /** 引用数 */
  citationCount?: number;
  /** AI生成要約 */
  aiSummary?: string;
}

/**
 * arXiv APIレスポンス型
 */
export interface ArxivResponse {
  id: string;
  title: string;
  summary: string;
  published: string;
  authors: Array<{ name: string }>;
  pdf_url?: string;
}

/**
 * Semantic Scholar APIレスポンス型
 */
export interface SemanticScholarResponse {
  paperId: string;
  title: string;
  citationCount: number;
  influence?: number;
  year?: number;
}
