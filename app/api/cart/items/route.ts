
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    // Temporary development customer
    const customerId = 1;

    const [rows]: any = await pool.execute(
      `SELECT
         ci.cart_item_id AS cartItemId,
         ci.product_id AS productId,
         ci.quantity,
         ci.price AS unitPrice,
         p.product_name AS name,
         p.description,
         p.brand,
         p.image_url AS imageUrl,
         p.price AS originalPrice,
         p.discount_price AS discountPrice
       FROM cart c
       JOIN cart_item ci ON ci.cart_id = c.cart_id
       JOIN product p ON p.product_id = ci.product_id
       WHERE c.customer_id = ?
       ORDER BY ci.cart_item_id`,
      [customerId]
    );

    const items = rows.map((item: any) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.unitPrice) * Number(item.quantity),
    }));

    const total = items.reduce(
      (sum: number, item: any) => sum + item.lineTotal,
      0
    );

    return NextResponse.json({
      success: true,
      items,
      total,
      itemCount: items.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0
      ),
    });
  } catch (error) {
    console.error("Fetch cart error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load cart." },
      { status: 500 }
    );
  }
}


export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const cartItemId = Number(body.cartItemId);

    if (!Number.isInteger(cartItemId) || cartItemId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid cart item ID." },
        { status: 400 }
      );
    }

    // Temporary development customer
    const customerId = 1;

    const [result]: any = await pool.execute(
      `DELETE ci
       FROM cart_item ci
       JOIN cart c ON c.cart_id = ci.cart_id
       WHERE ci.cart_item_id = ?
         AND c.customer_id = ?`,
      [cartItemId, customerId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: "Cart item not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Item removed from cart.",
    });
  } catch (error) {
    console.error("Remove cart item error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to remove item." },
      { status: 500 }
    );
  }
}
