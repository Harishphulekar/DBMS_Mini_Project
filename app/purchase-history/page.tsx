
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
          err instanceof Error
            ? err.message
            : "Something went wrong."
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

  // Group purchased products by order ID.
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
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            IntelliShop
          </Link>

          <Link
            href="/"
            className="text-sm font-medium hover:text-indigo-600"
          >
            Continue Shopping
          </Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <p className="text-sm font-semibold text-indigo-600">
          YOUR SHOPPING ACTIVITY
        </p>

        <h1 className="text-3xl font-bold mt-2">
          Purchase History
        </h1>

        <p className="text-gray-500 mt-2">
          View your previous orders and purchased products.
        </p>

        {loading && (
          <p className="mt-10 text-gray-500">
            Loading your purchase history...
          </p>
        )}

        {error && (
          <p className="mt-8 text-red-600 bg-red-50 p-4 rounded-lg">
            {error}
          </p>
        )}

        {!loading && !error && purchases.length === 0 && (
          <div className="mt-10 bg-white border rounded-2xl p-10 text-center">
            <p className="text-5xl mb-4">📦</p>
            <h2 className="text-xl font-bold">
              No purchases yet
            </h2>
            <p className="text-gray-500 mt-2">
              Your completed orders will appear here.
            </p>
            <Link
              href="/"
              className="inline-block mt-6 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Explore Products
            </Link>
          </div>
        )}

        {!loading && !error && (
          <div className="mt-8 space-y-6">
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
                    className="bg-white border rounded-2xl overflow-hidden"
                  >
                    <div className="p-5 md:p-6 border-b bg-gray-50 flex flex-wrap justify-between gap-4">
                      <div>
                        <p className="font-bold text-lg">
                          Order #{orderId}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(firstItem.purchaseDate)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
                          {firstItem.orderStatus}
                        </span>
                        <p className="font-bold mt-2">
                          {formatPrice(orderTotal)}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 md:p-6 space-y-5">
                      {orderItems.map((item) => (
                        <div
                          key={item.orderItemId}
                          className="flex items-center gap-4"
                        >
                          <div className="w-16 h-16 rounded-xl bg-indigo-50 flex items-center justify-center text-3xl shrink-0">
                            🛍️
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold">
                              {item.productName}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {item.brand}
                            </p>
                            <p className="text-sm text-gray-500">
                              Quantity: {item.quantity}
                            </p>
                          </div>

                          <p className="font-semibold whitespace-nowrap">
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
