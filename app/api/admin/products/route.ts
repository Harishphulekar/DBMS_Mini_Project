
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/auth";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export async function GET() {
  const admin = await requireRole(["ADMIN"]);

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Admin access required" },
      { status: 403 }
    );
  }

  try {
    const [products] = await pool.query<RowDataPacket[]>(`
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
        COALESCE(i.stock_quantity, 0) AS stock_quantity,
        COALESCE(i.reserved_quantity, 0) AS reserved_quantity,
        COALESCE(i.reorder_level, 5) AS reorder_level
      FROM product p
      LEFT JOIN category c ON p.category_id = c.category_id
      LEFT JOIN inventory i ON p.product_id = i.product_id
      ORDER BY p.product_id DESC
    `);

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("Admin product fetch error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireRole(["ADMIN"]);

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Admin access required" },
      { status: 403 }
    );
  }

  let connection;

  try {
    const body = await request.json();

    const productName = String(body.product_name ?? "").trim();
    const description = String(body.description ?? "").trim();
    const brand = String(body.brand ?? "").trim();
    const imageUrl = String(body.image_url ?? "").trim();

    const price = Number(body.price);
    const discountPrice =
      body.discount_price == null || body.discount_price === ""
        ? null
        : Number(body.discount_price);

    const categoryId = Number(body.category_id);
    const stockQuantity = Number(body.stock_quantity ?? 0);
    const reorderLevel = Number(body.reorder_level ?? 5);

    if (
      !productName ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isInteger(categoryId) ||
      categoryId <= 0 ||
      !Number.isInteger(stockQuantity) ||
      stockQuantity < 0 ||
      !Number.isInteger(reorderLevel) ||
      reorderLevel < 0 ||
      (discountPrice !== null &&
        (!Number.isFinite(discountPrice) ||
          discountPrice < 0 ||
          discountPrice > price))
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid product details" },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [productResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO product
        (product_name, description, price, discount_price, brand, image_url, category_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        productName,
        description || null,
        price,
        discountPrice,
        brand || null,
        imageUrl || null,
        categoryId,
      ]
    );

    await connection.execute(
      `INSERT INTO inventory
        (product_id, stock_quantity, reserved_quantity, reorder_level)
       VALUES (?, ?, 0, ?)`,
      [productResult.insertId, stockQuantity, reorderLevel]
    );

    await connection.commit();

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        productId: productResult.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Admin product creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create product. Check the category and database schema.",
      },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}

export async function PUT(request: NextRequest) {
  const admin = await requireRole(["ADMIN"]);

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Admin access required" },
      { status: 403 }
    );
  }

  let connection;

  try {
    const body = await request.json();

    const productId = Number(body.product_id);
    const productName = String(body.product_name ?? "").trim();
    const description = String(body.description ?? "").trim();
    const brand = String(body.brand ?? "").trim();
    const imageUrl = String(body.image_url ?? "").trim();

    const price = Number(body.price);
    const discountPrice =
      body.discount_price == null || body.discount_price === ""
        ? null
        : Number(body.discount_price);

    const categoryId = Number(body.category_id);
    const stockQuantity = Number(body.stock_quantity);
    const reorderLevel = Number(body.reorder_level);

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !productName ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isInteger(categoryId) ||
      categoryId <= 0 ||
      !Number.isInteger(stockQuantity) ||
      stockQuantity < 0 ||
      !Number.isInteger(reorderLevel) ||
      reorderLevel < 0 ||
      (discountPrice !== null &&
        (!Number.isFinite(discountPrice) ||
          discountPrice < 0 ||
          discountPrice > price))
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid product details" },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existing] = await connection.execute<RowDataPacket[]>(
      "SELECT product_id FROM product WHERE product_id = ? FOR UPDATE",
      [productId]
    );

    if (existing.length === 0) {
      await connection.rollback();

      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    await connection.execute(
      `UPDATE product
       SET product_name = ?, description = ?, price = ?,
           discount_price = ?, brand = ?, image_url = ?,
           category_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE product_id = ?`,
      [
        productName,
        description || null,
        price,
        discountPrice,
        brand || null,
        imageUrl || null,
        categoryId,
        productId,
      ]
    );

    await connection.execute(
      `INSERT INTO inventory
       (product_id, stock_quantity, reserved_quantity, reorder_level)
       VALUES (?, ?, 0, ?)
       ON DUPLICATE KEY UPDATE
       stock_quantity = VALUES(stock_quantity),
       reorder_level = VALUES(reorder_level)`,
      [productId, stockQuantity, reorderLevel]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
    });
  } catch (error) {
    if (connection) await connection.rollback();

    console.error("Admin product update error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update product" },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await requireRole(["ADMIN"]);

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Admin access required" },
      { status: 403 }
    );
  }

  let connection;

  try {
    const productId = Number(
      request.nextUrl.searchParams.get("productId")
    );

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID" },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existing] = await connection.execute<RowDataPacket[]>(
      "SELECT product_id FROM product WHERE product_id = ? FOR UPDATE",
      [productId]
    );

    if (existing.length === 0) {
      await connection.rollback();

      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    await connection.execute(
      "DELETE FROM inventory WHERE product_id = ?",
      [productId]
    );

    await connection.execute(
      "DELETE FROM product WHERE product_id = ?",
      [productId]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    if (connection) await connection.rollback();

    console.error("Admin product deletion error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to delete product. It may be referenced by existing orders or other records.",
      },
      { status: 409 }
    );
  } finally {
    connection?.release();
  }
}
