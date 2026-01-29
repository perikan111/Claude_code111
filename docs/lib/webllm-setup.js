/**
 * WebLLM Setup with Microsoft Phi-4
 * ブラウザ内でLLMを実行
 */

import * as webllm from "https://esm.run/@mlc-ai/web-llm";

let engine = null;
let isModelLoaded = false;

const modelCandidates = [
    { id: "Phi-4", label: "Microsoft Phi-4" },
    { id: "Phi-3.5-mini-instruct", label: "Microsoft Phi-3.5 Mini Instruct" },
    { id: "Phi-3-mini-4k-instruct", label: "Microsoft Phi-3 Mini 4K Instruct" }
];

function setModelName(label) {
    const modelName = document.getElementById('model-name');
    if (modelName) {
        modelName.textContent = label;
    }
}

/**
 * 進捗表示の更新
 */
function updateProgress(message, progress = null) {
    const initMessage = document.getElementById('init-message');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    if (initMessage) {
        initMessage.textContent = message;
    }

    if (progress !== null && progressFill && progressText) {
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}%`;
    }
}

/**
 * WebLLMの初期化とPhi-4モデルのロード
 */
export async function initializeWebLLM() {
    try {
        updateProgress('WebLLMエンジンを初期化中...', 0);

        let lastError = null;

        for (const candidate of modelCandidates) {
            try {
                updateProgress(`${candidate.label} を読み込み中...`, 0);

                // WebLLMエンジンの作成
                engine = await webllm.CreateMLCEngine(candidate.id, {
                    initProgressCallback: (progress) => {
                        const percent = progress.progress * 100;
                        updateProgress(progress.text, percent);
                        console.log('Init progress:', progress);
                    }
                });

                setModelName(candidate.label);
                lastError = null;
                break;
            } catch (error) {
                console.warn(`Failed to load model ${candidate.id}:`, error);
                lastError = error;
            }
        }

        if (lastError) {
            throw lastError;
        }

        isModelLoaded = true;
        updateProgress('モデルのロード完了！', 100);

        console.log('WebLLM initialized successfully');

        // UI更新
        setTimeout(() => {
            document.getElementById('initialization').style.display = 'none';
            document.getElementById('chat-container').style.display = 'block';
            document.getElementById('input-area').style.display = 'flex';
            document.getElementById('user-input').disabled = false;
            document.getElementById('send-btn').disabled = false;

            const statusBadge = document.getElementById('model-status');
            statusBadge.textContent = '準備完了';
            statusBadge.classList.remove('loading');
            statusBadge.classList.add('ready');
        }, 500);

        return engine;

    } catch (error) {
        console.error('WebLLM initialization error:', error);
        updateProgress(`エラー: ${error.message}`, 0);

        const statusBadge = document.getElementById('model-status');
        statusBadge.textContent = 'エラー';
        statusBadge.classList.remove('loading');
        statusBadge.classList.add('error');

        throw error;
    }
}

/**
 * テキスト生成
 */
export async function generateText(prompt, options = {}) {
    if (!isModelLoaded || !engine) {
        throw new Error('Model not loaded yet');
    }

    const {
        systemPrompt = '',
        temperature = 0.8,
        maxTokens = 512,
        stopSequences = []
    } = options;

    try {
        const messages = [];

        if (systemPrompt) {
            messages.push({
                role: 'system',
                content: systemPrompt
            });
        }

        messages.push({
            role: 'user',
            content: prompt
        });

        const reply = await engine.chat.completions.create({
            messages,
            temperature,
            max_tokens: maxTokens,
            stop: stopSequences.length > 0 ? stopSequences : undefined
        });

        return reply.choices[0].message.content;

    } catch (error) {
        console.error('Generation error:', error);
        throw error;
    }
}

/**
 * ストリーミング生成
 */
export async function* generateTextStream(prompt, options = {}) {
    if (!isModelLoaded || !engine) {
        throw new Error('Model not loaded yet');
    }

    const {
        systemPrompt = '',
        temperature = 0.8,
        maxTokens = 512
    } = options;

    try {
        const messages = [];

        if (systemPrompt) {
            messages.push({
                role: 'system',
                content: systemPrompt
            });
        }

        messages.push({
            role: 'user',
            content: prompt
        });

        const stream = await engine.chat.completions.create({
            messages,
            temperature,
            max_tokens: maxTokens,
            stream: true
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                yield content;
            }
        }

    } catch (error) {
        console.error('Streaming error:', error);
        throw error;
    }
}

/**
 * メモリ使用量の取得
 */
export function getMemoryUsage() {
    if (performance.memory) {
        const usedMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(0);
        const totalMB = (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(0);
        return `${usedMB} / ${totalMB} MB`;
    }
    return 'N/A';
}

/**
 * モデルの状態確認
 */
export function isReady() {
    return isModelLoaded && engine !== null;
}

// メモリ使用量の定期更新
setInterval(() => {
    const memoryElement = document.getElementById('memory-usage');
    if (memoryElement) {
        memoryElement.textContent = getMemoryUsage();
    }
}, 2000);

// 自動初期化
console.log('Starting WebLLM initialization...');
initializeWebLLM().catch(error => {
    console.error('Failed to initialize WebLLM:', error);
});

// Export for use in other modules
export { engine, isModelLoaded };
