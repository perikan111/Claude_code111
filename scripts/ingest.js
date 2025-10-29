/**
 * ドキュメント登録スクリプト
 * data/フォルダのMarkdownファイルをVectorizeに登録
 */

const fs = require('fs');
const path = require('path');

// Cloudflare WorkerのURL（環境変数または直接指定）
const WORKER_URL = process.env.WORKER_URL || 'http://localhost:8787';

/**
 * Markdownファイルをチャンクに分割
 */
function splitMarkdown(content, filename) {
  const chunks = [];
  const lines = content.split('\n');

  let currentChunk = '';
  let currentTitle = '';
  let chunkId = 0;

  for (const line of lines) {
    // 見出しを検出
    if (line.startsWith('#')) {
      // 前のチャンクを保存
      if (currentChunk.trim()) {
        chunks.push({
          id: `${filename}-${chunkId}`,
          text: currentChunk.trim(),
          metadata: {
            file: filename,
            title: currentTitle,
            type: 'document'
          }
        });
        chunkId++;
      }

      // 新しいチャンク開始
      currentTitle = line.replace(/^#+\s*/, '');
      currentChunk = line + '\n';
    } else {
      currentChunk += line + '\n';

      // チャンクサイズ制限（約500文字）
      if (currentChunk.length > 500 && line.trim() === '') {
        chunks.push({
          id: `${filename}-${chunkId}`,
          text: currentChunk.trim(),
          metadata: {
            file: filename,
            title: currentTitle,
            type: 'document'
          }
        });
        chunkId++;
        currentChunk = '';
      }
    }
  }

  // 最後のチャンク
  if (currentChunk.trim()) {
    chunks.push({
      id: `${filename}-${chunkId}`,
      text: currentChunk.trim(),
      metadata: {
        file: filename,
        title: currentTitle,
        type: 'document'
      }
    });
  }

  return chunks;
}

/**
 * Vectorizeに登録
 */
async function ingestDocuments(documents) {
  console.log(`Sending ${documents.length} documents to Vectorize...`);

  try {
    const response = await fetch(`${WORKER_URL}/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ documents })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    console.log('Success:', result);
    return result;
  } catch (error) {
    console.error('Failed to ingest documents:', error);
    throw error;
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('=== TRPG Document Ingestion ===\n');

  const dataDir = path.join(__dirname, '..', 'data');
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.md'));

  console.log(`Found ${files.length} markdown files:\n`);

  const allDocuments = [];

  for (const file of files) {
    console.log(`Processing: ${file}`);

    const filepath = path.join(dataDir, file);
    const content = fs.readFileSync(filepath, 'utf-8');

    const chunks = splitMarkdown(content, file);
    console.log(`  - Created ${chunks.length} chunks`);

    allDocuments.push(...chunks);
  }

  console.log(`\nTotal documents: ${allDocuments.length}`);
  console.log('\nIngesting to Vectorize...\n');

  // バッチサイズ（一度に送る数）
  const BATCH_SIZE = 10;

  for (let i = 0; i < allDocuments.length; i += BATCH_SIZE) {
    const batch = allDocuments.slice(i, i + BATCH_SIZE);
    console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} documents`);

    await ingestDocuments(batch);

    // レート制限対策（少し待つ）
    if (i + BATCH_SIZE < allDocuments.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n=== Ingestion Complete ===');
}

// 実行
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { splitMarkdown, ingestDocuments };
