"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AddToCartButton from "../AddToCartButton";
import ProductImage from "../ProductImage";

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
  5: "Beauty",
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
        err instanceof Error ? err.message : "Unable to remove product."
      );
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#9B8065] border-t-transparent" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#77736D]">
            Loading Your Wishlist...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F5F0] text-[#25231F]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#F7F5F0]/85 border-b border-[#EDE8DF]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25231F] text-[#F7F5F0] font-editorial text-lg font-bold group-hover:bg-[#9B8065] transition-colors">
              I
            </span>
            <span className="font-editorial text-2xl font-semibold tracking-wide text-[#25231F]">
              INTELLISHOP
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-semibold uppercase tracking-wider text-[#77736D] hover:text-[#25231F] transition-colors"
            >
              Continue Shopping
            </Link>
            <div className="h-4 w-px bg-[#EDE8DF]" />
            <Link
              href="/cart"
              className="rounded-full bg-[#25231F] px-4 py-2 text-xs uppercase tracking-wider font-medium text-[#F7F5F0] hover:bg-[#9B8065] transition-colors"
            >
              Bag
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Wishlist Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#EDE8DF]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9B8065]">
              Saved Curation
            </p>
            <h1 className="mt-1 font-editorial text-4xl sm:text-5xl font-medium text-[#25231F]">
              My Wishlist
            </h1>
          </div>
          <p className="text-xs uppercase tracking-wider text-[#77736D] font-medium">
            {items.length} {items.length === 1 ? "Product" : "Products"} Saved
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-700">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="my-16 rounded-3xl border border-dashed border-[#DDD6C9] bg-white/70 p-16 text-center max-w-lg mx-auto">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EDE8DF]/60 text-[#9B8065] mb-4">
              <svg
                className="w-7 h-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <h2 className="font-editorial text-2xl font-medium text-[#25231F]">
              Your Wishlist is Empty
            </h2>
            <p className="mt-2 text-xs text-[#77736D] leading-relaxed">
              Bookmark pieces and essentials you desire to keep them saved in your personal collection.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25231F] px-8 py-3.5 text-xs font-semibold uppercase tracking-widest text-[#F7F5F0] hover:bg-[#9B8065] transition-colors"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-10">
            {items.map((item) => (
              <article
                key={item.wishlistItemId}
                className="group flex flex-col justify-between rounded-2xl bg-white border border-[#EDE8DF] overflow-hidden hover:border-[#9B8065]/40 hover:shadow-lg transition-all duration-300"
              >
                {/* Image Display */}
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#EDE8DF]/40">
                  <Link href={`/product/${item.productId}`} className="block w-full h-full">
                    <ProductImage
                      productId={item.productId}
                      imageUrl={item.imageUrl}
                      name={item.name}
                      categoryId={item.categoryId}
                      fit="contain"
                    />
                  </Link>

                  <div className="absolute bottom-3 left-3.5 z-10 pointer-events-none">
                    <span className="rounded-full bg-white/90 backdrop-blur-md px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-[#80664E] border border-white/60">
                      {categoryNames[item.categoryId] ?? "Item"}
                    </span>
                  </div>
                </div>

                {/* Details & Actions */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    {item.brand && (
                      <p className="text-[10px] uppercase tracking-wider text-[#77736D] font-medium">
                        {item.brand}
                      </p>
                    )}
                    <h2 className="mt-1 font-editorial text-lg font-medium text-[#25231F] leading-snug group-hover:text-[#9B8065] transition-colors">
                      <Link href={`/product/${item.productId}`}>{item.name}</Link>
                    </h2>
                    <p className="mt-2 text-xs text-[#77736D] line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#EDE8DF]/60 space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-semibold text-[#25231F]">
                        {formatPrice(item.discountPrice)}
                      </span>
                      <span className="text-xs text-[#A5A19B] line-through">
                        {formatPrice(item.price)}
                      </span>
                    </div>

                    <AddToCartButton productId={item.productId} />

                    <button
                      type="button"
                      onClick={() => removeItem(item.wishlistItemId)}
                      disabled={removingId === item.wishlistItemId}
                      className="w-full text-center text-xs text-[#77736D] hover:text-rose-600 transition-colors py-1.5 disabled:opacity-50"
                    >
                      {removingId === item.wishlistItemId ? "Removing..." : "Remove from Wishlist"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
