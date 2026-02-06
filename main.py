#!/usr/bin/env python3
"""
Paper Slack Bot - 論文を収集してSlackに投稿するボット
"""

import os
import sys
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dataclasses import dataclass

import arxiv
from dotenv import load_dotenv
import requests

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 環境変数読み込み
load_dotenv()


@dataclass
class Paper:
    """論文データクラス"""
    title: str
    authors: List[str]
    summary: str
    published: datetime
    url: str
    pdf_url: str
    arxiv_id: str
    citation_count: int = 0
    ai_summary: Optional[str] = None


class ArxivFetcher:
    """arXivから論文を取得するクラス"""

    def __init__(self, query: str, max_results: int = 20):
        self.query = query
        self.max_results = max_results

    def fetch_papers(self, days_back: int = 1) -> List[Paper]:
        """
        過去N日以内の論文を取得

        Args:
            days_back: 何日前までの論文を取得するか

        Returns:
            論文リスト
        """
        logger.info(f"arXivから論文を取得します: query={self.query}, max_results={self.max_results}")

        # 昨日の日付を計算
        since_date = datetime.now() - timedelta(days=days_back)

        # arXiv検索実行
        search = arxiv.Search(
            query=self.query,
            max_results=self.max_results,
            sort_by=arxiv.SortCriterion.SubmittedDate,
            sort_order=arxiv.SortOrder.Descending
        )

        papers = []
        try:
            for result in search.results():
                # 公開日フィルタ
                if result.published.replace(tzinfo=None) < since_date:
                    continue

                paper = Paper(
                    title=result.title,
                    authors=[a.name for a in result.authors],
                    summary=result.summary.replace('\n', ' '),
                    published=result.published,
                    url=result.entry_id,
                    pdf_url=result.pdf_url,
                    arxiv_id=result.entry_id.split('/')[-1]
                )
                papers.append(paper)

            logger.info(f"{len(papers)}件の論文を取得しました")
            return papers

        except Exception as e:
            logger.error(f"論文取得エラー: {e}")
            return []


class SemanticScholarClient:
    """Semantic Scholar APIクライアント"""

    def __init__(self, api_key: Optional[str] = None):
        self.base_url = "https://api.semanticscholar.org/graph/v1"
        self.api_key = api_key
        self.headers = {}
        if api_key:
            self.headers["x-api-key"] = api_key

    def get_paper_details(self, arxiv_id: str) -> Dict:
        """
        arXiv IDから論文詳細を取得

        Args:
            arxiv_id: arXiv ID（例: "2301.00001"）

        Returns:
            論文詳細情報
        """
        url = f"{self.base_url}/paper/arXiv:{arxiv_id}"
        params = {
            "fields": "citationCount,influence,year,title"
        }

        try:
            response = requests.get(url, params=params, headers=self.headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.debug(f"Semantic Scholar取得エラー ({arxiv_id}): {e}")
            return {}

    def enrich_papers(self, papers: List[Paper]) -> List[Paper]:
        """
        論文リストに引用数などの情報を付与

        Args:
            papers: 論文リスト

        Returns:
        情報付与済みの論文リスト
        """
        logger.info("Semantic Scholarで論文情報を付与します")

        for paper in papers:
            details = self.get_paper_details(paper.arxiv_id)
            if details:
                paper.citation_count = details.get("citationCount", 0)

        return papers


class LLMSummarizer:
    """LLMで要約を生成するクラス"""

    def __init__(self, api_key: str, model: str = "gpt-4o-mini", max_length: int = 200):
        try:
            from openai import OpenAI
            self.client = OpenAI(api_key=api_key)
            self.model = model
            self.max_length = max_length
            self.enabled = True
        except ImportError:
            logger.warning("OpenAIライブラリがインストールされていません。要約をスキップします。")
            self.enabled = False
        except Exception as e:
            logger.warning(f"OpenAI初期化エラー: {e}。要約をスキップします。")
            self.enabled = False

    def summarize(self, paper: Paper) -> str:
        """
        論文の要約を生成（日本語）

        Args:
            paper: 論文

        Returns:
            要約テキスト
        """
        if not self.enabled:
            return None

        try:
            prompt = f"""以下の論文の要約を日本語で{self.max_length}文字以内で簡潔にまとめてください。

タイトル: {paper.title}

要約:
{paper.summary}

重要な貢献とインパクトを中心にまとめてください。"""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "あなたは論文の要約を作成するアシスタントです。"},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.3
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            logger.error(f"要約生成エラー ({paper.arxiv_id}): {e}")
            return None


class SlackNotifier:
    """Slackに通知を送るクラス"""

    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url

    def send_papers(self, papers: List[Paper], channel_name: str = "論文ボット") -> bool:
        """
        論文リストをSlackに送信

        Args:
            papers: 論文リスト
            channel_name: チャンネル名（ヘッダー用）

        Returns:
            成功かどうか
        """
        if not papers:
            logger.info("送信する論文がありません")
            return True

        today = datetime.now().strftime("%Y/%m/%d")
        count = len(papers)

        # メインメッセージ構築
        header = {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": f"🔥 {today} 人気論文 Top{count}"
            }
        }

        blocks = [header]

        # 論文ごとのブロック
        for i, paper in enumerate(papers, 1):
            citation_info = f" | 引用{paper.citation_count}回" if paper.citation_count > 0 else ""

            # 要約がある場合
            summary_text = paper.ai_summary if paper.ai_summary else self._truncate_text(paper.summary, 200)

            paper_block = {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*{i}. {paper.title}*\n"
                            f"_{'、'.join(paper.authors[:3])}{'他' if len(paper.authors) > 3 else ''}_\n"
                            f"{summary_text}{citation_info}\n"
                            f"<{paper.url}|arXiv> | <{paper.pdf_url}|PDF>"
                }
            }
            blocks.append(paper_block)
            blocks.append({"type": "divider"})

        # 送信
        payload = {"blocks": blocks}

        try:
            response = requests.post(self.webhook_url, json=payload, timeout=10)
            response.raise_for_status()
            logger.info(f"Slackに送信しました: {count}件")
            return True
        except Exception as e:
            logger.error(f"Slack送信エラー: {e}")
            return False

    def _truncate_text(self, text: str, max_length: int) -> str:
        """テキストを指定長さに切り詰める"""
        if len(text) <= max_length:
            return text
        return text[:max_length-3] + "..."


