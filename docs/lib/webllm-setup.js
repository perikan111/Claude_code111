/**
 * WebLLM Setup with Microsoft Phi-4
 * ブラウザ内でLLMを実行
 */

import * as webllm from "https://esm.run/@mlc-ai/web-llm";

let engine = null;
let isModelLoaded = false;

// モデル設定
const MODEL_CONFIG = {
    // 優先度順で試行
    models: [
        {
            id: "Phi-4-mini-instruct-q4f16_1-MLC",
            name: "Phi-4",
            description: "Microsoft Phi-4 Mini (最新)"
        },
        {
            id: "Phi-3.5-mini-instruct-q4f16_1-MLC",
            name: "Phi-3.5",
            description: "Microsoft Phi-3.5 Mini (フォールバック)"
        }
    ]
};

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
 * WebLLMの初期化とPhi-4モデルのロード（フォールバック付き）
 */
export async function initializeWebLLM() {
    let lastError = null;

    // 優先度順にモデルを試行
    for (const modelConfig of MODEL_CONFIG.models) {
        try {
            console.log(`Trying to load model: ${modelConfig.id} (${modelConfig.name})`);
            updateProgress(`${modelConfig.name}モデルを読み込み中...`, 0);

            // WebLLMエンジンの作成
            engine = await webllm.CreateMLCEngine(
                modelConfig.id,
                {
                    initProgressCallback: (progress) => {
                        const percent = progress.progress * 100;
                        updateProgress(progress.text, percent);
                        console.log('Init progress:', progress);
                    }
                }
            );

            // 成功した場合
            isModelLoaded = true;
            updateProgress('モデルのロード完了！', 100);
            console.log(`WebLLM initialized successfully with ${modelConfig.name}`);

            // モデル名をUIに反映
            const modelNameElement = document.getElementById('model-name');
            if (modelNameElement) {
                modelNameElement.textContent = `Microsoft ${modelConfig.name}`;
            }

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
            // このモデルの読み込みに失敗
            console.warn(`Failed to load ${modelConfig.name}:`, error.message);
            lastError = error;

            // 次のモデルを試す（forループ継続）
            if (modelConfig !== MODEL_CONFIG.models[MODEL_CONFIG.models.length - 1]) {
                console.log(`Trying fallback model...`);
                continue;
            }
        }
    }

    // すべてのモデルで失敗した場合
    console.error('All models failed to load');
    updateProgress(`エラー: すべてのモデルの読み込みに失敗しました`, 0);

    const statusBadge = document.getElementById('model-status');
    statusBadge.textContent = 'エラー';
    statusBadge.classList.remove('loading');
    statusBadge.classList.add('error');

    throw lastError || new Error('Failed to load any model');
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
