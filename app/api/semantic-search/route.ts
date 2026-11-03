
import { NextRequest, NextResponse } from "next/server";
import qdrantClient from "@/lib/qdrant";

const COLLECTION_NAME = "product_embeddings";
const MODEL_NAME = "sentence-transformers/all-minilm-l6-v2";

function convertAmount(value: string, suffix?: string): number {
  const amount = Number(value.replace(/,/g, ""));
  const unit = (suffix || "").toLowerCase();

  if (unit === "k" || unit === "thousand") {
    return amount * 1000;
  }

  if (unit === "l" || unit === "lakh") {
    return amount * 100000;
  }

  return amount;
}

function extractPriceRange(query: string) {
  const amount = String.raw`(?:₹\s*)?(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|lakh|l)?`;

  const betweenPattern = new RegExp(
    String.raw`\bbetween\s+${amount}\s+(?:and|to|-)\s+${amount}`,
    "i"
  );

  const simpleRangePattern = new RegExp(
    String.raw`${amount}\s*(?:-|to)\s*${amount}`,
    "i"
  );

  const match =
    query.match(betweenPattern) || query.match(simpleRangePattern);

  if (!match) {
    return null;
  }

  const first = convertAmount(match[1], match[2]);
  const second = convertAmount(match[3], match[4]);

  return {
    min: Math.min(first, second),
    max: Math.max(first, second),
    matchedText: match[0],
  };
}

function cleanSearchQuery(query: string, matchedText?: string) {
  let cleaned = query;

  if (matchedText) {
    cleaned = cleaned.replace(matchedText, " ");
  }

  cleaned = cleaned.replace(
    /\b(i want|i need|give me|show me|find me|between|from|to|and|price|budget|give|one|best|under|over|above|below)\b/gi,
    " "
  );

  return cleaned.replace(/\s+/g, " ").trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const queryText =
      typeof body.query === "string" ? body.query.trim() : "";

    if (!queryText) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a search query.",
        },
        { status: 400 }
      );
    }

    if (queryText.length > 200) {
      return NextResponse.json(
        {
          success: false,
          message: "Search query is too long.",
        },
        { status: 400 }
      );
    }

    const priceRange = extractPriceRange(queryText);

    const semanticQuery = cleanSearchQuery(
      queryText,
      priceRange?.matchedText
    );

    if (!semanticQuery) {
      return NextResponse.json(
        {
          success: false,
          message: "Please describe the product you want.",
        },
        { status: 400 }
      );
    }

    const qdrantFilter = priceRange
      ? {
          must: [
            {
              key: "price",
              range: {
                gte: priceRange.min,
                lte: priceRange.max,
              },
            },
          ],
        }
      : undefined;

    const result = await qdrantClient.query(COLLECTION_NAME, {
      query: {
        text: semanticQuery,
        model: MODEL_NAME,
      },
      limit: priceRange ? 50 : 10,
      filter: qdrantFilter,
      with_payload: true,
    });

    const products = result.points
      .map((point) => {
        const payload = point.payload ?? {};

        return {
          id: Number(payload.product_id),
          name: String(payload.product_name ?? ""),
          description: String(payload.description ?? ""),
          price: Number(payload.price ?? 0),
          discountPrice:
            payload.discount_price == null
              ? 0
              : Number(payload.discount_price),
          brand: String(payload.brand ?? ""),
          imageUrl: String(payload.image_url ?? ""),
          categoryId: Number(payload.category_id ?? 0),
          score: point.score,
        };
      })
      .filter((product) => product.id > 0)
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({
      success: true,
      query: queryText,
      semanticQuery,
      priceRange: priceRange
        ? {
            min: priceRange.min,
            max: priceRange.max,
          }
        : null,
      count: products.length,
      products,
      message:
        products.length === 0 && priceRange
          ? "No matching products were found in your selected price range."
          : "Semantic search completed successfully.",
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