class EmailNotifier:
    """Emailで通知を送るクラス（Resend使用）"""

    def __init__(self, api_key: str, from_email: str, to_email: str):
        self.api_key = api_key
        self.from_email = from_email
        self.to_email = to_email
        self.base_url = "https://api.resend.com/emails"

    def send_papers(self, papers: List[Paper]) -> bool:
        """
        論文リストをEmailで送信

        Args:
            papers: 論文リスト

        Returns:
            成功かどうか
        """
        if not papers:
            logger.info("送信する論文がありません")
            return True

        today = datetime.now().strftime("%Y/%m/%d")
        count = len(papers)

        # HTMLメール構築
        html_parts = [f"<h2>🔥 {today} 人気論文 Top{count}</h2>"]

        for i, paper in enumerate(papers, 1):
            citation_info = f" | 引用{paper.citation_count}回" if paper.citation_count > 0 else ""
            summary_text = paper.ai_summary if paper.ai_summary else paper.summary[:300] + "..."

            html_parts.append(f"""
            <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                <h3>{i}. {paper.title}</h3>
                <p><em>{', '.join(paper.authors[:3])}{' et al.' if len(paper.authors) > 3 else ''}</em></p>
                <p>{summary_text}{citation_info}</p>
                <p>
                    <a href="{paper.url}">arXiv</a> | <a href="{paper.pdf_url}">PDF</a>
                </p>
            </div>
            """)

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
            {''.join(html_parts)}
        </body>
        </html>
        """

        # 送信
        payload = {
            "from": self.from_email,
            "to": [self.to_email],
            "subject": f"🔥 {today} 人気論文 Top{count}",
            "html": html_content
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        try:
            response = requests.post(self.base_url, json=payload, headers=headers, timeout=10)
            response.raise_for_status()
            logger.info(f"Emailを送信しました: {count}件")
            return True
        except Exception as e:
            logger.error(f"Email送信エラー: {e}")
            return False


def filter_papers(papers: List[Paper], min_citations: int = 0) -> List[Paper]:
    """論文をフィルタリング"""
    filtered = [p for p in papers if p.citation_count >= min_citations]
    if len(filtered) < len(papers):
        logger.info(f"引用数フィルタ: {len(papers)}件 -> {len(filtered)}件")
    return filtered


def main():
    """メイン処理"""
    logger.info("=" * 50)
    logger.info("Paper Slack Bot 開始")
    logger.info("=" * 50)

    # 設定取得
    query = os.getenv("ARXIV_QUERY", "cat:cs.AI OR cat:cs.LG")
    max_papers = int(os.getenv("MAX_PAPERS", "100"))
    min_citations = int(os.getenv("MIN_CITATIONS", "0")

    # 通知先（Slack or Email）
    webhook_url = os.getenv("SLACK_WEBHOOK_URL")
    resend_api_key = os.getenv("RESEND_API_KEY")
    email_from = os.getenv("EMAIL_FROM", "Paper Daily <papers@yourdomain.com>")
    email_to = os.getenv("EMAIL_TO")

    if not webhook_url and not (resend_api_key and email_to):
        logger.error("通知先が設定されていません（SLACK_WEBHOOK_URL または RESEND_API_KEY + EMAIL_TO）")
        sys.exit(1)

    # 1. arXivから論文取得
    fetcher = ArxivFetcher(query, max_papers)
    papers = fetcher.fetch_papers(days_back=1)

    if not papers:
        logger.info("新しい論文はありませんでした")
        return

    # 2. Semantic Scholarで情報付与
    api_key = os.getenv("SEMANTIC_SCHOLAR_API_KEY")
    if api_key or True:  # APIキーなしでも無料枠で動作
        semantic_client = SemanticScholarClient(api_key)
        papers = semantic_client.enrich_papers(papers)

    # 3. フィルタリング
    papers = filter_papers(papers, min_citations)

    if not papers:
        logger.info("フィルタ後、論文がありませんでした")
        return

    # 人気順（引用数降順）にソートしてTop10
    papers = sorted(papers, key=lambda p: p.citation_count, reverse=True)
    papers = papers[:10]
    logger.info(f"人気Top10: {len(papers)}件（最高引用数={papers[0].citation_count if papers else 0}）")

    # 4. LLMで要約（オプション）
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        max_length = int(os.getenv("SUMMARY_MAX_LENGTH", "200"))
        summarizer = LLMSummarizer(openai_key, model, max_length)

        if summarizer.enabled:
            logger.info("要約を生成します...")
            for paper in papers:
                paper.ai_summary = summarizer.summarize(paper)

    # 5. 通知送信
    success_count = 0

    # Slack
    if webhook_url:
        notifier = SlackNotifier(webhook_url)
        if notifier.send_papers(papers):
            success_count += 1

    # Email
    if resend_api_key and email_to:
        notifier = EmailNotifier(resend_api_key, email_from, email_to)
        if notifier.send_papers(papers):
            success_count += 1

    if success_count > 0:
        logger.info(f"完了しました（{success_count}件送信）")
    else:
        logger.error("すべての送信に失敗しました")
        sys.exit(1)


if __name__ == "__main__":
    main()
