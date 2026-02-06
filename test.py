#!/usr/bin/env python3
"""
テスト用スクリプト - Slack送信なしで論文取得をテスト
"""

import os
import sys
from datetime import datetime, timedelta

# プロジェクトルートをパスに追加
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import ArxivFetcher, SemanticScholarClient, LLMSummarizer, filter_papers


def test_fetch():
    """arXivからの取得テスト"""
    print("=" * 50)
    print("テスト1: arXivから論文取得")
    print("=" * 50)

    query = os.getenv("ARXIV_QUERY", "cat:cs.AI")
    fetcher = ArxivFetcher(query, max_results=5)
    papers = fetcher.fetch_papers(days_back=7)  # 過去1週間

    print(f"\n取得件数: {len(papers)}件")

    for i, paper in enumerate(papers, 1):
        print(f"\n{i}. {paper.title}")
        print(f"   著者: {', '.join(paper.authors[:3])}")
        print(f"   公開日: {paper.published}")
        print(f"   URL: {paper.url}")

    return papers


def test_semantic_scholar(papers):
    """Semantic Scholar連携テスト"""
    print("\n" + "=" * 50)
    print("テスト2: Semantic Scholarで情報付与")
    print("=" * 50)

    api_key = os.getenv("SEMANTIC_SCHOLAR_API_KEY")
    client = SemanticScholarClient(api_key)

    # 最初の3件のみテスト
    test_papers = papers[:3]
    enriched = client.enrich_papers(test_papers)

    print(f"\n情報付与完了:")
    for paper in enriched:
        print(f"- {paper.title[:50]}...: 引用{paper.citation_count}回")

    return enriched


def test_filter(papers):
    """フィルタリングテスト"""
    print("\n" + "=" * 50)
    print("テスト3: フィルタリング")
    print("=" * 50)

    # 引用数5以上でフィルタ
    filtered = filter_papers(papers, min_citations=5)
    print(f"\n引用数5以上: {len(filtered)}件")

    return filtered


def test_summarize(papers):
    """要約テスト"""
    print("\n" + "=" * 50)
    print("テスト4: LLM要約")
    print("=" * 50)

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("OPENAI_API_KEYが設定されていないためスキップ")
        return papers

    summarizer = LLMSummarizer(api_key, max_length=100)

    # 最初の1件のみテスト
    test_paper = papers[0]
    print(f"\n要約対象: {test_paper.title[:50]}...")

    summary = summarizer.summarize(test_paper)
    if summary:
        print(f"\n要約結果:\n{summary}")
        test_paper.ai_summary = summary

    return papers


def main():
    """全テスト実行"""
    print("Paper Slack Bot テスト")
    print(f"時刻: {datetime.now().strftime('%Y/%m/%d %H:%M:%S')}")

    # .envチェック
    if not os.path.exists(".env"):
        print("\n⚠️  .envファイルがありません。.env.exampleをコピーして設定してください。")
        print("   cp .env.example .env")
        return

    # テスト実行
    papers = test_fetch()

    if papers:
        papers = test_semantic_scholar(papers)
        papers = test_filter(papers)
        test_summarize(papers)

    print("\n" + "=" * 50)
    print("テスト完了")
    print("=" * 50)


if __name__ == "__main__":
    main()
