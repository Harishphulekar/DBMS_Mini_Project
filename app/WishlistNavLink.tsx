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
      aria-label={`Wishlist with ${count} items`}
      className="group relative flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-wider font-medium text-[#25231F] hover:text-[#9B8065] transition-colors"
    >
      <svg
        className="w-4 h-4 stroke-current fill-none transition-transform group-hover:scale-110"
        viewBox="0 0 24 24"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span className="hidden sm:inline">Wishlist</span>
      {count > 0 && (
        <span className="ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#9B8065] px-1 text-[10px] font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
