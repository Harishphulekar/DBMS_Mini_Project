import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import qdrantClient from "@/lib/qdrant";

export async function GET() {
  try {
    const user = await requireRole(["ADMIN"]);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const collections = await qdrantClient.getCollections();

    return NextResponse.json({
      success: true,
      message: "Successfully connected to Qdrant Cloud!",
      collections: collections.collections.map((collection) => collection.name),
    });
  } catch (error) {
    console.error("Qdrant connection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Could not connect to Qdrant. Check server logs and configuration.",
      },
      { status: 500 }
    );
  }
}