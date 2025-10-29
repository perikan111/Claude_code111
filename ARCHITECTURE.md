# アーキテクチャ詳細

このドキュメントでは、AI TRPG GMシステムの技術的な詳細を説明します。

## システム全体図

```
┌─────────────────┐
│  GitHub Pages   │  静的ホスティング（HTML/CSS/JS）
│  (Frontend)     │
└────────┬────────┘
         │ HTTPS
         │ POST /rag
         ▼
┌─────────────────────────────────────────┐
│   Cloudflare Workers                    │
│   ┌─────────────────────────────────┐   │
│   │  LangGraph RAG Flow             │   │
│   │  ┌────┐  ┌────┐  ┌────┐  ┌────┐│   │
│   │  │検索│→│要約│→│生成│→│応答││   │
│   │  └────┘  └────┘  └────┘  └────┘│   │
│   └─────────────────────────────────┘   │
└────┬──────────────────────┬─────────────┘
     │                      │
     │ Query Embedding      │ LLM Call
     ▼                      ▼
┌──────────────┐      ┌─────────────┐
│  Vectorize   │      │ Workers AI  │
│  (検索DB)    │      │ (Llama 3.1) │
└──────────────┘      └─────────────┘
```

## 各コンポーネントの詳細

### 1. Frontend（GitHub Pages）

**技術スタック**:
- Pure JavaScript（フレームワークなし）
- HTML5 + CSS3
- Fetch API

**主要機能**:

```javascript
// app.js の主要フロー
async function handleSend() {
  1. ユーザー入力を取得
  2. UI更新（ローディング状態）
  3. Worker APIコール
  4. レスポンスをパース
  5. メッセージ表示
  6. ローディング解除
}
```

**状態管理**:
- `currentModel`: 使用中のモデル（8b/70b）
- `isLoading`: リクエスト進行中フラグ

**API通信**:

```javascript
POST /rag
Content-Type: application/json

{
  "message": "ユーザーの発言",
  "model": "8b" | "70b"
}

→ Response
{
  "response": "GMの応答",
  "searchQuery": "検索に使用したクエリ",
  "resultsFound": 3,
  "model": "8b"
}
```

### 2. Cloudflare Workers（バックエンド）

**技術スタック**:
- TypeScript
- Cloudflare Workers Runtime
- LangChain/LangGraph

**ファイル構成**:

```
worker/src/
├── index.ts      # エントリーポイント、ルーティング
├── langgraph.ts  # RAGフロー定義
├── vectorize.ts  # Vectorize操作
└── ai.ts         # Workers AI操作
```

#### index.ts - メインロジック

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // ルーティング
    switch (path) {
      case '/rag':      // 質問応答
      case '/ingest':   // ドキュメント登録
      case '/health':   // ヘルスチェック
    }
  }
}
```

**CORSヘッダー**:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

#### langgraph.ts - RAGフロー

**ステート定義**:

```typescript
interface RAGState {
  userInput: string;        // ユーザー入力
  searchQuery?: string;     // 生成された検索クエリ
  searchResults?: SearchResult[]; // 検索結果
  contextSummary?: string;  // 要約された文脈
  gmResponse?: string;      // 最終応答
  model: ModelSize;         // 使用モデル
}
```

**フロー実行**:

```typescript
async function runRAGFlow(
  userInput: string,
  model: ModelSize,
  bindings: RAGFlowBindings
): Promise<RAGState>

// Step 1: 検索クエリ生成
state = await generateQuery(state, bindings);

// Step 2: ベクター検索
state = await performSearch(state, bindings);

// Step 3: 文脈要約
state = await summarize(state, bindings);

// Step 4: GM応答生成
state = await generateResponse(state, bindings);
```

#### ai.ts - Workers AI統合

**モデル定義**:

```typescript
const MODELS = {
  '8b': '@cf/meta/llama-3.1-8b-instruct',
  '70b': '@cf/meta/llama-3.1-70b-instruct'
};
```

**主要関数**:

1. **generateSearchQuery**: ユーザー入力から検索クエリ生成
   ```typescript
   "酒場で情報収集" → "酒場 情報 冒険者 NPC"
   ```

2. **summarizeContext**: 検索結果を要約
   ```typescript
   [doc1, doc2, doc3] → "酒場には3人のNPCがいます..."
   ```

3. **generateGMResponse**: 最終応答生成
   ```typescript
   input + context → "酒場に入ると..."
   ```

4. **generateEmbedding**: テキストをベクトル化
   ```typescript
   "酒場" → [0.123, -0.456, ...] (768次元)
   ```

**プロンプト例**:

```typescript
const systemPrompt = `あなたは経験豊富なTRPGのゲームマスター（GM）です。

役割：
- プレイヤーの行動に対して、世界がどう反応するかを描写する
- 雰囲気のある自然な文章で語る
...`;
```

#### vectorize.ts - Vectorize操作

**主要関数**:

1. **insertDocuments**: ドキュメント登録
   ```typescript
   insertDocuments(vectorize, documents, embeddings)
   → Vectorizeに保存
   ```

2. **searchSimilar**: 類似検索
   ```typescript
   searchSimilar(vectorize, queryEmbedding, topK=3)
   → 上位3件の類似文書を返す
   ```

**データ構造**:

```typescript
interface Document {
  id: string;              // 一意なID
  text: string;            // テキスト内容
  metadata?: {             // メタデータ
    file: string;
    title: string;
    type: string;
  };
}
```

### 3. Cloudflare Vectorize

**設定**:
- **次元数**: 768（BGE-base-en-v1.5モデルの出力）
- **距離関数**: cosine similarity
- **インデックス名**: `trpg-knowledge`

**データフロー**:

```
1. テキスト → 埋め込みモデル → ベクトル（768次元）
2. ベクトル + メタデータ → Vectorize保存
3. クエリベクトル → Vectorize検索 → 類似ベクトルのID
4. ID → メタデータ取得 → 元のテキスト復元
```

**検索アルゴリズム**:

```
similarity = cosine(query_vector, doc_vector)
         = (A · B) / (||A|| × ||B||)
