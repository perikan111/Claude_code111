# AI TRPG Game Master

**完全ブラウザ内実行のTRPGゲームマスターシステム**

WebLLM（Microsoft Phi-3.5 Mini）とブラウザ内RAGを使用し、サーバー不要で動作します。設定資料やルールを参照しながら自然な会話でTRPGセッションを進行します。

## アーキテクチャ

```
[GitHub Pages - 静的ホスティング]
         ↓
[ブラウザ内で完結]
  ├── WebLLM (Microsoft Phi-4)
  ├── ブラウザ内ベクターストア
  └── TF-IDF埋め込み
```

### コンポーネント

#### 1. WebLLM + Microsoft Phi-3.5 Mini
- ブラウザ内でLLMを実行（WebGPU使用）
- サーバー・API不要
- 完全プライバシー保護
- オフライン動作可能

#### 2. ブラウザ内ベクターストア
- JavaScriptによる簡易ベクトル検索
- TF-IDF埋め込み
- コサイン類似度による検索

#### 3. RAGフロー
- ユーザー入力 → 関連ドキュメント検索
- 検索結果 → コンテキスト構築
- Phi-3.5 → GM応答生成

## データフロー（RAGの動作）

1. **プレイヤー入力** → ブラウザで受付
2. **埋め込み生成** → TF-IDFでクエリをベクトル化
3. **ベクター検索** → メモリ内ストアから類似文書取得
4. **コンテキスト構築** → 検索結果を整形
5. **応答生成** → WebLLM (Phi-3.5) でGM応答生成
6. **表示** → チャットUIに表示

## プロジェクト構造

```
docs/                       # GitHub Pages - すべてここに含まれる
├── index.html             # メインHTML
├── style.css              # スタイル
├── app.js                 # メインアプリケーション
├── lib/
│   ├── webllm-setup.js   # WebLLM初期化
│   └── vectorstore.js    # ブラウザ内ベクターストア
└── data/
    └── documents.js      # TRPG設定資料（15件のドキュメント）
```

## セットアップ（超簡単！）

### GitHub Pagesで公開

1. GitHubリポジトリの **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **`main`** / **`/docs`**
4. **Save**

数分後、自動デプロイされます：
```
https://<YOUR_USERNAME>.github.io/<REPO_NAME>/
```

**それだけです！** サーバー設定、API キー、環境変数など一切不要。

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

## 特徴

✅ **完全ブラウザ内実行** - サーバー・APIキー不要
✅ **100%無料** - GitHub Pagesの無料枠で動作
✅ **プライバシー保護** - データはブラウザ内のみ
✅ **オフライン対応** - モデルダウンロード後は接続不要
✅ **RAGで正確な応答** - 設定資料を検索して参照
✅ **最新AI** - Microsoft Phi-3.5 Miniモデル使用
✅ **高速** - WebGPUによる高速推論

## 今後の拡張例

- セッション履歴の保存（Supabase/D1統合）
- NPCごとの人格管理
- マルチプレイヤー対応
- 音声入出力（Web Speech API）
- ダイスロール機能
- キャラクターシート管理

## 推奨環境

- **ブラウザ**: Chrome / Edge 最新版（WebGPU対応）
- **メモリ**: 8GB以上推奨
- **初回起動**: 高速インターネット接続（モデルダウンロード）

## 初回起動について

初回アクセス時は**Microsoft Phi-3.5 Miniモデル**（約2.3GB）をダウンロードします。

- ダウンロード時間: 光回線で2〜5分程度
- ブラウザキャッシュに保存されます
- 2回目以降は高速起動（数秒）

## 開発

### ローカルテスト

```bash
cd docs
python -m http.server 8000
# または
npx serve
```

ブラウザで `http://localhost:8000` を開く

## トラブルシューティング

### モデルのロードに失敗する

- Chrome/Edgeの最新版を使用していますか？
- WebGPUが有効ですか？（`chrome://gpu` で確認）
- メモリは8GB以上ありますか？

### 応答が遅い

- 初回生成は少し時間がかかります
- GPUが搭載されていない場合は遅くなります

## ライセンス

MIT

## 参考リンク

- [WebLLM](https://webllm.mlc.ai/)
- [Microsoft Phi-3.5](https://huggingface.co/microsoft/Phi-3.5-mini-instruct)
- [WebGPU](https://www.w3.org/TR/webgpu/)
