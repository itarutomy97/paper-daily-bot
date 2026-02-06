import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SlackNotifier } from './slack-notifier.js';
import type { Paper } from '../types.js';

describe('SlackNotifier', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('send', () => {
    it('sends papers to Slack webhook', async () => {
      // Arrange
      const notifier = new SlackNotifier('https://hooks.slack.com/test');
      const papers: Paper[] = [
        {
          title: 'Test Paper',
          authors: ['Author 1', 'Author 2'],
          summary: 'This is a test summary.',
          published: new Date('2024-01-01'),
          url: 'https://arxiv.org/abs/2401.00001',
          pdfUrl: 'https://arxiv.org/pdf/2401.00001.pdf',
          arxivId: '2401.00001',
          citationCount: 5,
        },
      ];
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
      } as Response);

      // Act
      const result = await notifier.send(papers);

      // Assert
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('does not send when papers array is empty', async () => {
      // Arrange
      const notifier = new SlackNotifier('https://hooks.slack.com/test');
      const papers: Paper[] = [];

      // Act
      const result = await notifier.send(papers);

      // Assert
      expect(result).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns false on webhook error', async () => {
      // Arrange
      const notifier = new SlackNotifier('https://hooks.slack.com/test');
      const papers: Paper[] = [
        {
          title: 'Test Paper',
          authors: ['Author 1'],
          summary: 'Summary',
          published: new Date(),
          url: 'https://arxiv.org/abs/2401.00001',
          pdfUrl: 'https://arxiv.org/pdf/2401.00001.pdf',
          arxivId: '2401.00001',
        },
      ];
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      // Act
      const result = await notifier.send(papers);

      // Assert
      expect(result).toBe(false);
    });
  });
});
