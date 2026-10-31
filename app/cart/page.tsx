
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";


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
      error instanceof Error
        ? error.message
        : "Unable to remove item."
    );
  } finally {
    setRemovingId(null);
  }
}

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <p className="text-center text-gray-600">Loading your cart...</p>
      </main>
    );
  }

  if (error || !cart) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <p className="text-center text-red-600">
          {error || "Something went wrong."}
        </p>
        <div className="text-center mt-4">
          <Link href="/" className="text-indigo-600 underline">
            Back to shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            IntelliShop
          </Link>

          <Link href="/" className="text-indigo-600 font-medium">
            Continue Shopping
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold">Your Shopping Cart</h1>
        <p className="text-gray-500 mt-2">
          {cart.itemCount} item(s) in your cart
        </p>

        {cart.items.length === 0 ? (
          <div className="bg-white rounded-2xl border p-10 text-center mt-8">
            <div className="text-5xl mb-4">🛒</div>
            <h2 className="text-xl font-bold">Your cart is empty</h2>
            <p className="text-gray-500 mt-2">
              Explore our products and add something you like.
            </p>
            <Link
              href="/"
              className="inline-block mt-6 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <article
                  key={item.cartItemId}
                  className="bg-white rounded-2xl border p-5 flex gap-5 items-center"
                >
                  <div className="w-24 h-24 shrink-0 rounded-xl bg-indigo-50 flex items-center justify-center text-4xl">
                    🛍️
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-lg">{item.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.brand}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Quantity: {item.quantity}
                    </p>
                    <p className="font-semibold text-indigo-700 mt-2">
                      {money(item.unitPrice)} each
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold">
                      {money(item.lineTotal)}
                    </p>

                    <button
                      type="button"
                      onClick={() => handleRemove(item.cartItemId)}
                      disabled={removingId === item.cartItemId}
                      className="mt-3 text-sm text-red-600 hover:text-red-800 underline disabled:opacity-50"
                    >
                      {removingId === item.cartItemId
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <aside className="bg-white rounded-2xl border p-6 h-fit">
              <h2 className="text-xl font-bold">Order Summary</h2>

              <div className="flex justify-between mt-6 text-gray-600">
                <span>Items</span>
                <span>{cart.itemCount}</span>
              </div>

              <div className="flex justify-between mt-4 text-gray-600">
                <span>Subtotal</span>
                <span>{money(cart.total)}</span>
              </div>

              <div className="border-t mt-5 pt-5 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{money(cart.total)}</span> 
              </div>

              <Link
                href="/checkout"
                className="block w-full text-center rounded-lg bg-indigo-600 text-white py-3 font-semibold hover:bg-indigo-700 transition-colors"
              >
                Proceed to Checkout →
              </Link>

              <p className="text-xs text-gray-500 mt-3 text-center">
                Shipping and checkout will be added later.
              </p>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
