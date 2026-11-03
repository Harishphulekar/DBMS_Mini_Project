
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AddToCartButton from "@/app/AddToCartButton";
import WishlistButton from "@/app/WishlistButton";

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  discountPrice: number;
  brand: string | null;
  imageUrl: string | null;
  categoryId: number;
  categoryName: string | null;
  stockQuantity: number;
};

const productEmojis: Record<number, string> = {
  1: "🖱️",
  2: "📱",
  3: "👕",
  4: "📚",
  5: "💄",
};

export default function ProductDetailsClient({
  productId,
}: {
  productId: string;
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/products/${encodeURIComponent(productId)}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Product not found.");
        }

        if (!cancelled) {
          setProduct(data.product);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load product."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  function formatPrice(price: number) {
    return price.toLocaleString("en-IN");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">
          Loading product details...
        </p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <p className="mt-3 text-gray-600">{error}</p>

        <Link
          href="/"
          className="mt-5 rounded-lg bg-indigo-600 px-5 py-3 text-white"
        >
          Back to Store
        </Link>
      </main>
    );
  }

  const discount =
    product.price > 0 && product.discountPrice < product.price
      ? Math.round(
          ((product.price - product.discountPrice) /
            product.price) *
            100
        )
      : 0;

  const productEmoji = productEmojis[product.id] ?? "🛍️";

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            IntelliShop
          </Link>

          <Link href="/" className="text-indigo-600 hover:underline">
            Back to Products
          </Link>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Original-style emoji product illustration */}
          <div className="relative rounded-2xl bg-indigo-50 border border-gray-200 min-h-[350px] flex items-center justify-center p-8">
            <div className="text-9xl" role="img" aria-label={product.name}>
              {productEmoji}
            </div>

            <div className="absolute right-4 top-4">
              <WishlistButton productId={product.id} />
            </div>
          </div>

          {/* Product information */}
          <div className="flex flex-col">
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
              {product.categoryName || "IntelliShop Product"}
            </p>

            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-gray-900">
              {product.name}
            </h1>

            {product.brand && (
              <p className="mt-3 text-gray-500">
                Brand: {product.brand}
              </p>
            )}

            <div className="mt-7 flex items-center gap-3 flex-wrap">
              <span className="text-3xl font-bold text-gray-900">
                ₹{formatPrice(product.discountPrice)}
              </span>

              {discount > 0 && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    ₹{formatPrice(product.price)}
                  </span>

                  <span className="rounded-md bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Stock information */}
            <div className="mt-7">
              {product.stockQuantity > 0 ? (
                <p className="font-semibold text-green-700">
                  ✓ In Stock ({product.stockQuantity} available)
                </p>
              ) : (
                <p className="font-semibold text-red-600">
                  Currently Out of Stock
                </p>
              )}
            </div>

            {/* Description */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h2 className="text-xl font-bold">
                Product Description
              </h2>

              <p className="mt-3 leading-7 text-gray-600 whitespace-pre-line">
                {product.description || "No description available."}
              </p>
            </div>

            {/* Add to Cart */}
            <div className="mt-8">
              {product.stockQuantity > 0 ? (
                <AddToCartButton productId={product.id} />
              ) : (
                <button
                  disabled
                  className="w-full rounded-lg bg-gray-300 py-3 font-semibold text-gray-600"
                >
                  Out of Stock
                </button>
              )}
            </div>

            <p className="mt-5 text-sm text-gray-500">
              Product ID: {product.id}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
