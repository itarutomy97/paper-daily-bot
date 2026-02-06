import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SemanticScholarClient } from './semantic-scholar-client.js';

describe('SemanticScholarClient', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('getCitationCount', () => {
    it('returns citation count for valid arXiv ID', async () => {
      // Arrange
      const client = new SemanticScholarClient();
      const mockResponse = {
        paperId: 'test-id',
        citationCount: 42,
      };
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act
      const count = await client.getCitationCount('2301.00001');

      // Assert
      expect(count).toBe(42);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('arXiv:2301.00001'),
        expect.any(Object)
      );
    });

    it('returns 0 for non-existent paper', async () => {
      // Arrange
      const client = new SemanticScholarClient();
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      // Act
      const count = await client.getCitationCount('9999.99999');

      // Assert
      expect(count).toBe(0);
    });

    it('returns 0 on API error', async () => {
      // Arrange
      const client = new SemanticScholarClient();
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      // Act
      const count = await client.getCitationCount('2301.00001');

      // Assert
      expect(count).toBe(0);
    });
  });
});
