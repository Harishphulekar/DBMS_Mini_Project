
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface ProductRow extends RowDataPacket {
  product_id: number;
  product_name: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  brand: string | null;
  image_url: string | null;
  category_id: number;
  category_name: string | null;
  stock_quantity: number;
  reserved_quantity: number;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID." },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute<ProductRow[]>(
      `SELECT
        p.product_id,
        p.product_name,
        p.description,
        p.price,
        p.discount_price,
        p.brand,
        p.image_url,
        p.category_id,
        c.category_name,
        COALESCE(i.stock_quantity, 0) AS stock_quantity,
        COALESCE(i.reserved_quantity, 0) AS reserved_quantity
      FROM product p
      LEFT JOIN category c
        ON p.category_id = c.category_id
      LEFT JOIN inventory i
        ON p.product_id = i.product_id
      WHERE p.product_id = ?
      LIMIT 1`,
      [productId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 }
      );
    }

    const product = rows[0];

    return NextResponse.json({
      success: true,
      product: {
        id: product.product_id,
        name: product.product_name,
        description: product.description,
        price: Number(product.price),
        discountPrice: Number(
          product.discount_price ?? product.price
        ),
        brand: product.brand,
        imageUrl: product.image_url,
        categoryId: product.category_id,
        categoryName: product.category_name,
        stockQuantity: Math.max(
          0,
          Number(product.stock_quantity) -
            Number(product.reserved_quantity)
        ),
      },
    });
  } catch (error) {
    console.error("Product details API error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to fetch product details." },
      { status: 500 }
    );
  }
}
