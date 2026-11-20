import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getCartRecommendations, type CartInputItem } from "@/lib/recommendations";
import type { RowDataPacket } from "mysql2";

interface CartRow extends RowDataPacket {
  productId: number;
  name: string;
  brand: string;
  categoryId: number;
  categoryName: string;
  description: string;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    // Use authenticated customer ID if logged in, fallback to 1 for unauthenticated/demo
    const customerId = user ? user.userId : 1;

    // Load active cart items for this customer
    const [rows] = await pool.execute<CartRow[]>(
      `SELECT
         ci.product_id AS productId,
         p.product_name AS name,
         p.brand,
         p.category_id AS categoryId,
         c.category_name AS categoryName,
         p.description
       FROM cart ct
       JOIN cart_item ci ON ci.cart_id = ct.cart_id
       JOIN product p ON p.product_id = ci.product_id
       JOIN category c ON c.category_id = p.category_id
       WHERE ct.customer_id = ?`,
      [customerId]
    );

    // If the cart is empty, do not return recommendations
    if (!rows || rows.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        recommendations: [],
      });
    }

    const cartInputItems: CartInputItem[] = rows.map((r) => ({
      productId: Number(r.productId),
      name: String(r.name),
      brand: String(r.brand),
      categoryId: Number(r.categoryId),
      categoryName: String(r.categoryName),
      description: String(r.description || ""),
    }));

    const recommendations = await getCartRecommendations({
      customerId,
      cartItems: cartInputItems,
      limit: 4,
    });

    return NextResponse.json({
      success: true,
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    console.error("Cart recommendations API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to generate recommendations.",
      },
      { status: 500 }
    );
  }
}
