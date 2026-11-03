
"use client";

import { useState } from "react";

type Props = {
  productId: number;
};

export default function AddToCartButton({ productId }: Props) {
  const [loading, setLoading] = useState(false);
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

      setMessage("Added to cart ✓");
      window.dispatchEvent(new Event("cart-updated"));
    } catch {
      setMessage("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 text-white py-2.5 font-semibold hover:bg-indigo-700 disabled:opacity-60"
      >
        {loading ? "Adding..." : "Add to Cart"}
      </button>

      {message && (
        <p className="text-sm mt-2 text-center" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
