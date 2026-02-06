import { describe, it, expect } from 'vitest';
import { filterByMinCitations } from './paper-filter.js';
import type { Paper } from '../types.js';

describe('PaperFilter', () => {
  describe('filterByMinCitations', () => {
    it('filters papers by minimum citation count', () => {
      // Arrange
      const papers: Paper[] = [
        { title: 'A', authors: [], summary: '', published: new Date(), url: '', pdfUrl: '', arxivId: '1', citationCount: 5 },
        { title: 'B', authors: [], summary: '', published: new Date(), url: '', pdfUrl: '', arxivId: '2', citationCount: 15 },
        { title: 'C', authors: [], summary: '', published: new Date(), url: '', pdfUrl: '', arxivId: '3', citationCount: 3 },
        { title: 'D', authors: [], summary: '', published: new Date(), url: '', pdfUrl: '', arxivId: '4', citationCount: 10 },
      ];

      // Act
      const result = filterByMinCitations(papers, 10);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map(p => p.title)).toEqual(['B', 'D']);
    });

    it('returns empty array for empty input', () => {
      // Arrange
      const papers: Paper[] = [];

      // Act
      const result = filterByMinCitations(papers, 5);

      // Assert
      expect(result).toEqual([]);
    });

    it('returns all papers when minCitations is 0', () => {
      // Arrange
      const papers: Paper[] = [
        { title: 'A', authors: [], summary: '', published: new Date(), url: '', pdfUrl: '', arxivId: '1', citationCount: 0 },
        { title: 'B', authors: [], summary: '', published: new Date(), url: '', pdfUrl: '', arxivId: '2', citationCount: 5 },
      ];

      // Act
      const result = filterByMinCitations(papers, 0);

      // Assert
      expect(result).toHaveLength(2);
    });

    it('handles papers without citationCount', () => {
      // Arrange
      const papers: Paper[] = [
        { title: 'A', authors: [], summary: '', published: new Date(), url: '', pdfUrl: '', arxivId: '1' },
        { title: 'B', authors: [], summary: '', published: new Date(), url: '', pdfUrl: '', arxivId: '2', citationCount: 5 },
      ];

      // Act
      const result = filterByMinCitations(papers, 3);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('B');
    });
  });
});
