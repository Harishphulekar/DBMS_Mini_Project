"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductImage from "../ProductImage";

type Purchase = {
  orderId: number;
  orderItemId: number;
  productId: number;
  productName: string;
  brand: string;
  imageUrl: string;
  purchaseDate: string;
  orderStatus: string;
  quantity: number;
  unitPrice: number | string;
  totalPrice: number | string;
};

export default function PurchaseHistoryPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHistory() {
      try {
        const response = await fetch("/api/purchase-history", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load purchase history.");
        }

        setPurchases(data.items);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  const formatPrice = (price: number | string) =>
    `₹${Number(price).toLocaleString("en-IN")}`;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  // Group purchased products by order ID
  const groupedOrders = purchases.reduce<Record<number, Purchase[]>>(
    (groups, purchase) => {
      if (!groups[purchase.orderId]) {
        groups[purchase.orderId] = [];
      }

      groups[purchase.orderId].push(purchase);
      return groups;
    },
    {}
  );

  return (
    <main className="min-h-screen bg-[#F7F5F0] text-[#25231F]">
      {/* Header */}
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

      {/* Main Section */}
      <section className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        <div className="pb-8 border-b border-[#EDE8DF]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9B8065]">
            Account Activity
          </p>
          <h1 className="mt-1 font-editorial text-4xl sm:text-5xl font-medium text-[#25231F]">
            Purchase History
          </h1>
          <p className="text-xs text-[#77736D] mt-2">
            Inspect all past orders, line items, and delivery statuses recorded in your DBMS profile.
          </p>
        </div>

        {loading && (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#9B8065] border-t-transparent" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#77736D]">
              Loading Purchase Records...
            </p>
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-700">
            {error}
          </div>
        )}

        {!loading && !error && purchases.length === 0 && (
          <div className="my-16 rounded-3xl border border-dashed border-[#DDD6C9] bg-white/70 p-16 text-center max-w-lg mx-auto">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EDE8DF]/60 text-[#9B8065] mb-4">
              <svg
                className="w-7 h-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <h2 className="font-editorial text-2xl font-medium text-[#25231F]">
              No Orders Yet
            </h2>
            <p className="mt-2 text-xs text-[#77736D] leading-relaxed">
              When you complete an order, your transaction records and order items will be
              displayed here.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25231F] px-8 py-3.5 text-xs font-semibold uppercase tracking-widest text-[#F7F5F0] hover:bg-[#9B8065] transition-colors"
            >
              Explore Collection
            </Link>
          </div>
        )}

        {!loading && !error && purchases.length > 0 && (
          <div className="mt-10 space-y-8">
            {Object.entries(groupedOrders)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([orderId, orderItems]) => {
                const firstItem = orderItems[0];
                const orderTotal = orderItems.reduce(
                  (sum, item) => sum + Number(item.totalPrice),
                  0
                );

                return (
                  <article
                    key={orderId}
                    className="rounded-3xl bg-white border border-[#EDE8DF] overflow-hidden shadow-sm hover:border-[#9B8065]/40 transition-all duration-300"
                  >
                    {/* Order Header */}
                    <div className="p-6 md:p-7 border-b border-[#EDE8DF] bg-[#F7F5F0]/40 flex flex-wrap justify-between items-center gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-editorial text-xl font-bold text-[#25231F]">
                            Order #{orderId}
                          </p>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDE8DF] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#80664E]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#9B8065]" />
                            {firstItem.orderStatus}
                          </span>
                        </div>
                        <p className="text-xs text-[#77736D] mt-1">
                          Placed on {formatDate(firstItem.purchaseDate)} · Cash on Delivery
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-[#77736D]">
                          Total Paid
                        </p>
                        <p className="font-editorial text-2xl font-bold text-[#25231F]">
                          {formatPrice(orderTotal)}
                        </p>
                      </div>
                    </div>

                    {/* Order Line Items */}
                    <div className="p-6 md:p-7 divide-y divide-[#EDE8DF]/60 space-y-4">
                      {orderItems.map((item) => (
                        <div
                          key={item.orderItemId}
                          className="pt-4 first:pt-0 flex items-center gap-5"
                        >
                          <div className="w-16 h-18 sm:w-20 sm:h-22 rounded-xl overflow-hidden bg-[#EDE8DF]/40 border border-[#EDE8DF] shrink-0">
                            <ProductImage
                              productId={item.productId}
                              imageUrl={item.imageUrl}
                              name={item.productName}
                              fit="contain"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            {item.brand && (
                              <p className="text-[10px] uppercase tracking-wider text-[#9B8065] font-semibold">
                                {item.brand}
                              </p>
                            )}
                            <h3 className="font-editorial text-base sm:text-lg font-medium text-[#25231F] truncate">
                              <Link
                                href={`/product/${item.productId}`}
                                className="hover:text-[#9B8065] transition-colors"
                              >
                                {item.productName}
                              </Link>
                            </h3>
                            <p className="text-xs text-[#77736D] mt-0.5">
                              Quantity: {item.quantity} · Unit Price: {formatPrice(item.unitPrice)}
                            </p>
                          </div>

                          <p className="font-editorial text-lg font-semibold text-[#25231F] whitespace-nowrap">
                            {formatPrice(item.totalPrice)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
          </div>
        )}
      </section>
    </main>
  );
}
