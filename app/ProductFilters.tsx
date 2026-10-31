
"use client";

import { useEffect, useMemo, useState } from "react";
import AddToCartButton from "./AddToCartButton";
import WishlistButton from "./WishlistButton";

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

const categories = [
  { id: "all", label: "All Products" },
  { id: "1", label: "Electronics" },
  { id: "2", label: "Fashion" },
  { id: "3", label: "Books" },
  { id: "4", label: "Home & Kitchen" },
];

const categoryNames: Record<number, string> = {
  1: "Electronics",
  2: "Fashion",
  3: "Books",
  4: "Home & Kitchen",
};

const productEmojis: Record<number, string> = {
  1: "🎧",
  2: "📱",
  3: "👕",
  4: "📚",
  5: "☕",
};

export default function ProductFilters({ products }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  // Read a previous search from the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const previousSearch = params.get("search");

    if (previousSearch) {
      setSearch(previousSearch);
    }
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        [
          product.name,
          product.brand,
          product.description,
          categoryNames[product.categoryId] ?? "",
        ].some((value) => value?.toLowerCase().includes(query));

      const matchesCategory =
        category === "all" ||
        product.categoryId === Number(category);

      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  // Save the search in MySQL when the customer submits it.
  async function handleSearchSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const queryText = search.trim();

    if (!queryText) return;

    try {
      const response = await fetch("/api/search-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ queryText }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save search.");
      }

      console.log("Search saved:", queryText);
    } catch (error) {
      console.error("Search history error:", error);
    }
  }

  function formatPrice(price: number | string) {
    return Number(price).toLocaleString("en-IN");
  }

  function clearFilters() {
    setSearch("");
    setCategory("all");
  }

  return (
    <section id="products" className="max-w-7xl mx-auto px-6 py-14">
      <div className="flex flex-wrap justify-between items-end gap-3 mb-8">
        <div>
          <p className="text-sm font-semibold text-indigo-600">
            OUR COLLECTION
          </p>
          <h2 className="text-3xl font-bold mt-2">
            Featured Products
          </h2>
        </div>

        <p className="text-gray-500">
          {filteredProducts.length} of {products.length} products
        </p>
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex-1 flex gap-2"
        >
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2">
              🔍
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products, brands, or descriptions..."
              aria-label="Search products"
              className="w-full rounded-xl border border-gray-300 bg-white pl-11 pr-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-indigo-600 text-white px-5 py-3 font-semibold hover:bg-indigo-700 transition-colors"
          >
            Search
          </button>
        </form>

        <button
          type="button"
          onClick={clearFilters}
          className="rounded-xl border border-gray-300 px-5 py-3 hover:bg-gray-100"
        >
          Clear filters
        </button>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap mb-8">
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCategory(item.id)}
            aria-pressed={category === item.id}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
              category === item.id
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:border-indigo-400"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Products */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-4xl mb-3">🔎</p>

          <h3 className="text-xl font-bold">
            No products found
          </h3>

          <p className="text-gray-500 mt-2">
            Try another search term or choose a different category.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 rounded-lg bg-indigo-600 px-5 py-2.5 text-white font-semibold"
          >
            Show all products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-44 bg-indigo-50 flex items-center justify-center text-7xl">
                {productEmojis[product.id] ?? "🛍️"}
                <WishlistButton productId={product.id} />
              </div>

              <div className="p-5">
                <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">
                  {categoryNames[product.categoryId] ?? "Products"}
                </p>

                <h3 className="font-bold text-lg mt-2">
                  {product.name}
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  {product.brand}
                </p>

                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {product.description}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <span className="font-bold text-lg">
                    ₹{formatPrice(product.discountPrice)}
                  </span>

                  <span className="text-sm text-gray-400 line-through">
                    ₹{formatPrice(product.price)}
                  </span>
                </div>

                <ProductCartButton productId={product.id} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ProductCartButton({ productId }: { productId: number }) {
  return <AddToCartButton productId={productId} />;
}
