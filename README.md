# AI TRPG Game Master

WebベースのTRPGゲームマスターシステム。Cloudflare Workers + LangGraph + Vectorizeを活用し、設定資料やルールを参照しながら自然な会話でTRPGセッションを進行します。

## アーキテクチャ

```
[GitHub Pages] ←→ [Cloudflare Workers + LangGraph]
                            ↓
                    [Vectorize (検索)]
                            ↓
                    [Workers AI (Llama 3.1)]
```

### コンポーネント

#### 1. GitHub Pages（フロントエンド）
- 静的HTML + JavaScriptのチャットUI
- モデル切替（8B/70B）機能
- Cloudflare Workers APIへのリクエスト

#### 2. Cloudflare Workers（バックエンド）
- LangGraphによるRAGフロー制御
- エンドポイント：
  - `POST /ingest` - ドキュメント登録
  - `POST /rag` - 質問応答（GM応答生成）

#### 3. LangGraph
- RAGフロー：検索 → 要約 → 応答生成
- セッション状態管理
- 拡張可能な会話制御

#### 4. Cloudflare Vectorize
- ベクター検索エンジン
- TRPG設定資料・ルールを埋め込みベクトル化
- 関連文書の高速検索

#### 5. Workers AI
- Cloudflare提供のLLM実行環境
- Llama 3.1（8B/70B）モデル
- エッジで高速推論

## データフロー（RAGの動作）

1. **プレイヤー入力** → フロントエンドでユーザーが発話
2. **リクエスト送信** → `/rag`エンドポイントへPOST
3. **LangGraph処理開始** → 検索クエリ生成
4. **ベクター検索** → Vectorizeから関連文書取得
5. **文脈要約** → Workers AIで検索結果を要約
6. **応答生成** → GMとしての応答をLlama 3.1が生成
7. **応答送信** → ブラウザに返却・表示

## プロジェクト構造

```
├── worker/                 # Cloudflare Workers
│   ├── src/
│   │   ├── index.ts       # メインエントリーポイント
│   │   ├── langgraph.ts   # LangGraphフロー定義
│   │   ├── vectorize.ts   # Vectorize統合
│   │   └── ai.ts          # Workers AI呼び出し
│   ├── wrangler.toml      # Workers設定
│   └── package.json
│
├── docs/                   # GitHub Pages（フロントエンド）
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── data/                   # TRPG設定資料
│   ├── world.md           # 世界設定
│   ├── rules.md           # ルールブック
│   └── npcs.md            # NPCデータ
│
└── scripts/
    └── ingest.js          # ドキュメント登録スクリプト
```

## セットアップ

### 1. Cloudflare アカウント準備

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)でアカウント作成
2. Workers & Pagesを有効化
3. API Tokenを取得

### 2. プロジェクトのデプロイ

```bash
# Workersディレクトリへ移動
cd worker

# 依存関係インストール
npm install

# Vectorizeインデックス作成
wrangler vectorize create trpg-knowledge --dimensions=768 --metric=cosine

# デプロイ
wrangler deploy
```

### 3. ドキュメントの登録

```bash
# サンプルドキュメントを登録
node scripts/ingest.js
```

### 4. フロントエンドの設定

`docs/app.js`内のWorkers URLを更新：

```javascript
const WORKER_URL = 'https://your-worker.your-subdomain.workers.dev';
```

### 5. GitHub Pagesで公開

1. GitHubリポジトリの Settings > Pages
2. Source: `main` branch, `/docs` folder
3. Save → 自動デプロイ

## 使い方

### ゲームマスターとの対話

1. デプロイされたGitHub PagesのURLにアクセス
2. チャット入力欄にプレイヤーの行動を入力
3. GMが設定資料を参照しながら応答

**例：**

```
プレイヤー: 「酒場で情報収集したい」

GM: 酒場には冒険者が数人います。話しかけるなら
- 傷だらけの戦士
- 赤いローブの魔術師
- 店主の老婆
どの人物に近づきますか？
```

### モデル切替

- **8Bモデル**: 高速・通常会話向け
- **70Bモデル**: 高品質・重要シーン向け

UIのトグルで切替可能。

## 特徴

✅ **ブラウザだけで完結** - インストール不要
✅ **エッジ実行で高速** - Cloudflare Workersのグローバル配信
✅ **RAGで正確な応答** - 設定資料を検索して参照
✅ **モデル切替** - 速度と品質のバランス調整
✅ **拡張性** - LangGraphで機能追加が容易

## 今後の拡張例

- セッション履歴の保存（Supabase/D1統合）
- NPCごとの人格管理
- マルチプレイヤー対応
- 音声入出力（Web Speech API）
- ダイスロール機能
- キャラクターシート管理

## 開発

### ローカルテスト

```bash
cd worker
npm run dev
```

### TypeScript型チェック

```bash
npm run check
```

## ライセンス

MIT

## 参考リンク

- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Cloudflare Vectorize](https://developers.cloudflare.com/vectorize/)
- [Workers AI](https://developers.cloudflare.com/workers-ai/)
- [LangGraph](https://langchain-ai.github.io/langgraph/)
