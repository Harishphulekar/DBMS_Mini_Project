
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

export default function WishlistNavLink() {
  const [count, setCount] = useState(0);

  const loadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/wishlist", {
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = await response.json();

      if (data.success) {
        setCount(data.count);
      }
    } catch (error) {
      console.error("Unable to load wishlist count:", error);
    }
  }, []);

  useEffect(() => {
    void loadCount();

    window.addEventListener("wishlist-updated", loadCount);

    return () => {
      window.removeEventListener("wishlist-updated", loadCount);
    };
  }, [loadCount]);

  return (
    <Link
      href="/wishlist"
      className="hover:text-indigo-600 transition-colors"
    >
      ♡ Wishlist ({count})
    </Link>
  );
}
