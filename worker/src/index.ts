/**
 * Cloudflare Worker Entry Point
 * TRPG GM with LangGraph RAG
 */

import { runRAGFlow, simpleResponse } from './langgraph';
import { insertDocuments, Document } from './vectorize';
import { generateEmbedding, ModelSize } from './ai';

export interface Env {
  AI: any;
  VECTORIZE: any;
}

/**
 * CORS headers
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Handle OPTIONS (CORS preflight)
 */
function handleOptions(): Response {
  return new Response(null, {
    headers: corsHeaders
  });
}

/**
 * Handle /rag endpoint
 */
async function handleRAG(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as {
      message: string;
      model?: ModelSize;
    };

    if (!body.message) {
      return new Response(JSON.stringify({ error: 'message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const model = body.model || '8b';

    // RAGフロー実行
    const result = await runRAGFlow(
      body.message,
      model,
      {
        AI: env.AI,
        VECTORIZE: env.VECTORIZE
      }
    );

    return new Response(JSON.stringify({
      response: result.gmResponse,
      searchQuery: result.searchQuery,
      resultsFound: result.searchResults?.length || 0,
      model
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('RAG endpoint error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle /ingest endpoint
 */
async function handleIngest(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as {
      documents: Document[];
    };

    if (!body.documents || !Array.isArray(body.documents)) {
      return new Response(JSON.stringify({ error: 'documents array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 各ドキュメントの埋め込みベクトルを生成
    const embeddings: number[][] = [];
    for (const doc of body.documents) {
      const embedding = await generateEmbedding(env.AI, doc.text);
      embeddings.push(embedding);
    }

    // Vectorizeに登録
    await insertDocuments(env.VECTORIZE, body.documents, embeddings);

    return new Response(JSON.stringify({
      success: true,
      count: body.documents.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Ingest endpoint error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to ingest documents',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle /health endpoint
 */
function handleHealth(): Response {
  return new Response(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Main request handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    // Route requests
    switch (path) {
      case '/':
        return new Response('TRPG GM Worker is running', {
          headers: corsHeaders
        });

      case '/health':
        return handleHealth();

      case '/rag':
        if (request.method !== 'POST') {
          return new Response('Method not allowed', { status: 405 });
        }
        return handleRAG(request, env);

      case '/ingest':
        if (request.method !== 'POST') {
          return new Response('Method not allowed', { status: 405 });
        }
        return handleIngest(request, env);

      default:
        return new Response('Not found', {
          status: 404,
          headers: corsHeaders
        });
    }
  }
};
