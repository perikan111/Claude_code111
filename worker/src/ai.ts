/**
 * Workers AI Integration
 * Llama 3.1モデルを使った推論
 */

export interface AIBindings {
  AI: any;
}

export type ModelSize = '8b' | '70b';

export const MODELS = {
  '8b': '@cf/meta/llama-3.1-8b-instruct',
  '70b': '@cf/meta/llama-3.1-70b-instruct'
} as const;

export interface GenerateOptions {
  prompt: string;
  model?: ModelSize;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

/**
 * Workers AIでテキスト生成
 */
export async function generateText(
  ai: any,
  options: GenerateOptions
): Promise<string> {
  const {
    prompt,
    model = '8b',
    maxTokens = 512,
    temperature = 0.7,
    systemPrompt
  } = options;

  const modelName = MODELS[model];

  const messages: any[] = [];

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

  try {
    const response = await ai.run(modelName, {
      messages,
      max_tokens: maxTokens,
      temperature
    });

    return response.response || '';
  } catch (error) {
    console.error('AI generation error:', error);
    throw new Error(`AI generation failed: ${error}`);
  }
}

/**
 * 検索クエリの生成
 */
export async function generateSearchQuery(
  ai: any,
  userInput: string
): Promise<string> {
  const systemPrompt = `あなたはTRPGの設定資料から情報を検索するためのクエリを生成するアシスタントです。
ユーザーの発言から、検索に適したキーワードを抽出してください。`;

  const prompt = `以下のプレイヤーの発言から、TRPG設定資料を検索するためのキーワードを抽出してください。
キーワードのみを返してください（説明不要）。

プレイヤーの発言：「${userInput}」

検索キーワード：`;

  return generateText(ai, {
    prompt,
    systemPrompt,
    model: '8b',
    maxTokens: 50,
    temperature: 0.3
  });
}

/**
 * 検索結果の要約
 */
export async function summarizeContext(
  ai: any,
  searchResults: string[]
): Promise<string> {
  if (searchResults.length === 0) {
    return '関連する情報が見つかりませんでした。';
  }

  const systemPrompt = `あなたはTRPGのゲームマスター向けに情報を整理するアシスタントです。
検索結果から重要な情報を簡潔にまとめてください。`;

  const prompt = `以下の検索結果から、GMが参照しやすいように重要な情報をまとめてください。

検索結果：
${searchResults.map((r, i) => `${i + 1}. ${r}`).join('\n')}

要約（GMメモ形式）：`;

  return generateText(ai, {
    prompt,
    systemPrompt,
    model: '8b',
    maxTokens: 200,
    temperature: 0.5
  });
}

/**
 * GMとしての応答生成
 */
export async function generateGMResponse(
  ai: any,
  userInput: string,
  context: string,
  model: ModelSize = '8b'
): Promise<string> {
  const systemPrompt = `あなたは経験豊富なTRPGのゲームマスター（GM）です。

役割：
- プレイヤーの行動に対して、世界がどう反応するかを描写する
- 雰囲気のある自然な文章で語る
- 選択肢を提示したり、状況を詳しく説明する
- ルールや設定に基づいて一貫性のある進行をする

注意点：
- プレイヤーの代わりに行動を決定しない
- 過度に詳しい説明は避け、適度な長さを保つ
- 臨場感のある描写を心がける`;

  const prompt = `【参照情報】
${context}

【プレイヤーの行動】
${userInput}

【GMとしての応答】`;

  return generateText(ai, {
    prompt,
    systemPrompt,
    model,
    maxTokens: 400,
    temperature: 0.8
  });
}

/**
 * テキストの埋め込みベクトル生成
 */
export async function generateEmbedding(
  ai: any,
  text: string
): Promise<number[]> {
  try {
    const response = await ai.run('@cf/baai/bge-base-en-v1.5', {
      text: [text]
    });

    return response.data[0];
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw new Error(`Embedding generation failed: ${error}`);
  }
}
