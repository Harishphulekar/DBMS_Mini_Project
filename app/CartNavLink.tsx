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
      aria-label={`Shopping cart with ${count} items`}
      className="group relative flex items-center gap-1.5 rounded-full bg-[#25231F] px-4 py-2 text-xs uppercase tracking-wider font-medium text-[#F7F5F0] hover:bg-[#9B8065] transition-colors"
    >
      <svg
        className="w-4 h-4 stroke-current fill-none transition-transform group-hover:scale-110"
        viewBox="0 0 24 24"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      <span>Bag</span>
      <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#9B8065] px-1 text-[10px] font-semibold text-white group-hover:bg-[#25231F]">
        {count}
      </span>
    </Link>
  );
}
