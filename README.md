# Paper Daily Bot

arXivから論文を収集し、毎日メール/Slackで通知するTypeScript製ボット。

## Features

- arXiv APIで論文取得
- Semantic Scholar APIで引用数取得
- 引用数によるフィルタリング
- **Email or Slack**で通知

## Setup

```bash
# Install dependencies
pnpm install

# Copy env file
cp .env.example .env

# Edit .env with your settings
pnpm tsx src/index.ts
```

## GitHub Actions - 毎日自動送信

### 1. GitHubリポジトリ作成

```bash
cd /Users/itarutomy/paper-slack-bot
git init
git add .
git commit -m "Initial commit"
```

GitHubで新しいリポジトリを作成してプッシュ:
```bash
git remote add origin https://github.com/YOUR_USERNAME/paper-daily-bot.git
git branch -M main
git push -u origin main
```

### 2. GitHubのSecretsとVariablesを設定

**Settings → Secrets and variables → Actions**

| Type | Name | Value |
|------|------|-------|
| Secret | `RESEND_API_KEY` | `re_L9fD9y9B_C26b9BphKU1PteYwBsVCYgRt` |
| Secret | `EMAIL_TO` | `tomtar9779@gmail.com` |
| Variable | `NOTIFY_TYPE` | `email` |
| Variable | `EMAIL_FROM` | `"Paper Daily <onboarding@resend.dev>"` |
| Variable | `ARXIV_QUERY` | `cat:cs.AI OR cat:cs.LG` |
| Variable | `MAX_PAPERS` | `5` |
| Variable | `DAYS_BACK` | `7` |
| Variable | `MIN_CITATIONS` | `0` |

### 3. Workflowを手動実行

**Actions → Daily Paper Bot → Run workflow** をクリック

成功すれば、毎日9:00 JSTにメールが届きます！

## Notification Types

### Email (Resend)

- 無料: 3000通/月
- サインアップ: https://resend.com/signup

```bash
NOTIFY_TYPE=email
RESEND_API_KEY=re_xxxxxx
EMAIL_FROM="Paper Daily <onboarding@resend.dev>"
EMAIL_TO=you@example.com
```

### Slack

```bash
NOTIFY_TYPE=slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

## Usage

```bash
# Run
pnpm dev

# Test
pnpm test

# Type check
pnpm typecheck
```

## Architecture

```
Notifier (interface)
├── SlackNotifier  - Slack Webhook
└── EmailNotifier  - Resend API

PaperBot (DI for Notifier)
```
