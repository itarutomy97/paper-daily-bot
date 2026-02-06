# Paper Daily Bot

arXivから論文を収集し、Slackで人気Top10を通知するボット。

## Features

- arXiv APIで1日分の論文を100件取得
- Semantic Scholar APIで引用数取得
- **引用数順Top10**をSlackで通知
- LLM要約対応（オプション）

## ロジック

```
1. arXivから1日分100件取得
2. Semantic Scholarで引用数付与
3. 引用数降順にソートしてTop10抽出
4. LLM要約生成（オプション）
5. Slack送信
```

## Local Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Copy env file
cp .env.example .env

# Edit .env with your settings
python main.py
```

## GitHub Actions - 毎日自動送信

### 1. GitHubのSecretsとVariablesを設定

**Settings → Secrets and variables → Actions**

| Type | Name | Value | 必須 |
|------|------|-------|------|
| Secret | `SLACK_WEBHOOK_URL` | SlackのWebhook URL | ✅ |
| Secret | `SEMANTIC_SCHOLAR_API_KEY` | （オプション）APIキー | - |
| Secret | `OPENAI_API_KEY` | （オプション）要約用 | - |
| Variable | `ARXIV_QUERY` | `cat:cs.AI OR cat:cs.LG` | - |
| Variable | `MAX_PAPERS` | `100` | - |
| Variable | `DAYS_BACK` | `1` | - |
| Variable | `MIN_CITATIONS` | `0` | - |

### 2. Slack Webhook URL取得

1. Slack App作成: https://api.slack.com/apps
2. Incoming Webhooksを有効化
3. Webhook URLをコピーしてGitHub Secretsに設定

### 3. Workflowを手動実行

**Actions → Daily Paper Bot → Run workflow** をクリック

成功すれば、毎日9:00 JSTにSlackで人気論文Top10が届きます！

## LLM要約（オプション）

`OPENAI_API_KEY`を設定すると、gpt-4o-miniで日本語要約を生成します。

- コスト: 約$0.02/月（5論文/日）
- 設定:
  - `OPENAI_MODEL`: `gpt-4o-mini`（デフォルト）
  - `SUMMARY_MAX_LENGTH`: `200`（文字数）

## コスト

| サービス | コスト |
|----------|--------|
| GitHub Actions | 無料 |
| arXiv API | 無料 |
| Semantic Scholar | 無料 |
| Slack Webhook | 無料 |
| OpenAI要約 | ~$0.02/月（オプション） |
