"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductImage from "../ProductImage";

type CartItem = {
  cartItemId: number;
  productId: number;
  name: string;
  description: string;
  brand: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type CartData = {
  success: boolean;
  items: CartItem[];
  total: number;
  itemCount: number;
};

function money(amount: number) {
  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    async function loadCart() {
      try {
        const response = await fetch("/api/cart/items", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load cart.");
        }

        setCart(data);
      } catch {
        setError("Could not load your cart. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }

    loadCart();
  }, []);

  async function refreshCart() {
    const response = await fetch("/api/cart/items", {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Unable to load cart.");
    }

    setCart(data);
  }

  async function handleRemove(cartItemId: number) {
    setRemovingId(cartItemId);
    setError("");

    try {
      const response = await fetch("/api/cart/items", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cartItemId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to remove item.");
      }

      await refreshCart();
      window.dispatchEvent(new Event("cart-updated"));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to remove item."
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
            Loading Your Shopping Bag...
          </p>
        </div>
      </main>
    );
  }

  if (error || !cart) {
    return (
      <main className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-6 text-center">
        <div className="rounded-3xl border border-[#EDE8DF] bg-white p-10 max-w-md shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">
            Cart Error
          </p>
          <p className="mt-2 text-sm text-[#77736D]">
            {error || "Something went wrong while retrieving your cart."}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-[#25231F] px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-white hover:bg-[#9B8065] transition-colors"
          >
            Return to Store
          </Link>
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

          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-wider text-[#77736D] hover:text-[#25231F] transition-colors"
          >
            ← Continue Shopping
          </Link>
        </div>
      </header>

      {/* Main Cart Section */}
      <section className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#EDE8DF]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9B8065]">
              Review Selection
            </p>
            <h1 className="mt-1 font-editorial text-4xl sm:text-5xl font-medium text-[#25231F]">
              Shopping Bag
            </h1>
          </div>
          <p className="text-xs uppercase tracking-wider text-[#77736D] font-medium">
            {cart.itemCount} {cart.itemCount === 1 ? "Item" : "Items"} in Bag
          </p>
        </div>

        {cart.items.length === 0 ? (
          <div className="my-16 rounded-3xl border border-dashed border-[#DDD6C9] bg-white/70 p-16 text-center max-w-lg mx-auto">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EDE8DF]/60 text-[#9B8065] mb-4">
              <svg
                className="w-7 h-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <h2 className="font-editorial text-2xl font-medium text-[#25231F]">
              Your Bag is Empty
            </h2>
            <p className="mt-2 text-xs text-[#77736D] leading-relaxed">
              Discover curated luxury essentials and intelligent products from our collection.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25231F] px-8 py-3.5 text-xs font-semibold uppercase tracking-widest text-[#F7F5F0] hover:bg-[#9B8065] transition-colors"
            >
              Start Exploring
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-10 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-7 space-y-4">
              {cart.items.map((item) => (
                <article
                  key={item.cartItemId}
                  className="rounded-2xl bg-white border border-[#EDE8DF] p-5 flex gap-5 items-center hover:border-[#9B8065]/30 transition-all shadow-sm"
                >
                  {/* Product Image Thumbnail */}
                  <div className="w-20 h-24 sm:w-24 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-[#EDE8DF]/40 border border-[#EDE8DF]">
                    <ProductImage
                      productId={item.productId}
                      imageUrl={item.imageUrl}
                      name={item.name}
                      fit="contain"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    {item.brand && (
                      <p className="text-[10px] uppercase tracking-wider text-[#9B8065] font-semibold">
                        {item.brand}
                      </p>
                    )}
                    <h2 className="font-editorial text-lg sm:text-xl font-medium text-[#25231F] truncate">
                      <Link href={`/product/${item.productId}`} className="hover:text-[#9B8065] transition-colors">
                        {item.name}
                      </Link>
                    </h2>
                    <p className="text-xs text-[#77736D] mt-1">
                      Quantity: <span className="font-semibold text-[#25231F]">{item.quantity}</span>
                    </p>
                    <p className="text-xs text-[#80664E] font-medium mt-1">
                      {money(item.unitPrice)} each
                    </p>
                  </div>

                  {/* Line Total & Remove Action */}
                  <div className="text-right shrink-0">
                    <p className="font-editorial text-lg font-semibold text-[#25231F]">
                      {money(item.lineTotal)}
                    </p>

                    <button
                      type="button"
                      onClick={() => handleRemove(item.cartItemId)}
                      disabled={removingId === item.cartItemId}
                      className="mt-3 text-xs text-[#77736D] hover:text-rose-600 transition-colors disabled:opacity-50 underline decoration-[#EDE8DF]"
                    >
                      {removingId === item.cartItemId ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Order Summary Aside */}
            <aside className="lg:col-span-5 rounded-3xl bg-white border border-[#EDE8DF] p-8 shadow-sm lg:sticky lg:top-28">
              <h2 className="font-editorial text-2xl font-medium text-[#25231F]">
                Order Summary
              </h2>

              <div className="mt-6 space-y-3.5 text-xs">
                <div className="flex justify-between text-[#77736D]">
                  <span>Total Items</span>
                  <span className="font-semibold text-[#25231F]">{cart.itemCount}</span>
                </div>

                <div className="flex justify-between text-[#77736D]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#25231F]">{money(cart.total)}</span>
                </div>

                <div className="flex justify-between text-[#77736D]">
                  <span>Delivery</span>
                  <span className="font-semibold text-emerald-700">Complimentary</span>
                </div>

                <div className="border-t border-[#EDE8DF] pt-4 mt-4 flex justify-between items-baseline">
                  <span className="text-sm font-semibold uppercase tracking-wider text-[#25231F]">
                    Total Amount
                  </span>
                  <span className="font-editorial text-3xl font-semibold text-[#25231F]">
                    {money(cart.total)}
                  </span>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href="/checkout"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#25231F] py-4 text-xs font-semibold uppercase tracking-widest text-[#F7F5F0] hover:bg-[#9B8065] active:scale-[0.99] transition-all duration-200 shadow-md"
                >
                  <span>Proceed to Checkout</span>
                  <span>→</span>
                </Link>
              </div>

              <div className="mt-6 pt-6 border-t border-[#EDE8DF] space-y-2 text-[11px] text-[#77736D]">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700">✓</span>
                  <span>ACID Transaction Safeguard</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700">✓</span>
                  <span>Cash on Delivery (Pay at Doorstep)</span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
