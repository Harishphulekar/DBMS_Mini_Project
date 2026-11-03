
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export type UserRole = "CUSTOMER" | "ADMIN";

export interface AuthUser {
  userId: number;
  email: string;
  role: UserRole;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("intellishop_token")?.value;

    if (!token) return null;

    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
      throw new Error("JWT_SECRET is missing or invalid");
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    if (
      typeof payload.userId !== "number" ||
      typeof payload.email !== "string" ||
      (payload.role !== "CUSTOMER" && payload.role !== "ADMIN")
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export async function requireRole(
  allowedRoles: UserRole[]
): Promise<AuthUser | null> {
  const user = await getCurrentUser();

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return user;
}
