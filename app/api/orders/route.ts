
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

const CUSTOMER_ID = 1; // Current demo customer

export async function POST(request: NextRequest) {
  let connection;

  try {
    const body = await request.json();

    const fullName = String(body.fullName ?? "").trim();
    const address = String(body.address ?? "").trim();
    const phone = String(body.phone ?? "").trim();

    if (!fullName || !address || !/^[0-9]{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid name, address and 10-digit phone number." },
        { status: 400 }
      );
    }

    const shippingAddress =
      `${fullName}, ${phone}, ${address}`;

    if (shippingAddress.length > 500) {
      return NextResponse.json(
        { success: false, message: "The delivery address is too long." },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Find and lock this customer's cart.
    const [cartRows]: any = await connection.execute(
      `SELECT cart_id
       FROM cart
       WHERE customer_id = ?
       LIMIT 1
       FOR UPDATE`,
      [CUSTOMER_ID]
    );

    if (cartRows.length === 0) {
      await connection.rollback();

      return NextResponse.json(
        { success: false, message: "Your cart is empty." },
        { status: 400 }
      );
    }

    const cartId = cartRows[0].cart_id;

    // Retrieve cart products, current database prices and locked inventory.
    const [items]: any = await connection.execute(
      `SELECT
         ci.product_id AS productId,
         ci.quantity,
         p.product_name AS productName,
         CASE
           WHEN p.discount_price IS NOT NULL AND p.discount_price > 0
             THEN p.discount_price
           ELSE p.price
         END AS unitPrice,
         i.stock_quantity AS stockQuantity,
         i.reserved_quantity AS reservedQuantity
       FROM cart_item ci
       JOIN product p ON p.product_id = ci.product_id
       LEFT JOIN inventory i ON i.product_id = ci.product_id
       WHERE ci.cart_id = ?
       ORDER BY ci.product_id
       FOR UPDATE`,
      [cartId]
    );

    if (items.length === 0) {
      await connection.rollback();

      return NextResponse.json(
        { success: false, message: "Your cart is empty." },
        { status: 400 }
      );
    }

    // Validate stock and calculate the total on the server.
    let totalAmount = 0;

    for (const item of items) {
      if (
        item.stockQuantity === null ||
        Number(item.quantity) >
          Number(item.stockQuantity) - Number(item.reservedQuantity)
      ) {
        throw new Error(
          `Insufficient stock for ${item.productName}. Please update your cart.`
        );
      }

      totalAmount += Number(item.unitPrice) * Number(item.quantity);
    }

    // Create the order.
    const [orderResult]: any = await connection.execute(
      `INSERT INTO orders
         (customer_id, status, total_amount, shipping_address)
       VALUES (?, 'PENDING', ?, ?)`,
      [CUSTOMER_ID, totalAmount.toFixed(2), shippingAddress]
    );

    const orderId = orderResult.insertId;

    // Create order items and reduce inventory.
    for (const item of items) {
      const unitPrice = Number(item.unitPrice);
      const quantity = Number(item.quantity);
      const lineTotal = unitPrice * quantity;

      await connection.execute(
        `INSERT INTO order_item
           (order_id, product_id, quantity, price, total_price)
         VALUES (?, ?, ?, ?, ?)`,
        [
          orderId,
          item.productId,
          quantity,
          unitPrice.toFixed(2),
          lineTotal.toFixed(2),
        ]
      );

      const [inventoryResult]: any = await connection.execute(
        `UPDATE inventory
         SET stock_quantity = stock_quantity - ?
         WHERE product_id = ?
           AND stock_quantity - reserved_quantity >= ?`,
        [quantity, item.productId, quantity]
      );

      if (inventoryResult.affectedRows !== 1) {
        throw new Error(
          `Stock changed while placing your order for ${item.productName}. Please try again.`
        );
      }
    }

    // Clear the cart only after all order items are saved.
    await connection.execute(
      `DELETE FROM cart_item WHERE cart_id = ?`,
      [cartId]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Your order has been placed successfully!",
      orderId,
      totalAmount: Number(totalAmount.toFixed(2)),
      status: "PENDING",
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Place order error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to place your order.";

    return NextResponse.json(
      { success: false, message },
      { status: 400 }
    );
  } finally {
    connection?.release();
  }
}
