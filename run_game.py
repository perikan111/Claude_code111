#!/usr/bin/env python3
"""
簡易実行スクリプト - TRPGゲームのデモ版

このスクリプトはConcordiaの完全な実装なしでゲームの流れをデモします。
実際のAI機能を使うには、APIキーの設定が必要です。
"""

import os
import sys

def check_dependencies():
    """依存関係をチェック"""
    print("依存関係をチェック中...")
    try:
        import concordia
        print("✓ Concordia インストール済み")
    except ImportError:
        print("✗ Concordia が見つかりません")
        print("  インストール: pip install gdm-concordia")
        return False

    try:
        import anthropic
        print("✓ Anthropic SDK インストール済み")
    except ImportError:
        print("⚠ Anthropic SDK が見つかりません（オプション）")

    try:
        import openai
        print("✓ OpenAI SDK インストール済み")
    except ImportError:
        print("⚠ OpenAI SDK が見つかりません（オプション）")

    return True

def check_api_keys():
    """APIキーをチェック"""
    print("\nAPIキーをチェック中...")
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")

    if anthropic_key:
        print(f"✓ ANTHROPIC_API_KEY 設定済み ({anthropic_key[:8]}...)")
        return "anthropic"
    elif openai_key:
        print(f"✓ OPENAI_API_KEY 設定済み ({openai_key[:8]}...)")
        return "openai"
    else:
        print("⚠ APIキーが設定されていません")
        print("  モックモードで実行します（AI機能は制限されます）")
        print("\n実際のAIを使用するには:")
        print("  1. .env.example をコピーして .env を作成")
        print("  2. APIキーを設定")
        print("  3. 環境変数を読み込み: source .env または export ANTHROPIC_API_KEY=...")
        return None

def main():
    """メイン実行"""
    print("=" * 60)
    print("TRPG with Google Concordia - 実行チェック")
    print("=" * 60)
    print()

    # 依存関係チェック
    if not check_dependencies():
        print("\n依存関係が不足しています。以下を実行してください:")
        print("pip install -r requirements.txt")
        return 1

    # APIキーチェック
    api_type = check_api_keys()

    print("\n" + "=" * 60)
    print("ゲームを起動します...")
    print("=" * 60)
    print()

    # メインゲームを実行
    try:
        from main import main as game_main
        game_main()
    except Exception as e:
        print(f"\nエラーが発生しました: {e}")
        print("\nトラブルシューティング:")
        print("1. 依存関係を再インストール: pip install -r requirements.txt")
        print("2. Pythonバージョンを確認: python --version (3.10以上推奨)")
        print("3. エラーの詳細:")
        import traceback
        traceback.print_exc()
        return 1

    return 0

if __name__ == "__main__":
    sys.exit(main())
