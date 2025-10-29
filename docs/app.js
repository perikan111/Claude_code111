/**
 * Main Application
 * TRPG GM with WebLLM + Browser-based RAG
 */

import { generateText, generateTextStream, isReady } from './lib/webllm-setup.js';
import { VectorStore, SimpleEmbedder } from './lib/vectorstore.js';
import { trpgDocuments, getAllDocumentTexts } from './data/documents.js';

// グローバル状態
let vectorStore = null;
let embedder = null;
let isInitialized = false;
let isGenerating = false;

// DOM要素
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

/**
 * ベクターストアの初期化
 */
async function initializeVectorStore() {
    console.log('Initializing vector store...');

    // Embedderの作成
    embedder = new SimpleEmbedder();

    // ドキュメントテキストの取得
    const documentTexts = getAllDocumentTexts();

    // 埋め込みの生成
    console.log(`Generating embeddings for ${documentTexts.length} documents...`);
    const embeddings = embedder.embedDocuments(documentTexts);

    // VectorStoreの作成
    vectorStore = new VectorStore();
    vectorStore.addDocuments(trpgDocuments, embeddings);

    console.log(`Vector store initialized with ${vectorStore.size()} documents`);
    isInitialized = true;
}

/**
 * RAG処理：関連ドキュメントの検索
 */
function searchRelevantDocuments(query, topK = 3) {
    if (!vectorStore || !embedder) {
        console.warn('Vector store not initialized');
        return [];
    }

    // クエリを埋め込みベクトルに変換
    const queryEmbedding = embedder.embed(query);

    // 類似検索
    const results = vectorStore.search(queryEmbedding, topK);

    console.log('Search results:', results.map(r => ({
        text: r.document.text.substring(0, 50) + '...',
        similarity: r.similarity.toFixed(3)
    })));

    return results;
}

/**
 * GM応答の生成
 */
async function generateGMResponse(userMessage) {
    // 1. 関連ドキュメントの検索
    const searchResults = searchRelevantDocuments(userMessage, 3);

    // 2. コンテキストの構築
    let context = '';
    if (searchResults.length > 0) {
        context = '【参照情報】\n';
        searchResults.forEach((result, index) => {
            context += `${index + 1}. ${result.document.text}\n`;
        });
        context += '\n';
    }

    // 3. システムプロンプト
    const systemPrompt = `あなたは経験豊富なTRPGのゲームマスター（GM）です。

【役割】
- プレイヤーの行動に対して、世界がどう反応するかを描写する
- 雰囲気のある自然な文章で語る
- 選択肢を提示したり、状況を詳しく説明する
- ルールや設定に基づいて一貫性のある進行をする

【注意点】
- プレイヤーの代わりに行動を決定しない
- 過度に詳しい説明は避け、適度な長さを保つ（2〜3段落）
- 臨場感のある描写を心がける
- 提供された参照情報を活用する`;

    // 4. ユーザープロンプト
    const userPrompt = `${context}【プレイヤーの行動】
${userMessage}

【GMとしての応答】`;

    // 5. LLMで生成
    try {
        const response = await generateText(userPrompt, {
            systemPrompt,
            temperature: 0.8,
            maxTokens: 400
        });

        return response;
    } catch (error) {
        console.error('Generation error:', error);
        throw error;
    }
}

/**
 * メッセージを追加
 */
function addMessage(type, content, streaming = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';

    const speaker = document.createElement('span');
    speaker.className = 'speaker';
    speaker.textContent = type === 'gm' ? '🎭 GM' : '⚔️ プレイヤー';

    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.textContent = new Date().toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
    });

    headerDiv.appendChild(speaker);
    headerDiv.appendChild(timestamp);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (streaming) {
        // ストリーミング用の空のコンテナ
        contentDiv.id = 'streaming-content';
    } else {
        // 段落に分割
        const paragraphs = content.split('\n').filter(p => p.trim());
        paragraphs.forEach(paragraph => {
            const p = document.createElement('p');
            p.textContent = paragraph;
            contentDiv.appendChild(p);
        });
    }

    messageDiv.appendChild(headerDiv);
    messageDiv.appendChild(contentDiv);

    chatContainer.appendChild(messageDiv);

    // スクロール
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return contentDiv;
}

/**
 * ローディングインジケーターを表示
 */
function showLoadingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message gm';
    messageDiv.id = 'loading-indicator';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';

    const speaker = document.createElement('span');
    speaker.className = 'speaker';
    speaker.textContent = '🎭 GM';

    headerDiv.appendChild(speaker);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content loading';

    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';

    const text = document.createElement('span');
    text.textContent = '考え中...';

    contentDiv.appendChild(typingIndicator);
    contentDiv.appendChild(text);

    messageDiv.appendChild(headerDiv);
    messageDiv.appendChild(contentDiv);

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

/**
 * ローディングインジケーターを削除
 */
function removeLoadingIndicator() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * メッセージ送信処理
 */
async function handleSend() {
    const message = userInput.value.trim();

    if (!message || isGenerating) {
        return;
    }

    if (!isReady()) {
        alert('モデルがまだロードされていません。しばらくお待ちください。');
        return;
    }

    if (!isInitialized) {
        alert('ベクターストアを初期化中です。しばらくお待ちください。');
        return;
    }

    // プレイヤーメッセージを表示
    addMessage('player', message);

    // 入力欄をクリア
    userInput.value = '';

    // ローディング開始
    isGenerating = true;
    sendBtn.disabled = true;
    userInput.disabled = true;
    showLoadingIndicator();

    try {
        // GM応答を生成
        const response = await generateGMResponse(message);

        // ローディング終了
        removeLoadingIndicator();

        // GM応答を表示
        addMessage('gm', response);

    } catch (error) {
        console.error('Error generating response:', error);
        removeLoadingIndicator();

        // エラーメッセージを表示
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message gm';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content error-message';

        const p = document.createElement('p');
        p.textContent = `エラーが発生しました: ${error.message}`;
        contentDiv.appendChild(p);

        const p2 = document.createElement('p');
        p2.textContent = 'もう一度お試しください。';
        contentDiv.appendChild(p2);

        errorDiv.appendChild(contentDiv);
        chatContainer.appendChild(errorDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    } finally {
        isGenerating = false;
        sendBtn.disabled = false;
        userInput.disabled = false;
        userInput.focus();
    }
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
    // 送信ボタン
    sendBtn.addEventListener('click', handleSend);

    // Enterキー（Shift+Enterは改行）
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
}

/**
 * 初期化
 */
async function initialize() {
    console.log('Initializing TRPG GM application...');

    // イベントリスナー設定
    setupEventListeners();

    // ベクターストアの初期化
    await initializeVectorStore();

    console.log('Application initialized successfully');
}

// アプリケーション起動
initialize().catch(error => {
    console.error('Failed to initialize application:', error);
});

// デバッグ用のグローバルエクスポート
window.trpgGM = {
    searchRelevantDocuments,
    vectorStore,
    embedder,
    isInitialized: () => isInitialized
};
