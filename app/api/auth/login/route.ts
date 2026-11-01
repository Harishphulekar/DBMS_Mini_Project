

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
  user_id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role_name: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute<UserRow[]>(
      `SELECT
         u.user_id,
         u.full_name,
         u.email,
         u.password_hash,
         r.role_name
       FROM \`user\` u
       JOIN role r ON u.role_id = r.role_id
       WHERE u.email = ?
       LIMIT 1`,
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const user = rows[0];

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret || jwtSecret.length < 32) {
      throw new Error("JWT_SECRET is missing or too short.");
    }

    const secret = new TextEncoder().encode(jwtSecret);

    const token = await new SignJWT({
      userId: user.user_id,
      email: user.email,
      role: user.role_name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    const response = NextResponse.json({
      success: true,
      message: "Login successful!",
      user: {
        userId: user.user_id,
        fullName: user.full_name,
        email: user.email,
        role: user.role_name,
      },
    });

    response.cookies.set("intellishop_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to log in." },
      { status: 500 }
    );
  }
}
