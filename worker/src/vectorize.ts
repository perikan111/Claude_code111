/**
 * Cloudflare Vectorize Integration
 * ドキュメントの保存と検索
 */

export interface VectorizeBindings {
  VECTORIZE: any;
}

export interface Document {
  id: string;
  text: string;
  metadata?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  score: number;
  text?: string;
  metadata?: Record<string, any>;
}

/**
 * ドキュメントをVectorizeに登録
 */
export async function insertDocuments(
  vectorize: any,
  documents: Document[],
  embeddings: number[][]
): Promise<void> {
  const vectors = documents.map((doc, i) => ({
    id: doc.id,
    values: embeddings[i],
    metadata: {
      text: doc.text,
      ...doc.metadata
    }
  }));

  try {
    await vectorize.insert(vectors);
    console.log(`Inserted ${vectors.length} documents`);
  } catch (error) {
    console.error('Vectorize insert error:', error);
    throw new Error(`Failed to insert documents: ${error}`);
  }
}

/**
 * ベクター検索
 */
export async function searchSimilar(
  vectorize: any,
  queryEmbedding: number[],
  topK: number = 3
): Promise<SearchResult[]> {
  try {
    const results = await vectorize.query(queryEmbedding, {
      topK,
      returnMetadata: true
    });

    return results.matches.map((match: any) => ({
      id: match.id,
      score: match.score,
      text: match.metadata?.text,
      metadata: match.metadata
    }));
  } catch (error) {
    console.error('Vectorize search error:', error);
    throw new Error(`Search failed: ${error}`);
  }
}

/**
 * IDでドキュメントを取得
 */
export async function getDocumentById(
  vectorize: any,
  id: string
): Promise<SearchResult | null> {
  try {
    const result = await vectorize.getByIds([id]);
    if (result && result.length > 0) {
      return {
        id: result[0].id,
        score: 1.0,
        text: result[0].metadata?.text,
        metadata: result[0].metadata
      };
    }
    return null;
  } catch (error) {
    console.error('Get document error:', error);
    return null;
  }
}

/**
 * ドキュメントを削除
 */
export async function deleteDocuments(
  vectorize: any,
  ids: string[]
): Promise<void> {
  try {
    await vectorize.deleteByIds(ids);
    console.log(`Deleted ${ids.length} documents`);
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error(`Failed to delete documents: ${error}`);
  }
}
