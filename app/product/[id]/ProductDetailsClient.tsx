"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AddToCartButton from "@/app/AddToCartButton";
import WishlistButton from "@/app/WishlistButton";
import ProductImage from "@/app/ProductImage";
import CartNavLink from "@/app/CartNavLink";
import WishlistNavLink from "@/app/WishlistNavLink";

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
            err instanceof Error ? err.message : "Unable to load product."
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
      <main className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#9B8065] border-t-transparent" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#77736D]">
            Loading Product Details...
          </p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center p-6 text-center">
        <div className="rounded-3xl border border-[#EDE8DF] bg-white p-12 max-w-md shadow-sm">
          <h1 className="font-editorial text-3xl font-medium text-[#25231F]">
            Product Not Found
          </h1>
          <p className="mt-3 text-xs text-[#77736D] leading-relaxed">
            {error || "The requested item is currently unavailable in the inventory."}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25231F] px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[#F7F5F0] hover:bg-[#9B8065] transition-colors"
          >
            ← Back to Storefront
          </Link>
        </div>
      </main>
    );
  }

  const discount =
    product.price > 0 && product.discountPrice < product.price
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : 0;

  return (
    <main className="min-h-screen bg-[#F7F5F0] text-[#25231F]">
      {/* Editorial Header */}
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

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs uppercase tracking-wider font-semibold text-[#77736D] hover:text-[#25231F] transition-colors hidden sm:inline"
            >
              ← Back to Collection
            </Link>
            <div className="h-4 w-px bg-[#EDE8DF] hidden sm:block" />
            <WishlistNavLink />
            <CartNavLink />
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-4">
        <nav className="flex items-center gap-2 text-xs text-[#77736D]">
          <Link href="/" className="hover:text-[#25231F] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#80664E] font-medium">
            {product.categoryName || "Product"}
          </span>
          <span>/</span>
          <span className="text-[#25231F] truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      {/* Main Product Showcase Section */}
      <section className="max-w-7xl mx-auto px-6 py-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Product Photography Display */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl overflow-hidden border border-[#EDE8DF] bg-white shadow-sm aspect-[4/5] sm:aspect-square group">
              <ProductImage
                productId={product.id}
                imageUrl={product.imageUrl}
                name={product.name}
                categoryId={product.categoryId}
                fit="contain"
              />

              {/* Floating Wishlist Control */}
              <WishlistButton productId={product.id} />

              {/* Floating Discount Pill */}
              {discount > 0 && (
                <div className="absolute left-6 top-6 z-10 rounded-full bg-[#25231F]/90 backdrop-blur-md px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#F7F5F0]">
                  Save {discount}%
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Product Intelligence & Buying Panel */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#9B8065]" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9B8065]">
                  {product.categoryName || "Curated Edition"}
                </p>
              </div>

              <h1 className="mt-3 font-editorial text-3xl sm:text-4xl lg:text-5xl font-medium text-[#25231F] leading-tight">
                {product.name}
              </h1>

              {product.brand && (
                <p className="mt-2 text-xs uppercase tracking-wider text-[#77736D] font-medium">
                  By {product.brand}
                </p>
              )}
            </div>

            {/* Price Presentation */}
            <div className="p-6 rounded-2xl bg-white border border-[#EDE8DF] space-y-3">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-editorial text-3xl sm:text-4xl font-semibold text-[#25231F]">
                  ₹{formatPrice(product.discountPrice)}
                </span>

                {discount > 0 && (
                  <>
                    <span className="text-sm text-[#A5A19B] line-through">
                      ₹{formatPrice(product.price)}
                    </span>
                    <span className="rounded-full bg-[#EDE8DF] px-2.5 py-0.5 text-[10px] font-bold text-[#80664E] uppercase tracking-wider">
                      {discount}% OFF
                    </span>
                  </>
                )}
              </div>

              {/* Stock Status Pill */}
              <div className="pt-2">
                {product.stockQuantity > 0 ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    <span>In Stock · {product.stockQuantity} available for delivery</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                    <span>Currently Out of Stock</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#25231F]">
                Product Overview
              </h2>
              <p className="text-sm leading-relaxed text-[#77736D] whitespace-pre-line bg-white/60 p-5 rounded-2xl border border-[#EDE8DF]">
                {product.description || "No specific details provided for this curation."}
              </p>
            </div>

            {/* Add to Bag Action */}
            <div className="pt-2">
              {product.stockQuantity > 0 ? (
                <AddToCartButton productId={product.id} className="py-4 text-sm" />
              ) : (
                <button
                  disabled
                  className="w-full rounded-full bg-[#EDE8DF] py-4 text-xs font-semibold uppercase tracking-widest text-[#77736D] cursor-not-allowed"
                >
                  Sold Out
                </button>
              )}
            </div>

            {/* Trust & Database Feature Notes */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#EDE8DF]">
              <div className="flex items-start gap-2.5">
                <span className="text-[#9B8065] text-sm mt-0.5">✓</span>
                <div>
                  <p className="text-xs font-semibold text-[#25231F]">ACID Guaranteed</p>
                  <p className="text-[10px] text-[#77736D]">Atomic MySQL checkout lock</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-[#9B8065] text-sm mt-0.5">✓</span>
                <div>
                  <p className="text-xs font-semibold text-[#25231F]">Vector Indexed</p>
                  <p className="text-[10px] text-[#77736D]">Cosine similarity matched</p>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#A5A19B] text-center pt-2">
              Product Reference ID: #{product.id}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
