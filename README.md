# Paper Daily Bot

arXivから論文を収集し、**Email or Slack**で人気Top10を通知するボット。

## Features

- arXiv APIで1日分の論文を100件取得
- Semantic Scholar APIで引用数取得
- **引用数順Top10**を通知
- LLM要約対応（オプション）

## ロジック

```
1. arXivから1日分100件取得
2. Semantic Scholarで引用数付与
3. 引用数降順にソートしてTop10抽出
4. LLM要約生成（オプション）
5. Email or Slackで送信
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
| Secret | `RESEND_API_KEY` | Resend APIキー | Email用 ✅ |
| Secret | `EMAIL_TO` | 宛先メールアドレス | Email用 ✅ |
| Secret | `SLACK_WEBHOOK_URL` | Slack Webhook URL | Slack用 |
| Variable | `EMAIL_FROM` | `"Paper Daily <onboarding@resend.dev>"` | - |
| Variable | `ARXIV_QUERY` | `cat:cs.AI OR cat:cs.LG` | - |
| Variable | `MAX_PAPERS` | `100` | - |
| Variable | `DAYS_BACK` | `1` | - |
| Variable | `MIN_CITATIONS` | `0` | - |

**SlackとEmail両方設定可能。少なくとも1つあれば動作します。**

### 2. Resend APIキー取得

1. https://resend.com/signup で登録（無料）
2. API Keyを作成
3. GitHub Secretsに `RESEND_API_KEY` として設定

### 3. Workflowを手動実行

**Actions → Daily Paper Bot → Run workflow** をクリック

成功すれば、毎日9:00 JSTに人気論文Top10が届きます！

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
| Resend Email | 無料（3000通/月） |
| OpenAI要約 | ~$0.02/月（オプション） |
