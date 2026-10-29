
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const productId = Number(body.productId);
    const quantity = Number(body.quantity ?? 1);

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID or quantity." },
        { status: 400 }
      );
    }

    // Temporary development customer.
    // Replace this with the authenticated customer's ID later.
    const customerId = 1;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Find the customer's existing cart.
      const [cartRows]: any = await connection.execute(
        "SELECT cart_id FROM cart WHERE customer_id = ? LIMIT 1 FOR UPDATE",
        [customerId]
      );

      let cartId: number;

      if (cartRows.length > 0) {
        cartId = cartRows[0].cart_id;
      } else {
        const [cartResult]: any = await connection.execute(
          "INSERT INTO cart (customer_id, created_at) VALUES (?, NOW())",
          [customerId]
        );

        cartId = cartResult.insertId;
      }

      // Get the product and its current price.
      const [productRows]: any = await connection.execute(
        `SELECT p.product_id, p.price, p.discount_price,
                i.stock_quantity
         FROM product p
         LEFT JOIN inventory i ON i.product_id = p.product_id
         WHERE p.product_id = ?
         FOR UPDATE`,
        [productId]
      );

      if (productRows.length === 0) {
        await connection.rollback();

        return NextResponse.json(
          { success: false, message: "Product not found." },
          { status: 404 }
        );
      }

      const product = productRows[0];

      if (
        product.stock_quantity == null ||
        Number(product.stock_quantity) < quantity
      ) {
        await connection.rollback();

        return NextResponse.json(
          { success: false, message: "Insufficient stock." },
          { status: 400 }
        );
      }

      const unitPrice = Number(
        product.discount_price ?? product.price
      );

      // Check whether this product is already in the cart.
      const [itemRows]: any = await connection.execute(
        `SELECT cart_item_id, quantity
         FROM cart_item
         WHERE cart_id = ? AND product_id = ?
         FOR UPDATE`,
        [cartId, productId]
      );

      if (itemRows.length > 0) {
        const existingQuantity = Number(itemRows[0].quantity);
        const newQuantity = existingQuantity + quantity;

        if (Number(product.stock_quantity) < newQuantity) {
          await connection.rollback();

          return NextResponse.json(
            { success: false, message: "Not enough stock for that quantity." },
            { status: 400 }
          );
        }

        await connection.execute(
          `UPDATE cart_item
           SET quantity = ?, price = ?
           WHERE cart_item_id = ?`,
          [newQuantity, unitPrice, itemRows[0].cart_item_id]
        );
      } else {
        await connection.execute(
          `INSERT INTO cart_item
             (cart_id, product_id, quantity, price)
           VALUES (?, ?, ?, ?)`,
          [cartId, productId, quantity, unitPrice]
        );
      }

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: "Product added to cart!",
        productId,
        quantityAdded: quantity,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Add to cart API error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to add product to cart." },
      { status: 500 }
    );
  }
}
