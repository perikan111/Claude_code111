/**
 * TRPG GM Frontend
 * Cloudflare Workerと通信してチャットを実現
 */

// Cloudflare WorkerのURL（デプロイ後に更新してください）
const WORKER_URL = 'http://localhost:8787'; // ローカル開発用
// const WORKER_URL = 'https://your-worker.your-subdomain.workers.dev'; // 本番用

// 状態管理
let currentModel = '8b';
let isLoading = false;

// DOM要素
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const model8bBtn = document.getElementById('model-8b');
const model70bBtn = document.getElementById('model-70b');

/**
 * 初期化
 */
function init() {
    // イベントリスナー
    sendBtn.addEventListener('click', handleSend);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    model8bBtn.addEventListener('click', () => switchModel('8b'));
    model70bBtn.addEventListener('click', () => switchModel('70b'));

    // Worker接続テスト
    testConnection();
}

/**
 * モデル切替
 */
function switchModel(model) {
    currentModel = model;

    // UIの更新
    document.querySelectorAll('.model-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    if (model === '8b') {
        model8bBtn.classList.add('active');
    } else {
        model70bBtn.classList.add('active');
    }

    updateStatus(`モデル: ${model.toUpperCase()}`);
}

/**
 * Worker接続テスト
 */
async function testConnection() {
    try {
        const response = await fetch(`${WORKER_URL}/health`);
        if (response.ok) {
            updateStatus('準備完了', 'ready');
        } else {
            updateStatus('Worker接続エラー', 'error');
        }
    } catch (error) {
        console.error('Connection test failed:', error);
        updateStatus('オフライン（Workerを起動してください）', 'error');
    }
}

/**
 * メッセージ送信処理
 */
async function handleSend() {
    const message = userInput.value.trim();

    if (!message || isLoading) {
        return;
    }

    // プレイヤーメッセージを表示
    addMessage('player', message);

    // 入力欄をクリア
    userInput.value = '';

    // ローディング開始
    setLoading(true);

    try {
        // Workerにリクエスト
        const response = await fetch(`${WORKER_URL}/rag`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                model: currentModel
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // GMの応答を表示
        addMessage('gm', data.response);

        // デバッグ情報
        console.log('Search Query:', data.searchQuery);
        console.log('Results Found:', data.resultsFound);

    } catch (error) {
        console.error('Request failed:', error);
        addMessage('error', `エラーが発生しました: ${error.message}`);
        updateStatus('エラー', 'error');
    } finally {
        setLoading(false);
    }
}

/**
 * メッセージを追加
 */
function addMessage(type, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';

    const speaker = document.createElement('span');
    speaker.className = 'speaker';

    if (type === 'gm') {
        speaker.textContent = '🎭 GM';
    } else if (type === 'player') {
        speaker.textContent = '⚔️ プレイヤー';
    } else {
        speaker.textContent = '⚠️ システム';
    }

    headerDiv.appendChild(speaker);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (type === 'error') {
        contentDiv.classList.add('error-message');
    }

    // 段落に分割
    const paragraphs = content.split('\n').filter(p => p.trim());
    paragraphs.forEach(paragraph => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        contentDiv.appendChild(p);
    });

    messageDiv.appendChild(headerDiv);
    messageDiv.appendChild(contentDiv);

    chatContainer.appendChild(messageDiv);

    // スクロール
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

/**
 * ローディング状態の設定
 */
function setLoading(loading) {
    isLoading = loading;
    sendBtn.disabled = loading;

    if (loading) {
        statusIndicator.classList.add('loading');
        updateStatus('応答生成中...');
    } else {
        statusIndicator.classList.remove('loading');
        updateStatus('準備完了');
    }
}

/**
 * ステータス更新
 */
function updateStatus(text, state = 'ready') {
    statusText.textContent = text;

    if (state === 'error') {
        statusIndicator.style.color = 'var(--error-color)';
    } else if (state === 'ready') {
        statusIndicator.style.color = 'var(--player-color)';
    } else {
        statusIndicator.style.color = 'var(--accent-color)';
    }
}

// 初期化実行
init();
