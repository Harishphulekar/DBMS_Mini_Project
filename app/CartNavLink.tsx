
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

export default function CartNavLink() {
  const [count, setCount] = useState(0);

  const loadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/cart/items", {
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = await response.json();

      if (data.success) {
        setCount(data.itemCount);
      }
    } catch (error) {
      console.error("Unable to load cart count:", error);
    }
  }, []);

  useEffect(() => {
    loadCount();

    window.addEventListener("cart-updated", loadCount);

    return () => {
      window.removeEventListener("cart-updated", loadCount);
    };
  }, [loadCount]);

  return (
    <Link
      href="/cart"
      className="hover:text-indigo-600 transition-colors"
    >
      🛒 Cart ({count})
    </Link>
  );
}
