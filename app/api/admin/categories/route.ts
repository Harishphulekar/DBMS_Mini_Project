
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireRole } from "@/lib/auth";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

interface CategoryBody {
  category_name?: string;
  description?: string;
  parent_category_id?: number | null;
}

function validateCategory(body: CategoryBody) {
  const categoryName = String(body.category_name ?? "").trim();
  const description = String(body.description ?? "").trim();

  const parentCategoryId =
    body.parent_category_id == null || body.parent_category_id === 0
      ? null
      : Number(body.parent_category_id);

  if (
    !categoryName ||
    categoryName.length > 100 ||
    (parentCategoryId !== null &&
      (!Number.isInteger(parentCategoryId) || parentCategoryId <= 0))
  ) {
    return null;
  }

  return { categoryName, description, parentCategoryId };
}

// GET: Fetch all categories
export async function GET() {
  const admin = await requireRole(["ADMIN"]);

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Admin access required" },
      { status: 403 }
    );
  }

  try {
    const [categories] = await pool.query<RowDataPacket[]>(`
      SELECT
        category_id,
        category_name,
        description,
        parent_category_id
      FROM category
      ORDER BY category_name ASC
    `);

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Category fetch error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to fetch categories" },
      { status: 500 }
    );
  }
}

// POST: Add a category
export async function POST(request: NextRequest) {
  const admin = await requireRole(["ADMIN"]);

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Admin access required" },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as CategoryBody;
    const values = validateCategory(body);

    if (!values) {
      return NextResponse.json(
        { success: false, message: "Invalid category details" },
        { status: 400 }
      );
    }

    const { categoryName, description, parentCategoryId } = values;

    if (parentCategoryId !== null) {
      const [parent] = await pool.execute<RowDataPacket[]>(
        "SELECT category_id FROM category WHERE category_id = ?",
        [parentCategoryId]
      );

      if (parent.length === 0) {
        return NextResponse.json(
          { success: false, message: "Parent category not found" },
          { status: 400 }
        );
      }
    }

    const [existing] = await pool.execute<RowDataPacket[]>(
      "SELECT category_id FROM category WHERE category_name = ?",
      [categoryName]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: "Category already exists" },
        { status: 409 }
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO category
       (category_name, description, parent_category_id)
       VALUES (?, ?, ?)`,
      [categoryName, description || null, parentCategoryId]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Category created successfully",
        categoryId: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Category creation error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create category" },
      { status: 500 }
    );
  }
}

// PUT: Update a category
export async function PUT(request: NextRequest) {
  const admin = await requireRole(["ADMIN"]);

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Admin access required" },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as CategoryBody & {
      category_id?: number;
    };

    const categoryId = Number(body.category_id);
    const values = validateCategory(body);

    if (
      !Number.isInteger(categoryId) ||
      categoryId <= 0 ||
      !values
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid category details" },
        { status: 400 }
      );
    }

    const { categoryName, description, parentCategoryId } = values;

    if (parentCategoryId === categoryId) {
      return NextResponse.json(
        { success: false, message: "A category cannot be its own parent" },
        { status: 400 }
      );
    }

    const [existingCategory] = await pool.execute<RowDataPacket[]>(
      "SELECT category_id FROM category WHERE category_id = ?",
      [categoryId]
    );

    if (existingCategory.length === 0) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    if (parentCategoryId !== null) {
      const [parent] = await pool.execute<RowDataPacket[]>(
        "SELECT category_id FROM category WHERE category_id = ?",
        [parentCategoryId]
      );

      if (parent.length === 0) {
        return NextResponse.json(
          { success: false, message: "Parent category not found" },
          { status: 400 }
        );
      }
    }

    const [duplicate] = await pool.execute<RowDataPacket[]>(
      `SELECT category_id FROM category
       WHERE category_name = ? AND category_id <> ?`,
      [categoryName, categoryId]
    );

    if (duplicate.length > 0) {
      return NextResponse.json(
        { success: false, message: "Category name already exists" },
        { status: 409 }
      );
    }

    await pool.execute(
      `UPDATE category
       SET category_name = ?, description = ?, parent_category_id = ?
       WHERE category_id = ?`,
      [categoryName, description || null, parentCategoryId, categoryId]
    );

    return NextResponse.json({
      success: true,
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error("Category update error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update category" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a category safely
export async function DELETE(request: NextRequest) {
  const admin = await requireRole(["ADMIN"]);

  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Admin access required" },
      { status: 403 }
    );
  }

  const categoryId = Number(
    request.nextUrl.searchParams.get("categoryId")
  );

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return NextResponse.json(
      { success: false, message: "Invalid category ID" },
      { status: 400 }
    );
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [category] = await connection.execute<RowDataPacket[]>(
      "SELECT category_id FROM category WHERE category_id = ? FOR UPDATE",
      [categoryId]
    );

    if (category.length === 0) {
      await connection.rollback();

      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    const [products] = await connection.execute<RowDataPacket[]>(
      "SELECT product_id FROM product WHERE category_id = ? LIMIT 1",
      [categoryId]
    );

    if (products.length > 0) {
      await connection.rollback();

      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete a category that contains products",
        },
        { status: 409 }
      );
    }

    const [children] = await connection.execute<RowDataPacket[]>(
      "SELECT category_id FROM category WHERE parent_category_id = ? LIMIT 1",
      [categoryId]
    );

    if (children.length > 0) {
      await connection.rollback();

      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete a category that has child categories",
        },
        { status: 409 }
      );
    }

    await connection.execute(
      "DELETE FROM category WHERE category_id = ?",
      [categoryId]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Category deletion error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to delete category" },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}
