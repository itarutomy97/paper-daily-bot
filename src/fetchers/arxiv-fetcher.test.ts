import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ArxivFetcher } from './arxiv-fetcher.js';
import type { Paper } from '../types.js';

describe('ArxivFetcher', () => {
  describe('fetchPapers', () => {
    it('returns papers for a given query', async () => {
      // Arrange
      const fetcher = new ArxivFetcher('cat:cs.AI', { maxResults: 5 });

      // Act
      const papers = await fetcher.fetchPapers();

      // Assert
      expect(papers).toBeDefined();
      expect(Array.isArray(papers)).toBe(true);
      expect(papers.length).toBeGreaterThan(0);
      expect(papers[0]).toMatchObject({
        title: expect.any(String),
        authors: expect.any(Array),
        summary: expect.any(String),
        published: expect.any(Date),
        url: expect.stringContaining('arxiv.org'),
        pdfUrl: expect.stringContaining('arxiv.org'),
        arxivId: expect.any(String),
      });
    });

    it('returns empty array when no papers match query', async () => {
      // Arrange
      const fetcher = new ArxivFetcher('cat:cs.NonExistentCategory123', { maxResults: 5 });

      // Act
      const papers = await fetcher.fetchPapers();

      // Assert
      expect(papers).toEqual([]);
    });

    it('returns empty array on API error', async () => {
      // Arrange
      const fetcher = new ArxivFetcher('cat:cs.AI', { maxResults: 5 });
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      // Act
      const papers = await fetcher.fetchPapers();

      // Assert
      expect(papers).toEqual([]);
    });
  });
});
