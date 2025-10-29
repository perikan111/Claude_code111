/**
 * Browser-based Vector Store
 * シンプルなコサイン類似度検索を実装
 */

class VectorStore {
    constructor() {
        this.documents = [];
        this.embeddings = [];
    }

    /**
     * ドキュメントを追加
     */
    addDocuments(docs, embeddings) {
        this.documents.push(...docs);
        this.embeddings.push(...embeddings);
    }

    /**
     * コサイン類似度の計算
     */
    cosineSimilarity(vecA, vecB) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * 類似検索
     */
    search(queryEmbedding, topK = 3) {
        const similarities = this.embeddings.map((embedding, index) => ({
            index,
            similarity: this.cosineSimilarity(queryEmbedding, embedding),
            document: this.documents[index]
        }));

        // 類似度でソート
        similarities.sort((a, b) => b.similarity - a.similarity);

        // 上位K件を返す
        return similarities.slice(0, topK);
    }

    /**
     * ストアのサイズ
     */
    size() {
        return this.documents.length;
    }

    /**
     * ストアをクリア
     */
    clear() {
        this.documents = [];
        this.embeddings = [];
    }
}

/**
 * シンプルな埋め込み生成（TF-IDFベース）
 * 本格的にはTransformers.jsを使用するが、ここでは簡易実装
 */
class SimpleEmbedder {
    constructor() {
        this.vocabulary = new Map();
        this.idf = new Map();
        this.dimension = 384; // 埋め込み次元数
    }

    /**
     * テキストをトークン化
     */
    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(token => token.length > 0);
    }

    /**
     * 語彙を構築
     */
    buildVocabulary(documents) {
        const docFreq = new Map();

        documents.forEach(doc => {
            const tokens = new Set(this.tokenize(doc));
            tokens.forEach(token => {
                docFreq.set(token, (docFreq.get(token) || 0) + 1);
            });
        });

        // IDF計算
        const numDocs = documents.length;
        let vocabIndex = 0;

        docFreq.forEach((freq, token) => {
            this.vocabulary.set(token, vocabIndex++);
            this.idf.set(token, Math.log(numDocs / freq));
        });

        console.log(`Vocabulary built: ${this.vocabulary.size} unique tokens`);
    }

    /**
     * TF-IDF埋め込みの生成
     */
    embed(text) {
        const tokens = this.tokenize(text);
        const tf = new Map();

        // TF計算
        tokens.forEach(token => {
            tf.set(token, (tf.get(token) || 0) + 1);
        });

        // 正規化
        const totalTokens = tokens.length;
        tf.forEach((count, token) => {
            tf.set(token, count / totalTokens);
        });

        // TF-IDFベクトル生成
        const vector = new Array(this.dimension).fill(0);

        tf.forEach((tfValue, token) => {
            if (this.vocabulary.has(token)) {
                const index = this.vocabulary.get(token) % this.dimension;
                const idfValue = this.idf.get(token) || 0;
                vector[index] += tfValue * idfValue;
            }
        });

        // L2正規化
        const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        if (norm > 0) {
            for (let i = 0; i < vector.length; i++) {
                vector[i] /= norm;
            }
        }

        return vector;
    }

    /**
     * 複数ドキュメントの埋め込み生成
     */
    embedDocuments(documents) {
        // まず語彙を構築
        this.buildVocabulary(documents);

        // 各ドキュメントを埋め込み
        return documents.map(doc => this.embed(doc));
    }
}

export { VectorStore, SimpleEmbedder };
