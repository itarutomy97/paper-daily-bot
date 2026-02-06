import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailNotifier } from './email-notifier.js';
import type { Paper } from '../types.js';

// Resendをモック
const mockSend = vi.fn();
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

describe('EmailNotifier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('send', () => {
    it('sends email with papers via Resend', async () => {
      // Arrange
      mockSend.mockResolvedValueOnce({ data: { id: 'email_123' } });

      const notifier = new EmailNotifier({
        apiKey: 're_test_key',
        from: 'papers@example.com',
        to: 'user@example.com',
      });

      const papers: Paper[] = [
        {
          title: 'Test Paper',
          authors: ['Author 1'],
          summary: 'Test summary',
          published: new Date(),
          url: 'https://arxiv.org/abs/2401.00001',
          pdfUrl: 'https://arxiv.org/pdf/2401.00001.pdf',
          arxivId: '2401.00001',
          citationCount: 5,
        },
      ];

      // Act
      const result = await notifier.send(papers);

      // Assert
      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith({
        from: 'papers@example.com',
        to: 'user@example.com',
        subject: expect.stringContaining('論文'),
        html: expect.any(String),
      });
    });

    it('returns true when papers array is empty (no send)', async () => {
      // Arrange
      const notifier = new EmailNotifier({
        apiKey: 're_test_key',
        from: 'papers@example.com',
        to: 'user@example.com',
      });

      // Act
      const result = await notifier.send([]);

      // Assert
      expect(result).toBe(true);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('returns false on send error', async () => {
      // Arrange
      mockSend.mockRejectedValueOnce(new Error('API error'));

      const notifier = new EmailNotifier({
        apiKey: 're_test_key',
        from: 'papers@example.com',
        to: 'user@example.com',
      });

      const papers: Paper[] = [
        {
          title: 'Test',
          authors: [],
          summary: '',
          published: new Date(),
          url: '',
          pdfUrl: '',
          arxivId: '1',
        },
      ];

      // Act
      const result = await notifier.send(papers);

      // Assert
      expect(result).toBe(false);
    });
  });
});
