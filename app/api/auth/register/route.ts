
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

interface RoleRow extends RowDataPacket {
  role_id: number;
}

export async function POST(request: Request) {
  let connection;

  try {
    const body = await request.json();

    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const phone = body.phone ? String(body.phone).trim() : null;
    const address = body.address ? String(body.address).trim() : null;

    // Validate required fields.
    if (!fullName || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email and password are required." },
        { status: 400 }
      );
    }

    if (fullName.length > 120 || email.length > 254) {
      return NextResponse.json(
        { success: false, message: "Name or email is too long." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 72) {
      return NextResponse.json(
        { success: false, message: "Password must be between 8 and 72 characters." },
        { status: 400 }
      );
    }

    if (phone && phone.length > 25) {
      return NextResponse.json(
        { success: false, message: "Phone number is too long." },
        { status: 400 }
      );
    }

    if (address && address.length > 500) {
      return NextResponse.json(
        { success: false, message: "Address is too long." },
        { status: 400 }
      );
    }

    // Hash the password before storing it.
    const passwordHash = await bcrypt.hash(password, 12);

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Only CUSTOMER accounts can be created through public registration.
    const [roleRows] = await connection.execute<RoleRow[]>(
      "SELECT role_id FROM role WHERE role_name = 'CUSTOMER' LIMIT 1"
    );

    if (roleRows.length === 0) {
      await connection.rollback();

      return NextResponse.json(
        { success: false, message: "Customer role is not configured." },
        { status: 500 }
      );
    }

    // Check whether the email is already registered.
    const [existingUsers] = await connection.execute<RowDataPacket[]>(
      "SELECT user_id FROM `user` WHERE email = ? LIMIT 1",
      [email]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();

      return NextResponse.json(
        { success: false, message: "This email is already registered." },
        { status: 409 }
      );
    }

    // Create the shared user account.
    const [userResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO \`user\`
        (full_name, email, password_hash, phone, address, role_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        fullName,
        email,
        passwordHash,
        phone,
        address,
        roleRows[0].role_id,
      ]
    );

    // Create the customer subtype record.
    await connection.execute<ResultSetHeader>(
      "INSERT INTO customer (customer_id) VALUES (?)",
      [userResult.insertId]
    );

    await connection.commit();

    return NextResponse.json(
      {
        success: true,
        message: "Customer registered successfully!",
        user: {
          userId: userResult.insertId,
          fullName,
          email,
          role: "CUSTOMER",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Registration error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to register customer." },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}
