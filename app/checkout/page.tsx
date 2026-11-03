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

  const formatPrice = (price: number) => `₹${price.toLocaleString("en-IN")}`;

  async function handlePlaceOrder() {
    setError("");

    if (!fullName.trim() || !address.trim() || !/^[0-9]{10}$/.test(phone)) {
      setError("Please provide a valid full name, complete address, and a 10-digit phone number.");
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
      setError("Something went wrong while placing your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#9B8065] border-t-transparent" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#77736D]">
            Preparing Checkout...
          </p>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-6 text-center">
        <div className="rounded-3xl border border-[#EDE8DF] bg-white p-12 max-w-md shadow-sm">
          <p className="font-editorial text-2xl font-medium text-[#25231F]">
            Your Bag is Empty
          </p>
          <p className="mt-2 text-xs text-[#77736D]">
            Add items to your bag before proceeding to checkout.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-[#25231F] px-8 py-3 text-xs font-semibold uppercase tracking-widest text-white hover:bg-[#9B8065] transition-colors"
          >
            Browse Collection
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
            href="/cart"
            className="text-xs font-semibold uppercase tracking-wider text-[#77736D] hover:text-[#25231F] transition-colors"
          >
            ← Return to Bag
          </Link>
        </div>
      </header>

      {/* Checkout Form Section */}
      <section className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        <div className="pb-8 border-b border-[#EDE8DF]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9B8065]">
            Final Step
          </p>
          <h1 className="mt-1 font-editorial text-4xl sm:text-5xl font-medium text-[#25231F]">
            Secure Checkout
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-10 items-start">
          {/* Form Side */}
          <form
            className="lg:col-span-7 rounded-3xl bg-white border border-[#EDE8DF] p-8 md:p-10 shadow-sm space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              void handlePlaceOrder();
            }}
          >
            <div>
              <h2 className="font-editorial text-2xl font-medium text-[#25231F]">
                Delivery Information
              </h2>
              <p className="text-xs text-[#77736D] mt-1">
                Provide the shipping address for physical delivery.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#25231F] mb-2">
                Full Recipient Name *
              </label>
              <input
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="e.g. John Doe"
                className="w-full rounded-xl border border-[#EDE8DF] bg-[#F7F5F0]/30 px-4 py-3.5 text-sm text-[#25231F] placeholder-[#A5A19B] transition-all focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#25231F] mb-2">
                Delivery Address *
              </label>
              <textarea
                required
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Apartment, building, street address, city, state, and postal PIN code"
                rows={4}
                className="w-full rounded-xl border border-[#EDE8DF] bg-[#F7F5F0]/30 px-4 py-3.5 text-sm text-[#25231F] placeholder-[#A5A19B] transition-all focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#25231F] mb-2">
                10-Digit Phone Number *
              </label>
              <input
                required
                type="tel"
                pattern="[0-9]{10}"
                maxLength={10}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="10-digit mobile number"
                className="w-full rounded-xl border border-[#EDE8DF] bg-[#F7F5F0]/30 px-4 py-3.5 text-sm text-[#25231F] placeholder-[#A5A19B] transition-all focus:bg-white"
              />
            </div>

            {/* Payment Method Presentation */}
            <div className="rounded-2xl border border-[#EDE8DF] bg-[#F7F5F0]/50 p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#25231F]">
                  Payment Method
                </span>
                <span className="rounded-full bg-[#EDE8DF] px-2.5 py-0.5 text-[10px] font-bold text-[#80664E] uppercase tracking-wider">
                  Verified COD
                </span>
              </div>
              <p className="text-sm font-medium text-[#25231F]">
                Cash on Delivery (Doorstep Payment)
              </p>
              <p className="text-xs text-[#77736D]">
                Pay conveniently in cash or UPI when your order is delivered to your address.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="w-full rounded-full bg-[#25231F] py-4 text-xs font-semibold uppercase tracking-widest text-[#F7F5F0] hover:bg-[#9B8065] active:scale-[0.99] transition-all duration-200 shadow-md disabled:opacity-50"
            >
              {submitting ? "Placing Order..." : "Confirm & Place Order"}
            </button>
          </form>

          {/* Right Summary */}
          <aside className="lg:col-span-5 rounded-3xl bg-white border border-[#EDE8DF] p-8 shadow-sm lg:sticky lg:top-28">
            <h2 className="font-editorial text-2xl font-medium text-[#25231F]">
              Review Items ({items.length})
            </h2>

            <div className="mt-6 divide-y divide-[#EDE8DF]/60 max-h-72 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.cartItemId} className="py-3.5 flex justify-between items-start gap-4 text-xs">
                  <div>
                    <p className="font-medium text-[#25231F]">{item.name}</p>
                    <p className="text-[#77736D] mt-0.5">
                      Qty: {item.quantity} · {item.brand}
                    </p>
                  </div>
                  <p className="font-semibold text-[#25231F] whitespace-nowrap">
                    {formatPrice(Number(item.lineTotal))}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-[#EDE8DF] mt-6 pt-5 space-y-3 text-xs">
              <div className="flex justify-between text-[#77736D]">
                <span>Subtotal</span>
                <span className="font-semibold text-[#25231F]">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-[#77736D]">
                <span>Delivery</span>
                <span className="font-semibold text-emerald-700">Complimentary</span>
              </div>
              <div className="border-t border-[#EDE8DF] pt-4 flex justify-between items-baseline">
                <span className="text-sm font-semibold uppercase tracking-wider text-[#25231F]">
                  Order Total
                </span>
                <span className="font-editorial text-3xl font-semibold text-[#25231F]">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#EDE8DF] text-[11px] text-[#77736D] leading-relaxed">
              Order submission executes a MySQL transaction that reserves stock atomically and
              creates relational invoice records.
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
