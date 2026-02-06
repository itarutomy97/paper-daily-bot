import type { Paper } from '../types.js';

export function filterByMinCitations(papers: Paper[], minCitations: number): Paper[] {
  return papers.filter(p => (p.citationCount ?? 0) >= minCitations);
}
