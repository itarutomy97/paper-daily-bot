import 'dotenv/config';
import { ArxivFetcher } from './src/fetchers/arxiv-fetcher.js';
import { SemanticScholarClient } from './src/fetchers/semantic-scholar-client.js';

async function testIntegration() {
  console.log('=== Paper Bot Integration Test ===\n');

  // 1. arXivから論文取得
  console.log('1. Fetching papers from arXiv...');
  const arxiv = new ArxivFetcher('cat:cs.AI OR cat:cs.LG', { maxResults: 5 });
  const papers = await arxiv.fetchPapers();
  console.log(`   Found ${papers.length} papers\n`);

  if (papers.length === 0) {
    console.log('No papers found. Exiting.');
    return;
  }

  // 2. 最初の3件を表示
  console.log('2. First 3 papers:');
  for (let i = 0; i < Math.min(3, papers.length); i++) {
    const p = papers[i];
    console.log(`\n   [${i + 1}] ${p.title}`);
    console.log(`       Authors: ${p.authors.slice(0, 2).join(', ')}${p.authors.length > 2 ? ' et al.' : ''}`);
    console.log(`       arXiv ID: ${p.arxivId}`);
    console.log(`       URL: ${p.url}`);
  }

  // 3. Semantic Scholarで引用数取得
  console.log('\n3. Fetching citation counts from Semantic Scholar...');
  const semantic = new SemanticScholarClient();

  for (let i = 0; i < Math.min(3, papers.length); i++) {
    const p = papers[i];
    const count = await semantic.getCitationCount(p.arxivId);
    p.citationCount = count;
    console.log(`   ${p.arxivId}: ${count} citations`);
  }

  // 4. 結果サマリー
  console.log('\n4. Summary:');
  console.log(`   Total papers fetched: ${papers.length}`);
  console.log(`   Papers with citations: ${papers.filter(p => (p.citationCount ?? 0) > 0).length}`);
  console.log('\n=== Test Complete ===');
}

testIntegration().catch(console.error);
