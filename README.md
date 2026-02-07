# Paper Daily Bot

arXivから論文を収集し、**Email or Slack**で人気Top10を通知するボット（Python製）。

## Features

- Hugging Face Daily Papers APIでupvotes順に論文取得
- **通常Top10 ＋ キーワードTop10**の20件を1メールで送信
- LLM要約対応（オプション）
- 毎日9:00 JSTに自動実行

## ロジック

```
1. Hugging Face Daily Papersからupvotes順に論文取得
2. 通常Top10抽出
3. キーワード指定があればキーワードTop10も抽出
4. 両方を1通のEmailで送信
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
| Variable | `EMAIL_FROM` | `onboarding@resend.dev` | - |
| Variable | `USE_HUGGINGFACE` | `true` | - |
| Variable | `KEYWORD_FILTER` | `RAG` など | - |
| Variable | `MAX_PAPERS` | `50` | - |

### 2. Resend APIキー取得

1. https://resend.com/signup で登録（無料）
2. API Keyを作成
3. GitHub Secretsに設定

### 3. Workflowを手動実行

**Actions → Daily Paper Bot → Run workflow**

成功すれば、毎日9:00 JSTに人気論文Top20が届きます！

## LLM要約（オプション）

`OPENAI_API_KEY`を設定すると、gpt-4o-miniで日本語要約を生成します。

- コスト: 約$0.02/月（5論文/日）
- Hugging Faceのai_summaryがある場合はそれを使用

## コスト

| サービス | コスト |
|----------|--------|
| GitHub Actions | 無料 |
| Hugging Face API | 無料 |
| Resend Email | 無料（3000通/月） |
| OpenAI要約 | ~$0.02/月（オプション） |
