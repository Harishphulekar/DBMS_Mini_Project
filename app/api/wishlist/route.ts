
import { NextResponse } from "next/server";
import pool from "@/lib/db";

const CUSTOMER_ID = 1; // Temporary development customer

export async function GET() {
  try {
    const [rows]: any = await pool.execute(
      `SELECT
         wi.wishlist_item_id AS wishlistItemId,
         wi.product_id AS productId,
         wi.created_at AS createdAt,
         p.product_name AS name,
         p.description,
         p.brand,
         p.image_url AS imageUrl,
         p.price,
         p.discount_price AS discountPrice,
         p.category_id AS categoryId
       FROM wishlist w
       JOIN wishlist_item wi ON wi.wishlist_id = w.wishlist_id
       JOIN product p ON p.product_id = wi.product_id
       WHERE w.customer_id = ?
       ORDER BY wi.created_at DESC`,
      [CUSTOMER_ID]
    );

    return NextResponse.json({
      success: true,
      items: rows,
      count: rows.length,
    });
  } catch (error) {
    console.error("Fetch wishlist error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load wishlist." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const productId = Number(body.productId);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID." },
        { status: 400 }
      );
    }

    const [products]: any = await pool.execute(
      "SELECT product_id FROM product WHERE product_id = ?",
      [productId]
    );

    if (products.length === 0) {
      return NextResponse.json(
        { success: false, message: "Product not found." },
        { status: 404 }
      );
    }

    const [wishlists]: any = await pool.execute(
      "SELECT wishlist_id FROM wishlist WHERE customer_id = ? LIMIT 1",
      [CUSTOMER_ID]
    );

    let wishlistId: number;

    if (wishlists.length > 0) {
      wishlistId = Number(wishlists[0].wishlist_id);
    } else {
      const [result]: any = await pool.execute(
        "INSERT INTO wishlist (customer_id) VALUES (?)",
        [CUSTOMER_ID]
      );

      wishlistId = Number(result.insertId);
    }

    const [existing]: any = await pool.execute(
      `SELECT wishlist_item_id
       FROM wishlist_item
       WHERE wishlist_id = ? AND product_id = ?`,
      [wishlistId, productId]
    );

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Product is already in your wishlist.",
      });
    }

    await pool.execute(
      `INSERT INTO wishlist_item (wishlist_id, product_id, created_at)
       VALUES (?, ?, NOW())`,
      [wishlistId, productId]
    );

    return NextResponse.json({
      success: true,
      message: "Product added to wishlist!",
    });
  } catch (error) {
    console.error("Add wishlist item error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to add product to wishlist." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const wishlistItemId = Number(body.wishlistItemId);

    if (!Number.isInteger(wishlistItemId) || wishlistItemId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid wishlist item ID." },
        { status: 400 }
      );
    }

    const [result]: any = await pool.execute(
      `DELETE wi
       FROM wishlist_item wi
       JOIN wishlist w ON w.wishlist_id = wi.wishlist_id
       WHERE wi.wishlist_item_id = ?
         AND w.customer_id = ?`,
      [wishlistItemId, CUSTOMER_ID]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: "Wishlist item not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product removed from wishlist.",
    });
  } catch (error) {
    console.error("Remove wishlist item error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to remove wishlist item." },
      { status: 500 }
    );
  }
}
