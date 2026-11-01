
import { NextRequest, NextResponse } from "next/server";
import qdrantClient from "@/lib/qdrant";

const COLLECTION_NAME = "product_embeddings";
const MODEL_NAME = "sentence-transformers/all-minilm-l6-v2";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const queryText =
      typeof body.query === "string" ? body.query.trim() : "";

    if (!queryText) {
      return NextResponse.json(
        { success: false, message: "Please enter a search query." },
        { status: 400 }
      );
    }

    if (queryText.length > 200) {
      return NextResponse.json(
        { success: false, message: "Search query is too long." },
        { status: 400 }
      );
    }

    const result = await qdrantClient.query(COLLECTION_NAME, {
      query: {
        text: queryText,
        model: MODEL_NAME,
      },
      limit: 10,
      with_payload: true,
    });

    const products = result.points.map((point) => {
      const payload = point.payload ?? {};

      return {
        id: Number(payload.product_id),
        name: String(payload.product_name ?? ""),
        description: String(payload.description ?? ""),
        price: Number(payload.price ?? 0),
        discountPrice: Number(payload.discount_price ?? 0),
        brand: String(payload.brand ?? ""),
        imageUrl: String(payload.image_url ?? ""),
        categoryId: Number(payload.category_id ?? 0),
        score: point.score,
      };
    });

    return NextResponse.json({
      success: true,
      query: queryText,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Semantic search error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Semantic search failed. Please try again.",
      },
      { status: 500 }
    );
  }
}
