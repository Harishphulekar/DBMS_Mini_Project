"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AddToCartButton from "./AddToCartButton";
import WishlistButton from "./WishlistButton";
import ProductImage from "./ProductImage";

export type StoreProduct = {
  id: number;
  name: string;
  description: string;
  price: number | string;
  discountPrice: number | string;
  brand: string;
  imageUrl: string;
  categoryId: number;
};

type Props = {
  products: StoreProduct[];
};

type SemanticSearchResponse = {
  success: boolean;
  message?: string;
  products: StoreProduct[];
};

const categories = [
  { id: "all", label: "All Curations" },
  { id: "1", label: "Electronics" },
  { id: "2", label: "Fashion" },
  { id: "3", label: "Home & Kitchen" },
  { id: "4", label: "Books" },
  { id: "5", label: "Beauty" },
];

const categoryNames: Record<number, string> = {
  1: "Electronics",
  2: "Fashion",
  3: "Home & Kitchen",
  4: "Books",
  5: "Beauty",
};

// Product emojis based on category ID
const productEmojis: Record<number, string> = {
  1: "🖱️",
  2: "👕",
  3: "🍳",
  4: "📚",
  5: "💄",
};

export default function ProductFilters({ products }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  // Semantic search states
  const [semanticProducts, setSemanticProducts] =
    useState<StoreProduct[] | null>(null);

  const [isSemanticSearching, setIsSemanticSearching] = useState(false);
  const [semanticError, setSemanticError] = useState("");

  // Restore previous search from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const previousSearch = params.get("search");

    if (previousSearch) {
      setSearch(previousSearch);
    }
  }, []);

  // Filter keyword or semantic search results
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const sourceProducts =
      semanticProducts !== null ? semanticProducts : products;

    return sourceProducts.filter((product) => {
      const matchesSearch =
        semanticProducts !== null ||
        !query ||
        [
          product.name,
          product.brand,
          product.description,
          categoryNames[product.categoryId] ?? "",
        ].some((value) => value?.toLowerCase().includes(query));

      const matchesCategory =
        category === "all" || product.categoryId === Number(category);

      return matchesSearch && matchesCategory;
    });
  }, [products, search, category, semanticProducts]);

  // Submit search to MySQL history and Qdrant
  async function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const queryText = search.trim();

    if (!queryText) {
      setSemanticProducts(null);
      setSemanticError("");
      return;
    }

    setIsSemanticSearching(true);
    setSemanticError("");

    try {
      // Save search history in MySQL
      try {
        const historyResponse = await fetch("/api/search-history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ queryText }),
        });

        if (!historyResponse.ok) {
          console.warn("Could not save search history.");
        }
      } catch (historyError) {
        console.error("Search history error:", historyError);
      }

      // Perform semantic search through Qdrant
      const response = await fetch("/api/semantic-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: queryText,
        }),
      });

      const data = (await response.json()) as SemanticSearchResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Semantic search failed.");
      }

      setSemanticProducts(data.products);
      setSemanticError("");
    } catch (error) {
      console.error("Semantic search error:", error);

      setSemanticProducts(null);

      setSemanticError(
        error instanceof Error
          ? error.message
          : "Something went wrong during semantic search."
      );
    } finally {
      setIsSemanticSearching(false);
    }
  }

  function formatPrice(price: number | string) {
    return Number(price).toLocaleString("en-IN");
  }

  function calculateDiscount(price: number | string, discountPrice: number | string) {
    const orig = Number(price);
    const disc = Number(discountPrice);
    if (orig > 0 && disc < orig) {
      return Math.round(((orig - disc) / orig) * 100);
    }
    return 0;
  }

  function clearFilters() {
    setSearch("");
    setCategory("all");
    setSemanticProducts(null);
    setSemanticError("");
  }

  return (
    <section id="products" className="max-w-7xl mx-auto px-6 py-20">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-[#EDE8DF]">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="h-px w-6 bg-[#9B8065]" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9B8065]">
              Curated Collection
            </p>
          </div>
          <h2 className="text-3xl md:text-5xl font-editorial font-medium text-[#25231F] tracking-tight">
            Designed for Modern Living
          </h2>
          <p className="mt-2 text-sm text-[#77736D] max-w-xl">
            Explore meticulously crafted pieces and intelligent essentials, backed by
            relational inventory precision and vector semantic matching.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-end">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EDE8DF] bg-white px-3.5 py-1.5 text-xs text-[#77736D]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#9B8065]" />
            {filteredProducts.length} of {products.length} Items Available
          </span>
        </div>
      </div>

      {/* Search & Intelligence Bar */}
      <div className="mt-8 mb-8 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4.5 text-[#9B8065]">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSemanticProducts(null);
                setSemanticError("");
              }}
              placeholder="Describe what you want (e.g. 'comfortable wireless audio' or 'minimalist linen')..."
              aria-label="Search products semantically or by keyword"
              className="w-full rounded-full border border-[#EDE8DF] bg-white pl-12 pr-4 py-3.5 text-sm text-[#25231F] placeholder-[#A5A19B] transition-all shadow-sm focus:border-[#9B8065] focus:bg-white"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSemanticSearching}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25231F] px-6 py-3.5 text-xs font-semibold uppercase tracking-widest text-[#F7F5F0] hover:bg-[#9B8065] active:scale-[0.98] transition-all duration-200 shadow-sm disabled:opacity-60"
            >
              {isSemanticSearching ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <span>Semantic Search</span>
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>

            {(search || category !== "all" || semanticProducts !== null) && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center rounded-full border border-[#EDE8DF] bg-white px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-[#77736D] hover:border-[#25231F] hover:text-[#25231F] transition-all"
              >
                Reset
              </button>
            )}
          </div>
        </form>

        {/* Semantic Status Banners */}
        {isSemanticSearching && (
          <div className="flex items-center gap-2.5 rounded-xl border border-[#9B8065]/20 bg-[#EDE8DF]/40 px-4 py-3 text-xs text-[#80664E]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9B8065] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#9B8065]" />
            </span>
            <span>Querying Qdrant vector database for semantic concept matches...</span>
          </div>
        )}

        {semanticError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-700">
            {semanticError}
          </div>
        )}

        {semanticProducts !== null && !semanticError && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs text-emerald-800">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Showing AI-powered semantic search results from Qdrant vector embeddings.
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className="font-semibold underline hover:text-emerald-950"
            >
              Clear semantic filter
            </button>
          </div>
        )}
      </div>

      {/* Category Pills Bar */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        {categories.map((item) => {
          const isActive = category === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              aria-pressed={isActive}
              className={`shrink-0 rounded-full px-5 py-2.5 text-xs uppercase tracking-wider font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-[#25231F] text-[#F7F5F0] shadow-sm"
                  : "bg-white text-[#77736D] border border-[#EDE8DF] hover:border-[#9B8065] hover:text-[#25231F]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#DDD6C9] bg-white/70 py-20 px-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EDE8DF]/60 text-[#9B8065] mb-4">
            <svg
              className="w-7 h-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h3 className="font-editorial text-2xl font-medium text-[#25231F]">
            No Matching Products Found
          </h3>
          <p className="mt-2 text-sm text-[#77736D] max-w-md mx-auto">
            We couldn&apos;t find any products matching your criteria. Try adjusting your
            search terms or browsing through all collections.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25231F] px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[#F7F5F0] hover:bg-[#9B8065] transition-colors"
          >
            View All Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product) => {
            const discountPct = calculateDiscount(product.price, product.discountPrice);

            return (
              <article
                key={product.id}
                className="group flex flex-col justify-between rounded-2xl bg-white border border-[#EDE8DF] overflow-hidden hover:border-[#9B8065]/40 hover:shadow-[0_12px_36px_rgba(37,35,31,0.06)] transition-all duration-300"
              >
                {/* Product Image Presentation */}
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#EDE8DF]/40">
                  <Link
                    href={`/product/${product.id}`}
                    className="block w-full h-full"
                    aria-label={`View ${product.name}`}
                  >
                    <ProductImage
                      productId={product.id}
                      imageUrl={product.imageUrl}
                      name={product.name}
                      categoryId={product.categoryId}
                      fit="contain"
                    />
                  </Link>

                  {/* Floating Wishlist Button */}
                  <WishlistButton productId={product.id} />

                  {/* Floating Discount Badge */}
                  {discountPct > 0 && (
                    <div className="absolute left-3.5 top-3.5 z-10 rounded-full bg-[#25231F]/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#F7F5F0]">
                      {discountPct}% OFF
                    </div>
                  )}

                  {/* Subtle category tag overlay */}
                  <div className="absolute bottom-3 left-3.5 z-10 pointer-events-none">
                    <span className="rounded-full bg-white/85 backdrop-blur-md px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-[#80664E] border border-white/60">
                      {categoryNames[product.categoryId] ?? "Item"}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    {product.brand && (
                      <p className="text-[11px] uppercase tracking-wider text-[#77736D] font-medium">
                        {product.brand}
                      </p>
                    )}

                    <h3 className="mt-1 font-editorial text-lg font-medium text-[#25231F] leading-snug group-hover:text-[#9B8065] transition-colors">
                      <Link href={`/product/${product.id}`}>{product.name}</Link>
                    </h3>

                    <p className="mt-2 text-xs text-[#77736D] line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#EDE8DF]/60">
                    <div className="flex items-baseline justify-between mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-semibold text-[#25231F]">
                          ₹{formatPrice(product.discountPrice)}
                        </span>
                        {discountPct > 0 && (
                          <span className="text-xs text-[#A5A19B] line-through">
                            ₹{formatPrice(product.price)}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-[#9B8065] font-semibold">
                        In Stock
                      </span>
                    </div>

                    <AddToCartButton productId={product.id} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
