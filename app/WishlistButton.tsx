"use client";

import { useEffect, useState } from "react";

type Props = {
  productId: number;
};

export default function WishlistButton({ productId }: Props) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function loadWishlist() {
      try {
        const response = await fetch("/api/wishlist", {
          cache: "no-store",
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setSaved(
            data.items.some(
              (item: { productId: number }) =>
                Number(item.productId) === productId
            )
          );
        }
      } catch (error) {
        console.error("Unable to check wishlist:", error);
      } finally {
        setLoading(false);
      }
    }

    loadWishlist();
  }, [productId]);

  async function toggleWishlist() {
    setBusy(true);

    try {
      const response = await fetch("/api/wishlist", {
        method: saved ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          saved
            ? {
                wishlistItemId: await findWishlistItemId(),
              }
            : { productId }
        ),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Unable to update wishlist.");
        return;
      }

      setSaved(!saved);
      window.dispatchEvent(new Event("wishlist-updated"));
    } catch {
      alert("Unable to update wishlist. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function findWishlistItemId(): Promise<number> {
    const response = await fetch("/api/wishlist", {
      cache: "no-store",
    });
    const data = await response.json();

    const item = data.items?.find(
      (entry: { productId: number; wishlistItemId: number }) =>
        Number(entry.productId) === productId
    );

    if (!item) {
      throw new Error("Wishlist item not found.");
    }

    return item.wishlistItemId;
  }

  return (
    <button
      type="button"
      onClick={toggleWishlist}
      disabled={loading || busy}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={saved}
      title={saved ? "Remove from wishlist" : "Add to wishlist"}
      className="absolute right-3.5 top-3.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-[#EDE8DF]/60 text-[#25231F] hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-50"
    >
      <svg
        className={`w-4 h-4 transition-colors duration-200 ${
          saved ? "fill-[#80664E] stroke-[#80664E]" : "fill-none stroke-[#77736D] hover:stroke-[#25231F]"
        }`}
        viewBox="0 0 24 24"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
