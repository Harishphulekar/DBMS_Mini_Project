import { QdrantClient } from "@qdrant/js-client-rest";

const url = process.env.QDRANT_URL;
const apiKey = process.env.QDRANT_API_KEY;

if (!url || !apiKey) {
  throw new Error(
    "Qdrant configuration is missing. Check QDRANT_URL and QDRANT_API_KEY in .env.local."
  );
}

const qdrantClient = new QdrantClient({
  url,
  apiKey,
});

export default qdrantClient;