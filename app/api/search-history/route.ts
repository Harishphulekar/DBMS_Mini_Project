
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Save a search
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const customerId = user ? user.userId : 1;

    const body = await request.json();
    const queryText = body.queryText?.trim();

    if (!queryText) {
      return NextResponse.json(
        { success: false, message: "Search query is required." },
        { status: 400 }
      );
    }

    if (queryText.length > 1000) {
      return NextResponse.json(
        { success: false, message: "Search query is too long." },
        { status: 400 }
      );
    }

    await pool.execute(
      `INSERT INTO search_history (customer_id, query_text)
       VALUES (?, ?)`,
      [customerId, queryText]
    );

    return NextResponse.json({
      success: true,
      message: "Search saved successfully!",
    });
  } catch (error) {
    console.error("Save search error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to save search." },
      { status: 500 }
    );
  }
}

// Retrieve search history
export async function GET() {
  try {
    const user = await getCurrentUser();
    const customerId = user ? user.userId : 1;

    const [rows] = await pool.execute(
      `SELECT
         search_id AS searchId,
         query_text AS queryText,
         searched_at AS searchedAt
       FROM search_history
       WHERE customer_id = ?
       ORDER BY searched_at DESC, search_id DESC`,
      [customerId]
    );

    return NextResponse.json({
      success: true,
      items: rows,
    });
  } catch (error) {
    console.error("Fetch search history error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to fetch search history." },
      { status: 500 }
    );
  }
}
