# クイックスタート

## 最速で始める方法

### 1. 依存関係のインストール

```bash
pip install gdm-concordia anthropic openai numpy sentence-transformers
```

または

```bash
pip install -r requirements.txt
```

### 2. ゲームの実行

**方法A: 簡易実行スクリプトを使う（推奨）**

```bash
python run_game.py
```

**方法B: 直接実行**

```bash
python main.py
```

## 最初はモックモードで動作します

APIキーなしでも、ゲームの流れを確認できます（AI応答はモック）。

## 実際のAIを使用する場合

### ステップ1: APIキーを取得

**Claude（Anthropic）を使う場合:**
1. https://console.anthropic.com/ でアカウント作成
2. APIキーを取得

**ChatGPT（OpenAI）を使う場合:**
1. https://platform.openai.com/ でアカウント作成
2. APIキーを取得

### ステップ2: 環境変数を設定

**方法A: .envファイルを使う**

```bash
# .envファイルを作成
cp .env.example .env

# .envファイルを編集してAPIキーを設定
# ANTHROPIC_API_KEY=your_key_here
```

**方法B: 直接エクスポート**

```bash
# Claude（Anthropic）の場合
export ANTHROPIC_API_KEY="your_api_key_here"

# ChatGPT（OpenAI）の場合
export OPENAI_API_KEY="your_api_key_here"
```

### ステップ3: 実行

```bash
python run_game.py
```

## ゲームの流れ

1. **シナリオ紹介** - "The Lost Temple of Eldoria"
2. **パーティ紹介** - 3人のキャラクター（戦士、魔法使い、盗賊）
3. **オープニング** - 村の広場から開始
4. **ターン制進行** - 各キャラクターが順番に行動
5. **GM応答** - ゲームマスターが結果を描写
6. **ストーリー展開** - 物語が進行

## トラブルシューティング

### エラー: ModuleNotFoundError

```bash
pip install -r requirements.txt
```

### エラー: 依存関係の競合

```bash
# 仮想環境を作成
python -m venv venv
source venv/bin/activate  # Linux/Mac
# または
venv\Scripts\activate  # Windows

# 再インストール
pip install -r requirements.txt
```

### モックモードのまま

APIキーが設定されていない可能性があります：

```bash
# 設定を確認
echo $ANTHROPIC_API_KEY
echo $OPENAI_API_KEY

# 設定
export ANTHROPIC_API_KEY="your_key"
```

## カスタマイズ

### ターン数を変更

`main.py`の最後の部分を編集：

```python
game.run_game(max_turns=20)  # デフォルトは10
```

### キャラクターを変更

`main.py`の`create_default_party()`メソッドを編集

### 新しいシナリオを追加

`scenarios/`に新しいファイルを作成

## 次のステップ

- 詳細な使い方: `USAGE.md`を参照
- コードの説明: `README.md`を参照
- シナリオ作成: `scenarios/fantasy_quest.py`を参考に

## サポート

問題が解決しない場合は、以下を確認：
- Python 3.10以上
- インターネット接続（パッケージインストール時）
- APIキーの有効性（AI機能を使う場合）
