
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AddToCartButton from "../AddToCartButton";

type WishlistItem = {
  wishlistItemId: number;
  productId: number;
  name: string;
  description: string;
  brand: string;
  imageUrl: string;
  price: number | string;
  discountPrice: number | string;
  categoryId: number;
};

const categoryNames: Record<number, string> = {
  1: "Electronics",
  2: "Fashion",
  3: "Books",
  4: "Home & Kitchen",
};

const productEmojis: Record<number, string> = {
  1: "🎧",
  2: "📱",
  3: "👕",
  4: "📚",
  5: "☕",
};

function formatPrice(price: number | string) {
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<number | null>(null);

  const loadWishlist = useCallback(async () => {
    try {
      const response = await fetch("/api/wishlist", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load wishlist.");
      }

      setItems(data.items);
      setError("");
    } catch {
      setError("Could not load your wishlist. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWishlist();
  }, [loadWishlist]);

  async function removeItem(wishlistItemId: number) {
    setRemovingId(wishlistItemId);
    setError("");

    try {
      const response = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wishlistItemId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to remove product.");
      }

      await loadWishlist();
      window.dispatchEvent(new Event("wishlist-updated"));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove product."
      );
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-10 text-center">
        Loading your wishlist...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            IntelliShop
          </Link>

          <nav className="flex gap-5 text-sm font-medium">
            <Link href="/" className="hover:text-indigo-600">
              Continue Shopping
            </Link>
            <Link href="/cart" className="hover:text-indigo-600">
              🛒 Cart
            </Link>
          </nav>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <p className="text-sm font-semibold text-rose-600">
          YOUR FAVORITES
        </p>

        <div className="flex flex-wrap justify-between items-end gap-3 mt-2 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">
            My Wishlist ♡
          </h1>
          <p className="text-gray-500">
            {items.length} saved product(s)
          </p>
        </div>

        {error && (
          <p role="alert" className="mb-5 text-red-600">
            {error}
          </p>
        )}

        {items.length === 0 ? (
          <div className="bg-white border rounded-2xl p-12 text-center">
            <p className="text-6xl mb-4">♡</p>
            <h2 className="text-xl font-bold">
              Your wishlist is empty
            </h2>
            <p className="text-gray-500 mt-2">
              Save products you love and find them here later.
            </p>
            <Link
              href="/"
              className="inline-block mt-6 rounded-lg bg-indigo-600 text-white px-6 py-3 font-semibold hover:bg-indigo-700"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <article
                key={item.wishlistItemId}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-44 bg-indigo-50 flex items-center justify-center text-7xl">
                  {productEmojis[item.productId] ?? "🛍️"}
                </div>

                <div className="p-5">
                  <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">
                    {categoryNames[item.categoryId] ?? "Products"}
                  </p>

                  <h2 className="font-bold text-lg mt-2">
                    {item.name}
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    {item.brand}
                  </p>

                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <span className="font-bold text-lg">
                      {formatPrice(item.discountPrice)}
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                      {formatPrice(item.price)}
                    </span>
                  </div>

                  <AddToCartButton productId={item.productId} />

                  <button
                    type="button"
                    onClick={() => removeItem(item.wishlistItemId)}
                    disabled={removingId === item.wishlistItemId}
                    className="w-full mt-3 rounded-lg border border-red-200 text-red-600 py-2.5 font-semibold hover:bg-red-50 disabled:opacity-50"
                  >
                    {removingId === item.wishlistItemId
                      ? "Removing..."
                      : "♥ Remove from Wishlist"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
