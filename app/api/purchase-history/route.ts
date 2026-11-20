
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const customerId = user ? user.userId : 1;

    const [rows]: any = await pool.execute(
      `SELECT
         ph.order_id AS orderId,
         ph.order_item_id AS orderItemId,
         ph.product_id AS productId,
         p.product_name AS productName,
         p.brand,
         p.image_url AS imageUrl,
         ph.purchase_date AS purchaseDate,
         ph.order_status AS orderStatus,
         ph.quantity,
         ph.unit_price AS unitPrice,
         ph.total_price AS totalPrice
       FROM purchase_history ph
       JOIN product p
         ON p.product_id = ph.product_id
       WHERE ph.customer_id = ?
       ORDER BY ph.purchase_date DESC, ph.order_id DESC`,
      [customerId]
    );

    return NextResponse.json({
      success: true,
      items: rows,
      count: rows.length,
    });
  } catch (error) {
    console.error("Purchase history API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch purchase history.",
      },
      { status: 500 }
    );
  }
}
