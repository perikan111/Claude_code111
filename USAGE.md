# Usage Guide

## クイックスタート

### 1. 依存関係のインストール

```bash
pip install -r requirements.txt
```

### 2. APIキーの設定

`.env.example`をコピーして`.env`を作成し、使用するLLMのAPIキーを設定します：

```bash
cp .env.example .env
```

`.env`ファイルを編集：
```
ANTHROPIC_API_KEY=your_api_key_here
```

### 3. ゲームの実行

```bash
python main.py
```

## ゲームの構造

### エージェント

#### Game Master (GM)
- ストーリーの進行役
- プレイヤーの行動に対する結果を生成
- NPCやイベントを管理
- 世界の状態を維持

#### Player
各プレイヤーキャラクターは以下を持ちます：
- 固有の性格
- クラス（戦士、魔法使い、盗賊など）
- 目標とモチベーション
- 記憶システム（過去の出来事を覚えている）

### シナリオ

`scenarios/`ディレクトリに様々なシナリオを配置できます。
現在のサンプル：
- `fantasy_quest.py` - ファンタジー冒険

## カスタマイズ

### 新しいプレイヤーキャラクターの作成

```python
from agents.player import Player

custom_player = Player(
    name="あなたのキャラクター名",
    model=model,
    character_class="クラス名",
    personality="性格の説明",
    goals=["目標1", "目標2"]
)
```

### 新しいシナリオの作成

1. `scenarios/`ディレクトリに新しいPythonファイルを作成
2. シナリオクラスを定義（`fantasy_quest.py`を参考に）
3. `main.py`で新しいシナリオをインポート

```python
from scenarios.your_scenario import YourScenario

# setup_game()内で
self.scenario = YourScenario()
```

### ゲームルールのカスタマイズ

`main.py`の`TRPGGame`クラスを編集：

- `run_game(max_turns)` - ターン数の変更
- `check_game_state()` - 勝利/敗北条件の追加
- `player_turn()` - ターンの流れを変更

## 高度な使い方

### 対話型モードの追加

プレイヤーの行動を手動で入力できるようにする：

```python
def player_turn(self, player: Player):
    # ユーザー入力を受け取る
    action = input(f"{player.name}, what do you do? ")

    # GMが処理
    result = self.gm.process_action(
        player_name=player.name,
        action=action,
        game_context=self.game_state
    )
    print(f"GM: {result}")
```

### NPCの追加

```python
# GMを通じてNPCを導入
npc_description = self.gm.introduce_npc(
    npc_name="新しいNPC",
    context="現在の状況"
)
```

### 戦闘システムの追加

`agents/combat.py`を作成し、戦闘ロジックを実装：

```python
class CombatSystem:
    def resolve_attack(self, attacker, defender):
        # 攻撃の解決
        pass

    def calculate_damage(self, attacker_stats):
        # ダメージ計算
        pass
```

## トラブルシューティング

### APIキーエラー

```
WARNING: Using mock language model
```

→ `.env`ファイルでAPIキーを正しく設定してください

### メモリエラー

長時間のゲームセッションでメモリが不足する場合：
- ターン数を制限する
- 定期的にメモリをクリアする機能を追加

### レスポンスが遅い

- より高速なLLMモデルを使用
- `max_tokens`を減らす
- プロンプトを簡潔にする

## 次のステップ

1. 独自のシナリオを作成
2. より多くのプレイヤークラスを追加
3. スキルや魔法システムを実装
4. セーブ/ロード機能を追加
5. Webインターフェースを構築

詳しくは`README.md`を参照してください。
