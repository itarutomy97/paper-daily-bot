import 'dotenv/config';
import { ArxivFetcher } from './src/fetchers/arxiv-fetcher.js';
import { SemanticScholarClient } from './src/fetchers/semantic-scholar-client.js';
import { filterByMinCitations } from './src/filters/paper-filter.js';
import type { Paper } from './src/types.js';

function buildSlackMessage(papers: Paper[]): string {
  const today = new Date().toLocaleDateString('ja-JP');
  let msg = `\n${today} の論文更新（${papers.length}件）\n\n`;

  for (let i = 0; i < papers.length; i++) {
    const p = papers[i];
    const citationInfo = p.citationCount ? ` | 引用${p.citationCount}回` : '';
    const authors = p.authors.slice(0, 3).join('、') + (p.authors.length > 3 ? '他' : '');
    const summary = p.summary.length > 150 ? p.summary.slice(0, 147) + '...' : p.summary;

    msg += `${i + 1}. *${p.title}*\n`;
    msg += `   _${authors}_\n`;
    msg += `   ${summary}${citationInfo}\n`;
    msg += `   <${p.url}|arXiv> | <${p.pdfUrl}|PDF>\n\n`;
  }

  return msg;
}

async function testSlackOutput() {
  console.log('=== Paper Bot - Slack Output Test ===\n');

  // 1. 論文取得
  const arxiv = new ArxivFetcher('cat:cs.AI OR cat:cs.LG', { maxResults: 5 });
  const papers = await arxiv.fetchPapers();

  if (papers.length === 0) {
    console.log('No papers found');
    return;
  }

  // 2. 引用数付与
  const semantic = new SemanticScholarClient();
  for (const p of papers) {
    p.citationCount = await semantic.getCitationCount(p.arxivId);
  }

  // 3. フィルタ
  const filtered = filterByMinCitations(papers, 0);

  // 4. Slackメッセージ表示
  console.log('--- Slack Message Preview ---');
  console.log(buildSlackMessage(filtered));
  console.log('--- End Preview ---\n');

  // Webhook URLがあれば実際に送信
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (webhookUrl && !webhookUrl.includes('YOUR/WEBHOOK/URL')) {
    console.log('Sending to Slack...');

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: ` ${new Date().toLocaleDateString('ja-JP')} の論文更新（${filtered.length}件）`,
        },
      },
      ...filtered.flatMap((p, i) => [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${i + 1}. ${p.title}*\n_${p.authors.slice(0, 3).join('、')}${p.authors.length > 3 ? '他' : ''}_\n${p.summary.slice(0, 200)}...${p.citationCount ? ` | 引用${p.citationCount}回` : ''}\n<${p.url}|arXiv> | <${p.pdfUrl}|PDF>`,
          },
        },
      ]),
    ];

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });

    if (res.ok) {
      console.log(' Sent to Slack successfully!');
    } else {
      console.log(' Failed to send:', res.status, res.statusText);
    }
  } else {
    console.log('Skipping Slack send (no valid webhook URL in .env)');
    console.log('Set SLACK_WEBHOOK_URL in .env to actually send to Slack');
  }

  console.log('\n=== Test Complete ===');
}

testSlackOutput().catch(console.error);
