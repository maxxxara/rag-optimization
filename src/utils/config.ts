import {
  GoogleGenerativeAIEmbeddings,
  ChatGoogleGenerativeAI,
} from "@langchain/google-genai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import {
  MongoClient,
  Collection,
  Db,
  Document as MongoDocument,
} from "mongodb";
import crypto from "crypto";

const MONGODB_ATLAS_URI = process.env.MONGODB_ATLAS_URI;
const MONGODB_ATLAS_DB_NAME = process.env.MONGODB_ATLAS_DB_NAME;
const MONGODB_ATLAS_COLLECTION_NAME = "data";

export const create_embedding_model = () => {
  return new GoogleGenerativeAIEmbeddings({
    modelName: "gemini-embedding-exp-03-07",
    apiKey: process.env.GOOGLE_API_KEY,
  });
};
export const create_llm = ({
  modelName = "gemini-2.5-flash",
  temperature = 0,
}: {
  modelName?: string;
  temperature?: number;
} = {}) => {
  return new ChatGoogleGenerativeAI({
    model: modelName,
    temperature: temperature,
    apiKey: process.env.GOOGLE_API_KEY,
  });
};

export const create_vector_store = () => {
  const embeddingModel = create_embedding_model();
  const client = new MongoClient(MONGODB_ATLAS_URI || "");
  const collection = client
    .db(MONGODB_ATLAS_DB_NAME)
    .collection(MONGODB_ATLAS_COLLECTION_NAME);

  return new MongoDBAtlasVectorSearch(embeddingModel, {
    collection: collection,
    indexName: "vector_index",
    textKey: "data",
    embeddingKey: "embedded_data",
  });
};

export const create_hash = (content: string) => {
  return crypto.createHash("md5").update(content).digest("hex");
};

export const get_mongodb_instance = (): Collection<MongoDocument> => {
  const client = new MongoClient(MONGODB_ATLAS_URI || "");
  const db = client.db(MONGODB_ATLAS_DB_NAME);
  const executor = db.collection(MONGODB_ATLAS_COLLECTION_NAME);
  return executor;
};
