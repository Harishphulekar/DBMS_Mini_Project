
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
      className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow hover:scale-105 transition disabled:opacity-50"
    >
      <span className={saved ? "text-red-500 text-2xl" : "text-gray-500 text-2xl"}>
        {saved ? "♥" : "♡"}
      </span>
    </button>
  );
}
