
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(
      "SELECT DATABASE() AS databaseName, COUNT(*) AS totalProducts FROM product"
    );

    return NextResponse.json({
      success: true,
      message: "MySQL connection successful!",
      result: rows,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Could not connect to the database.",
      },
      { status: 500 }
    );
  }
}
