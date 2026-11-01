
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

async function createPriceIndex() {
  try {
    const result = await client.createPayloadIndex(
      "product_embeddings",
      {
        field_name: "price",
        field_schema: "float",
        wait: true,
      }
    );

    console.log("Price index created successfully!");
    console.log(result);
  } catch (error) {
    console.error("Failed to create price index:", error);
    process.exitCode = 1;
  }
}

createPriceIndex();
