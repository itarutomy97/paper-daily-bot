import 'dotenv/config';
import { PaperBot } from './paper-bot.js';
import { SlackNotifier } from './notifiers/slack-notifier.js';
import { EmailNotifier } from './notifiers/email-notifier.js';

async function main() {
  const notifyType = process.env.NOTIFY_TYPE ?? 'slack';

  // Notifierの作成
  let notifier;
  if (notifyType === 'email') {
    const resendKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    const to = process.env.EMAIL_TO;

    if (!resendKey || !from || !to) {
      console.error('EMAIL_FROM, EMAIL_TO, and RESEND_API_KEY are required for email notification');
      process.exit(1);
    }

    notifier = new EmailNotifier({
      apiKey: resendKey,
      from,
      to,
    });
    console.log(`Sending email to ${to}`);
  } else {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('SLACK_WEBHOOK_URL is required for slack notification');
      process.exit(1);
    }

    notifier = new SlackNotifier(webhookUrl);
    console.log('Sending to Slack');
  }

  const bot = new PaperBot({
    arxivQuery: process.env.ARXIV_QUERY ?? 'cat:cs.AI OR cat:cs.LG',
    maxPapers: Number(process.env.MAX_PAPERS ?? '20'),
    daysBack: Number(process.env.DAYS_BACK ?? '1'),
    minCitations: Number(process.env.MIN_CITATIONS ?? '0'),
    notifier,
    semanticScholarApiKey: process.env.SEMANTIC_SCHOLAR_API_KEY,
  });

  const success = await bot.run();
  process.exit(success ? 0 : 1);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
