
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { requireRole } from "@/lib/auth";
import pool from "@/lib/db";
import qdrantClient from "@/lib/qdrant";

const COLLECTION_NAME = "product_embeddings";
const MODEL_NAME = "sentence-transformers/all-minilm-l6-v2";
const BATCH_SIZE = 20;

interface ProductRow extends RowDataPacket {
  product_id: number;
  product_name: string;
  description: string | null;
  price: number | string;
  discount_price: number | string | null;
  brand: string | null;
  image_url: string | null;
  category_id: number | null;
  category_name: string | null;
  stock_quantity: number | null;
  reserved_quantity: number | null;
  reorder_level: number | null;
}

export async function POST() {
  try {
    const user = await requireRole(["ADMIN"]);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Admin access required." },
        { status: 401 }
      );
    }

    const collectionInfo =
      await qdrantClient.getCollections();

    const collectionExists =
      collectionInfo.collections.some(
        (collection) =>
          collection.name === COLLECTION_NAME
      );

    if (!collectionExists) {
      return NextResponse.json(
        {
          success: false,
          message: "Qdrant collection does not exist.",
        },
        { status: 404 }
      );
    }

    const [products] = await pool.query<ProductRow[]>(`
      SELECT
        p.product_id,
        p.product_name,
        p.description,
        p.price,
        p.discount_price,
        p.brand,
        p.image_url,
        p.category_id,
        c.category_name,
        i.stock_quantity,
        i.reserved_quantity,
        i.reorder_level
      FROM product p
      LEFT JOIN category c
        ON p.category_id = c.category_id
      LEFT JOIN inventory i
        ON p.product_id = i.product_id
      ORDER BY p.product_id ASC
    `);

    if (products.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No products found to index.",
        indexedCount: 0,
      });
    }

    let indexedCount = 0;

    for (
      let start = 0;
      start < products.length;
      start += BATCH_SIZE
    ) {
      const batch = products.slice(
        start,
        start + BATCH_SIZE
      );

      const points = batch.map((product) => {
        const searchableText = [
          product.product_name,
          product.brand,
          product.category_name,
          product.description?.slice(0, 700),
        ]
          .filter(Boolean)
          .join(". ");

        return {
          id: product.product_id,
          vector: {
            text: searchableText,
            model: MODEL_NAME,
          },
          payload: {
            product_id: product.product_id,
            product_name: product.product_name,
            description: product.description ?? "",
            price: Number(product.price),
            discount_price:
              product.discount_price === null
                ? null
                : Number(product.discount_price),
            brand: product.brand ?? "",
            image_url: product.image_url ?? "",
            category_id: product.category_id,
            category_name:
              product.category_name ?? "Uncategorized",
            stock_quantity: product.stock_quantity ?? 0,
            reserved_quantity:
              product.reserved_quantity ?? 0,
            reorder_level: product.reorder_level ?? 0,
          },
        };
      });

      await qdrantClient.upsert(COLLECTION_NAME, {
        wait: true,
        points,
      });

      indexedCount += batch.length;
    }

    return NextResponse.json({
      success: true,
      message: "Products indexed successfully in Qdrant!",
      indexedCount,
      collection: COLLECTION_NAME,
      model: MODEL_NAME,
      vectorSize: 384,
    });
  } catch (error) {
    console.error("Product indexing error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Product indexing failed. Check server logs.",
      },
      { status: 500 }
    );
  }
}
