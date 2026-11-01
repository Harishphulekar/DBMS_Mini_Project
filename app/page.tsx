
import { Suspense } from "react";
import pool from "@/lib/db";
import AddToCartButton from "./AddToCartButton";
import CartNavLink from "./CartNavLink";
import ProductFilters, { type StoreProduct } from "./ProductFilters";
import WishlistNavLink from "./WishlistNavLink";
import { connection } from "next/server";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number | string;
  discountPrice: number | string;
  brand: string;
  imageUrl: string;
  categoryId: number;
};

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

async function ProductCatalog() {
  await connection();

  const [rows] = await pool.query(`
    SELECT
      product_id AS id,
      product_name AS name,
      description,
      price,
      discount_price AS discountPrice,
      brand,
      image_url AS imageUrl,
      category_id AS categoryId
    FROM product
    ORDER BY product_id
  `);

  const products = rows as StoreProduct[];

  return <ProductFilters products={products} />;
}


function Storefront() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <a href="/" className="text-2xl font-bold text-indigo-600">
            IntelliShop
          </a>
          <nav className="flex gap-5 text-sm font-medium items-center">
            <a href="#products" className="hover:text-indigo-600">
              Products
            </a>
            <a href="#features" className="hover:text-indigo-600">
              Features
            </a>
            <a href="/purchase-history">
              Purchase History
            </a>
            <WishlistNavLink />
            <CartNavLink />
          </nav>
        </div>
      </header>

      <section className="bg-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <p className="text-indigo-200 font-semibold mb-3">
            SMARTER SHOPPING STARTS HERE
          </p>
          <h1 className="text-4xl md:text-6xl font-bold max-w-3xl leading-tight">
            Find products that fit your world.
          </h1>
          <p className="mt-5 max-w-xl text-indigo-100 text-lg">
            Discover products, intelligent search, and personalized
            recommendations.
          </p>
          <a
            href="#products"
            className="inline-block mt-8 bg-white text-indigo-700 px-6 py-3 rounded-lg font-semibold"
          >
            Explore Products
          </a>
        </div>
      </section>

      <Suspense
        fallback={
          <section className="max-w-7xl mx-auto px-6 py-14">
            Loading IntelliShop products...
          </section>
        }
      >
        <ProductCatalog />
      </Suspense>

      <section id="features" className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg">Semantic Search</h3>
            <p className="text-gray-600 mt-2">
              Find products by meaning, not just exact keywords.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg">Personalized Suggestions</h3>
            <p className="text-gray-600 mt-2">
              Discover products based on your interests and activity.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg">Secure Shopping</h3>
            <p className="text-gray-600 mt-2">
              Customer accounts, order history, and admin management.
            </p>
          </div>
        </div>
      </section>

      <footer className="text-center text-gray-500 text-sm py-6">
        © 2026 IntelliShop · Intelligent Online Shopping System
      </footer>
    </main>
  );
}

export default function Home() {
  return <Storefront />;
}
