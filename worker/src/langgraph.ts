/**
 * LangGraph RAG Flow
 * 検索 → 要約 → 応答生成のフロー
 */

import { generateSearchQuery, summarizeContext, generateGMResponse, generateEmbedding, ModelSize } from './ai';
import { searchSimilar, SearchResult } from './vectorize';

export interface RAGState {
  userInput: string;
  searchQuery?: string;
  searchResults?: SearchResult[];
  contextSummary?: string;
  gmResponse?: string;
  model: ModelSize;
}

export interface RAGFlowBindings {
  AI: any;
  VECTORIZE: any;
}

/**
 * ステップ1: 検索クエリ生成
 */
async function generateQuery(
  state: RAGState,
  bindings: RAGFlowBindings
): Promise<RAGState> {
  console.log('Step 1: Generating search query');

  const searchQuery = await generateSearchQuery(
    bindings.AI,
    state.userInput
  );

  return {
    ...state,
    searchQuery: searchQuery.trim()
  };
}

/**
 * ステップ2: ベクター検索
 */
async function performSearch(
  state: RAGState,
  bindings: RAGFlowBindings
): Promise<RAGState> {
  console.log('Step 2: Performing vector search');

  if (!state.searchQuery) {
    throw new Error('Search query not generated');
  }

  // 検索クエリを埋め込みベクトルに変換
  const queryEmbedding = await generateEmbedding(
    bindings.AI,
    state.searchQuery
  );

  // Vectorizeで検索
  const searchResults = await searchSimilar(
    bindings.VECTORIZE,
    queryEmbedding,
    3 // top 3 results
  );

  console.log(`Found ${searchResults.length} results`);

  return {
    ...state,
    searchResults
  };
}

/**
 * ステップ3: 文脈要約
 */
async function summarize(
  state: RAGState,
  bindings: RAGFlowBindings
): Promise<RAGState> {
  console.log('Step 3: Summarizing context');

  if (!state.searchResults) {
    throw new Error('Search results not available');
  }

  const resultTexts = state.searchResults
    .filter(r => r.text)
    .map(r => r.text!);

  const contextSummary = await summarizeContext(
    bindings.AI,
    resultTexts
  );

  return {
    ...state,
    contextSummary
  };
}

/**
 * ステップ4: GM応答生成
 */
async function generateResponse(
  state: RAGState,
  bindings: RAGFlowBindings
): Promise<RAGState> {
  console.log('Step 4: Generating GM response');

  if (!state.contextSummary) {
    throw new Error('Context summary not available');
  }

  const gmResponse = await generateGMResponse(
    bindings.AI,
    state.userInput,
    state.contextSummary,
    state.model
  );

  return {
    ...state,
    gmResponse
  };
}

/**
 * RAGフロー全体の実行
 */
export async function runRAGFlow(
  userInput: string,
  model: ModelSize,
  bindings: RAGFlowBindings
): Promise<RAGState> {
  console.log('=== Starting RAG Flow ===');
  console.log('User Input:', userInput);
  console.log('Model:', model);

  // 初期状態
  let state: RAGState = {
    userInput,
    model
  };

  try {
    // Step 1: 検索クエリ生成
    state = await generateQuery(state, bindings);
    console.log('Search Query:', state.searchQuery);

    // Step 2: ベクター検索
    state = await performSearch(state, bindings);
    console.log('Search Results:', state.searchResults?.length);

    // Step 3: 文脈要約
    state = await summarize(state, bindings);
    console.log('Context Summary:', state.contextSummary);

    // Step 4: GM応答生成
    state = await generateResponse(state, bindings);
    console.log('GM Response:', state.gmResponse);

    console.log('=== RAG Flow Complete ===');

    return state;
  } catch (error) {
    console.error('RAG Flow Error:', error);
    throw error;
  }
}

/**
 * シンプルな応答生成（検索なし）
 */
export async function simpleResponse(
  userInput: string,
  model: ModelSize,
  ai: any
): Promise<string> {
  console.log('Generating simple response (no RAG)');

  return await generateGMResponse(
    ai,
    userInput,
    '（設定資料から関連情報が見つかりませんでした。一般的な知識で応答します）',
    model
  );
}