```

### 4. Workers AI

**使用モデル**:

| モデル | ID | パラメータ | 用途 | 速度 |
|--------|----|-----------:|------|------|
| Llama 3.1 8B | `@cf/meta/llama-3.1-8b-instruct` | 80億 | 通常会話 | 高速 |
| Llama 3.1 70B | `@cf/meta/llama-3.1-70b-instruct` | 700億 | 重要シーン | 低速 |
| BGE Embeddings | `@cf/baai/bge-base-en-v1.5` | - | ベクトル化 | 高速 |

**トークン制限**:

- 8Bモデル: 最大8192トークン
- 70Bモデル: 最大8192トークン
- 生成: `max_tokens`で制御（デフォルト512）

**推論処理**:

```typescript
const response = await ai.run(model, {
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ],
  max_tokens: 400,
  temperature: 0.8
});
```

## データフロー詳細

### RAG処理の完全なフロー

```
【入力】プレイヤー: "酒場で情報収集したい"

↓

【Step 1: 検索クエリ生成】
- LLM (8B): "酒場 情報収集" → "酒場 NPC 情報"

↓

【Step 2: ベクトル化】
- BGE Embeddings: "酒場 NPC 情報" → [0.12, -0.45, ...]

↓

【Step 3: Vectorize検索】
- Query: [0.12, -0.45, ...]
- Results:
  1. npcs.md: マーサ（酒場オーナー） (score: 0.89)
  2. npcs.md: ガレス（戦士） (score: 0.85)
  3. world.md: 王都グリフォン (score: 0.78)

↓

【Step 4: 文脈要約】
- LLM (8B): [doc1, doc2, doc3] →
  "酒場「黄金のグリフォン」には、
   オーナーのマーサ、戦士ガレス、
   魔術師セリナがいる..."

↓

【Step 5: GM応答生成】
- LLM (8B/70B):
  Input: "酒場で情報収集したい"
  Context: "酒場「黄金のグリフォン」には..."

  → "あなたは「黄金のグリフォン」に足を踏み入れます。
     店内は冒険者で賑わっており、カウンターには
     白髪の老婆マーサが立っています。
     隅のテーブルには傷だらけの戦士が座り、
     赤いローブの魔術師が本を読んでいます。
     誰に話しかけますか？"

↓

【出力】フロントエンドに返却
```

## パフォーマンス最適化

### レイテンシ

| 処理 | 平均時間 |
|------|----------|
| 検索クエリ生成 | ~500ms |
| ベクター検索 | ~200ms |
| 文脈要約 | ~800ms |
| 応答生成（8B） | ~1.5s |
| 応答生成（70B） | ~5s |
| **合計（8B）** | **~3s** |
| **合計（70B）** | **~6.5s** |

### 最適化手法

1. **並列処理**: 埋め込み生成と検索を並行実行
2. **キャッシング**: 同じクエリは結果をキャッシュ（未実装）
3. **バッチ処理**: 複数ドキュメントを一度に登録
4. **モデル選択**: 通常は8B、重要シーンで70B

## セキュリティ

### CORS

- `Access-Control-Allow-Origin: *`
- 本番環境では特定オリジンに制限推奨

### レート制限

Cloudflare Workers標準のレート制限：
- 無料プラン: 100,000リクエスト/日
- 有料プラン: 1000万リクエスト/月〜

### データ保護

- Vectorizeはデフォルトで暗号化
- Workers間の通信はHTTPSで保護

## 拡張ポイント

### 1. セッション管理

```typescript
// Cloudflare D1を使用
interface Session {
  id: string;
  userId: string;
  history: Message[];
  createdAt: Date;
}
```

### 2. NPCメモリ

```typescript
// NPCごとの会話履歴を保持
interface NPCMemory {
  npcId: string;
  conversations: {
    playerId: string;
    messages: string[];
  }[];
}
```

### 3. ダイスロール

```typescript
// Workers内でダイスをシミュレート
function rollDice(notation: string): number {
  // "2d6+3" → 2つの6面ダイス + 3
}
```

## デバッグ

### ログ確認

```bash
# リアルタイムログ
wrangler tail

# 過去のログ
wrangler tail --since 1h
```

### テスト

```bash
# ローカル開発サーバー
cd worker
npm run dev

# curlでテスト
curl -X POST http://localhost:8787/rag \
  -H "Content-Type: application/json" \
  -d '{"message":"酒場に入る","model":"8b"}'
```

## モニタリング

Cloudflare Dashboardで確認可能：

- リクエスト数
- エラー率
- レスポンスタイム
- Workers AI使用量
- Vectorizeクエリ数
