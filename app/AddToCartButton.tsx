"use client";

import { useState } from "react";

type Props = {
  productId: number;
  className?: string;
  variant?: "primary" | "minimal";
};

export default function AddToCartButton({
  productId,
  className = "",
  variant = "primary",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAddToCart() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "Could not add product.");
        return;
      }

      setAdded(true);
      setMessage("Added to Bag ✓");
      window.dispatchEvent(new Event("cart-updated"));

      setTimeout(() => {
        setAdded(false);
        setMessage("");
      }, 2500);
    } catch {
      setMessage("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const baseStyle =
    variant === "primary"
      ? "w-full rounded-full bg-[#25231F] text-[#F7F5F0] py-3 px-5 text-xs font-semibold uppercase tracking-widest hover:bg-[#9B8065] active:scale-[0.99] transition-all duration-200 shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
      : "w-full rounded-full border border-[#25231F] text-[#25231F] py-2.5 px-4 text-xs font-semibold uppercase tracking-wider hover:bg-[#25231F] hover:text-[#F7F5F0] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2";

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={loading}
        className={`${baseStyle} ${className}`}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Adding...
          </span>
        ) : added ? (
          <span className="flex items-center gap-1.5 text-[#F7F5F0]">
            <svg
              className="w-4 h-4 text-emerald-400 stroke-current"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Added
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg
              className="w-3.5 h-3.5 stroke-current"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            Add to Bag
          </span>
        )}
      </button>

      {message && !added && (
        <p className="mt-2 text-center text-xs text-rose-600" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
