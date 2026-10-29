
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT
        product_id AS id,
        product_name AS name,
        description,
        price,
        discount_price AS discountPrice,
        brand,
        image_url AS imageUrl,
        category_id AS categoryId
      FROM product
      ORDER BY product_id
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Products API error:", error);

    return NextResponse.json(
      { error: "Unable to fetch products" },
      { status: 500 }
    );
  }
}
