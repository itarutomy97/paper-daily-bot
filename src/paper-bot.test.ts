import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PaperBot } from './paper-bot.js';
import { SlackNotifier } from './notifiers/slack-notifier.js';
import type { Notifier } from './notifiers/notifier.js';
import type { Paper } from './types.js';

describe('PaperBot', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('with custom Notifier', () => {
    it('uses injected notifier to send papers', async () => {
      // Arrange
      const arxivXml = `
        <feed xmlns="http://www.w3.org/2005/Atom">
          <entry>
            <title>Test Paper</title>
            <author><name>Author</name></author>
            <summary>Summary</summary>
            <published>2024-01-01T00:00:00Z</published>
            <id>https://arxiv.org/abs/2401.00001</id>
          </entry>
        </feed>
      `;

      // Mock notifier
      const mockNotifier: Notifier = {
        send: vi.fn().mockResolvedValueOnce(true),
      };

      let callCount = 0;
      vi.mocked(global.fetch).mockImplementation(async (url) => {
        callCount++;
        if (typeof url === 'string' && url.includes('arxiv.org')) {
          return { ok: true, text: async () => arxivXml } as Response;
        }
        // Semantic Scholar
        return { ok: true, json: async () => ({ citationCount: 5 }) } as Response;
      });

      const bot = new PaperBot({
        arxivQuery: 'cat:cs.AI',
        maxPapers: 10,
        minCitations: 0,
        notifier: mockNotifier,
      });

      // Act
      const result = await bot.run();

      // Assert
      expect(result).toBe(true);
      expect(mockNotifier.send).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Test Paper',
            citationCount: 5,
          }),
        ])
      );
    });
  });

  describe('run', () => {
    it('fetches papers, enriches with citations, filters, and sends to Slack', async () => {
      // Arrange - arXiv API mock
      const arxivXml = `
        <feed xmlns="http://www.w3.org/2005/Atom">
          <entry>
            <title>Test Paper 1</title>
            <author><name>Author 1</name></author>
            <summary>Summary 1</summary>
            <published>2024-01-01T00:00:00Z</published>
            <id>https://arxiv.org/abs/2401.00001</id>
          </entry>
          <entry>
            <title>Test Paper 2</title>
            <author><name>Author 2</name></author>
            <summary>Summary 2</summary>
            <published>2024-01-02T00:00:00Z</published>
            <id>https://arxiv.org/abs/2401.00002</id>
          </entry>
        </feed>
      `;

      // Semantic Scholar API mock
      const ssResponse1 = { citationCount: 15 };
      const ssResponse2 = { citationCount: 3 };

      let callCount = 0;
      vi.mocked(global.fetch).mockImplementation(async (url) => {
        callCount++;
        if (typeof url === 'string' && url.includes('arxiv.org')) {
          return { ok: true, text: async () => arxivXml } as Response;
        }
        if (typeof url === 'string' && url.includes('semanticscholar.org')) {
          if (url.includes('2401.00001')) {
            return { ok: true, json: async () => ssResponse1 } as Response;
          }
          return { ok: true, json: async () => ssResponse2 } as Response;
        }
        // Slack webhook
        return { ok: true } as Response;
      });

      // Act
      const bot = new PaperBot({
        arxivQuery: 'cat:cs.AI',
        maxPapers: 10,
        minCitations: 10,
        slackWebhookUrl: 'https://hooks.slack.com/test',
      });

      const result = await bot.run();

      // Assert
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('handles empty paper list gracefully', async () => {
      // Arrange
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        text: async () => '<feed xmlns="http://www.w3.org/2005/Atom"></feed>',
      } as Response);

      const bot = new PaperBot({
        arxivQuery: 'cat:cs.AI',
        maxPapers: 10,
        minCitations: 0,
        slackWebhookUrl: 'https://hooks.slack.com/test',
      });

      // Act
      const result = await bot.run();

      // Assert
      expect(result).toBe(true); // 空でも成功として扱う
    });

    it('returns false when Slack send fails', async () => {
      // Arrange
      const arxivXml = `
        <feed xmlns="http://www.w3.org/2005/Atom">
          <entry>
            <title>Test Paper</title>
            <author><name>Author</name></author>
            <summary>Summary</summary>
            <published>2024-01-01T00:00:00Z</published>
            <id>https://arxiv.org/abs/2401.00001</id>
          </entry>
        </feed>
      `;

      let callCount = 0;
      vi.mocked(global.fetch).mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          // arXiv
          return { ok: true, text: async () => arxivXml } as Response;
        }
        if (callCount === 2) {
          // Semantic Scholar
          return { ok: true, json: async () => ({ citationCount: 5 }) } as Response;
        }
        // Slack webhook - fail
        throw new Error('Network error');
      });

      const bot = new PaperBot({
        arxivQuery: 'cat:cs.AI',
        maxPapers: 10,
        minCitations: 0,
        slackWebhookUrl: 'https://hooks.slack.com/test',
      });

      // Act
      const result = await bot.run();

      // Assert
      expect(result).toBe(false);
    });
  });
});
