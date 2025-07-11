import {
  create_hash,
  create_vector_store,
  get_mongodb_instance,
} from "../utils/config";
import type { Document } from "@langchain/core/documents";
import {
  RecursiveCharacterTextSplitter,
  MarkdownTextSplitter,
} from "@langchain/textsplitters";
import fs from "fs";

interface Chunk {
  content: string;
  hash: string;
}

const FILE_PATHS = ["./docs/data.md"];

const read_and_chunk_document = async () => {
  const chunks: Chunk[] = [];
  for (const FILE_PATH of FILE_PATHS) {
    const document = fs.readFileSync(FILE_PATH, "utf8");
    const hierarchicalSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 150,
      separators: ["\n\n## ", "\n\n### ", "\n\n", "\n", " ", ""],
    });
    const hierarchicalChunks = await hierarchicalSplitter.splitText(document);
    const db = get_mongodb_instance();
    for (const chunk of hierarchicalChunks) {
      const hash = create_hash(chunk);
      const existing = await db.findOne({ hash });
      if (existing) {
        console.log("Existing");
        continue;
      }
      console.log("Updated");
      chunks.push({
        content: chunk,
        hash,
      });
    }
  }
  return chunks;
};

async function main() {
  const vectorStore = create_vector_store();
  const chunks = await read_and_chunk_document();
  const documents: Document[] = chunks.map((chunk) => ({
    pageContent: chunk.content,
    metadata: {
      source: "data",
      hash: chunk.hash,
    },
  }));
  const ids = documents.map((_, index) => index.toString());
  try {
    await vectorStore.addDocuments(documents, { ids });
    console.log(`Updated ${documents.length} chunks`);
    process.exit(0);
  } catch (error) {
    console.error("Error: ", error);
    process.exit(1);
  }
}

main();
