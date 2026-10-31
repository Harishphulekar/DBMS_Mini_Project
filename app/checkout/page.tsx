
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CartItem = {
  cartItemId: number;
  productId: number;
  name: string;
  brand: string;
  quantity: number;
  unitPrice: number | string;
  lineTotal: number | string;
};

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCart() {
      try {
        const response = await fetch("/api/cart/items", {
          cache: "no-store",
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setItems(data.items);
          setTotal(Number(data.total));
        }
      } catch (error) {
        console.error("Unable to load cart:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCart();
  }, []);

  const formatPrice = (price: number) =>
    `₹${price.toLocaleString("en-IN")}`;

  
async function handlePlaceOrder() {
  setError("");

  if (!fullName.trim() || !address.trim() || !/^[0-9]{10}$/.test(phone)) {
    setError("Please enter valid delivery details.");
    return;
  }

  setSubmitting(true);

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName,
        address,
        phone,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      setError(data.message || "Unable to place your order.");
      return;
    }

    router.push(`/order-confirmation/${data.orderId}`);
  } catch (error) {
    console.error("Order submission error:", error);
    setError("Something went wrong. Please try again.");
  } finally {
    setSubmitting(false);
  }
}


  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        Loading checkout...
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <p className="text-6xl mb-4">🛒</p>
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="text-gray-500 mt-2">
          Add some products before proceeding to checkout.
        </p>
        <Link
          href="/"
          className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold"
        >
          Continue Shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            IntelliShop
          </Link>
          <Link href="/cart" className="text-sm font-medium hover:text-indigo-600">
            ← Back to Cart
          </Link>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <p className="text-sm font-semibold text-indigo-600">
          ALMOST THERE!
        </p>
        <h1 className="text-3xl md:text-4xl font-bold mt-2 mb-8">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form
            className="lg:col-span-2 bg-white border rounded-2xl p-6 md:p-8 space-y-5"
            onSubmit={(event) => {
                        event.preventDefault();
                        void handlePlaceOrder();
                        }}>
            <h2 className="text-xl font-bold">Delivery Information</h2>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Full Name
              </label>
              <input
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Enter your full name"
                className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Delivery Address
              </label>
              <textarea
                required
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="House number, street, area, city, state and PIN code"
                rows={4}
                className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Phone Number
              </label>
              <input
                required
                type="tel"
                pattern="[0-9]{10}"
                maxLength={10}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="10-digit mobile number"
                className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
              />
            </div>

            <div className="border rounded-xl p-4 bg-indigo-50">
              <p className="font-semibold">Payment Method</p>
              <p className="text-sm text-gray-600 mt-1">
                Cash on Delivery (COD)
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Pay when your order is delivered.
              </p>
            </div>

            <button
            type="submit"
            disabled={submitting || items.length === 0}
            className="w-full rounded-lg bg-indigo-600 text-white py-3 font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
            {submitting ? "Placing Order..." : "Place Order"}
            </button>
            {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
            </p>
            )}
          </form>

          <aside className="bg-white border rounded-2xl p-6 h-fit">
            <h2 className="text-xl font-bold mb-5">Order Summary</h2>

            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="flex justify-between gap-3 text-sm"
                >
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-gray-500">
                      Qty: {item.quantity}
                    </p>
                  </div>

                  <p className="font-semibold whitespace-nowrap">
                    {formatPrice(Number(item.lineTotal))}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t mt-5 pt-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery</span>
                <span className="text-green-600">Free</span>
              </div>

              <div className="border-t pt-4 flex justify-between items-center">
                <span className="font-bold">Total</span>
                <span className="text-2xl font-bold text-indigo-600">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-5">
              Final price and stock availability will be verified when you place your order.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}
