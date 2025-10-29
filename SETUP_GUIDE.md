# セットアップガイド

このガイドでは、AI TRPG Game Masterシステムを一から構築してデプロイする手順を説明します。

## 前提条件

- Node.js 18以上
- npm または yarn
- Cloudflareアカウント（無料プランでOK）
- GitHubアカウント（GitHub Pages用）

## ステップ1: Cloudflareアカウントのセットアップ

### 1.1 アカウント作成

1. [Cloudflare](https://dash.cloudflare.com/)にアクセス
2. サインアップ（無料）
3. ダッシュボードにログイン

### 1.2 Wranglerのインストールと認証

```bash
# Wrangler CLIをグローバルインストール
npm install -g wrangler

# Cloudflareにログイン
wrangler login
```

ブラウザが開くので、認証を完了してください。

## ステップ2: Vectorizeインデックスの作成

```bash
# プロジェクトルートで実行
cd worker

# Vectorizeインデックスを作成
wrangler vectorize create trpg-knowledge --dimensions=768 --metric=cosine
```

成功すると、インデックスIDが表示されます。

## ステップ3: Cloudflare Workersのデプロイ

### 3.1 依存関係のインストール

```bash
cd worker
npm install
```

### 3.2 wrangler.tomlの確認

`worker/wrangler.toml`を開き、以下を確認：

```toml
[[vectorize]]
binding = "VECTORIZE"
index_name = "trpg-knowledge"  # 作成したインデックス名と一致させる
```

### 3.3 デプロイ

```bash
npm run deploy
# または
wrangler deploy
```

成功すると、WorkerのURLが表示されます：

```
Published trpg-gm-worker
  https://trpg-gm-worker.<YOUR_SUBDOMAIN>.workers.dev
```

**このURLを控えておいてください！**

## ステップ4: ドキュメントの登録

### 4.1 登録スクリプトの準備

```bash
# プロジェクトルートに戻る
cd ..

# Node.jsで実行できるように準備
cd scripts
npm init -y  # package.jsonがなければ作成
```

### 4.2 Worker URLの設定

環境変数を設定：

```bash
export WORKER_URL="https://trpg-gm-worker.<YOUR_SUBDOMAIN>.workers.dev"
```

またはスクリプト内で直接URLを変更：

`scripts/ingest.js`の5行目：

```javascript
const WORKER_URL = 'https://trpg-gm-worker.<YOUR_SUBDOMAIN>.workers.dev';
```

### 4.3 ドキュメント登録の実行

```bash
node ingest.js
```

出力例：

```
=== TRPG Document Ingestion ===

Found 3 markdown files:

Processing: world.md
  - Created 15 chunks
Processing: rules.md
  - Created 20 chunks
Processing: npcs.md
  - Created 12 chunks

Total documents: 47

Ingesting to Vectorize...

Batch 1: 10 documents
Success: { success: true, count: 10 }
...

=== Ingestion Complete ===
```

## ステップ5: フロントエンドの設定

### 5.1 Worker URLの更新

`docs/app.js`を編集：

```javascript
// 1行目を変更
const WORKER_URL = 'https://trpg-gm-worker.<YOUR_SUBDOMAIN>.workers.dev';
```

### 5.2 ローカルテスト

```bash
# docsディレクトリでシンプルなHTTPサーバーを起動
cd docs
python -m http.server 8000
# または
npx serve
```

ブラウザで `http://localhost:8000` を開いて動作確認。

## ステップ6: GitHub Pagesにデプロイ

### 6.1 GitHubリポジトリにプッシュ

```bash
git add .
git commit -m "Deploy AI TRPG GM"
git push origin main
```

### 6.2 GitHub Pagesを有効化

1. GitHubリポジトリページを開く
2. **Settings** → **Pages**
3. **Source**: `main` branch
4. **Folder**: `/docs`
5. **Save**

数分後、GitHub Pagesのサイトが公開されます：

```
https://<YOUR_USERNAME>.github.io/<REPO_NAME>/
```

## ステップ7: 動作確認

### 7.1 フロントエンドのテスト

1. GitHub PagesのURLにアクセス
2. チャット入力欄に「酒場に入る」と入力
3. 「送信」をクリック
4. GMが応答するか確認

### 7.2 Workerのヘルスチェック

```bash
curl https://trpg-gm-worker.<YOUR_SUBDOMAIN>.workers.dev/health
```

期待する応答：

```json
{
  "status": "healthy",
  "timestamp": "2024-10-29T..."
}
```

## トラブルシューティング

### Worker接続エラー

**症状**: フロントエンドで「オフライン」と表示される

**解決策**:
1. Worker URLが正しいか確認
2. Workerがデプロイされているか確認: `wrangler deployments list`
3. CORSエラーがないかブラウザのコンソールを確認

### Vectorize検索結果が0件

**症状**: GMの応答が「関連情報が見つかりませんでした」ばかり

**解決策**:
1. ドキュメントが登録されているか確認: `wrangler vectorize list trpg-knowledge`
2. 登録スクリプトを再実行
3. 埋め込みモデルの次元数が一致しているか確認（768次元）

### AI応答が遅い

**症状**: 応答に10秒以上かかる

**解決策**:
1. 70Bモデルではなく8Bモデルを使用
2. Workers AIのクォータを確認
3. 複数回試す（コールドスタートの可能性）

### LangGraph関連のエラー

**症状**: `Module not found: @langchain/langgraph`

**解決策**:
```bash
cd worker
npm install @langchain/core @langchain/langgraph @langchain/community
npm run deploy
```

## 次のステップ

### システムのカスタマイズ

1. **設定資料の追加**: `data/`に新しいMarkdownファイルを追加
2. **NPCの追加**: `data/npcs.md`に新しいNPCを追加
3. **UIのカスタマイズ**: `docs/style.css`を編集

### 機能拡張

1. **セッション履歴の保存**: Cloudflare D1やSupabaseを統合
2. **マルチプレイヤー**: Durable Objectsで複数プレイヤー対応
3. **音声入出力**: Web Speech APIを追加
4. **ダイスロール**: フロントエンドにダイス機能追加

## サポート

問題が解決しない場合：

1. Cloudflare Workers ドキュメント: https://developers.cloudflare.com/workers/
2. Vectorize ドキュメント: https://developers.cloudflare.com/vectorize/
3. Workers AI ドキュメント: https://developers.cloudflare.com/workers-ai/

## コスト

Cloudflare無料プランで利用可能：

- **Workers**: 100,000リクエスト/日
- **Vectorize**: 3000万クエリ/月
- **Workers AI**: 10,000 Neurons/日

通常の利用なら無料枠で十分です。
