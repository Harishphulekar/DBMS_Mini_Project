import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";

import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

import CartNavLink from "./CartNavLink";
import WishlistNavLink from "./WishlistNavLink";
import ProductFilters, { type StoreProduct } from "./ProductFilters";
import LogoutButton from "./LogoutButton";

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
    <main className="min-h-screen bg-[#F7F5F0] text-[#25231F]">
      {/* Sticky Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#F7F5F0]/85 border-b border-[#EDE8DF] transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-6">
          {/* Brand Wordmark */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25231F] text-[#F7F5F0] font-editorial text-lg font-bold group-hover:bg-[#9B8065] transition-colors">
              I
            </span>
            <span className="font-editorial text-2xl font-semibold tracking-wide text-[#25231F]">
              INTELLISHOP
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-4 flex-wrap">
            <a
              href="#products"
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#77736D] hover:text-[#25231F] transition-colors"
            >
              Collection
            </a>

            <a
              href="#intelligence"
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#77736D] hover:text-[#25231F] transition-colors hidden md:inline"
            >
              Intelligence
            </a>

            <Link
              href="/purchase-history"
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#77736D] hover:text-[#25231F] transition-colors hidden sm:inline"
            >
              Orders
            </Link>

            <Link
              href="/search-history"
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#77736D] hover:text-[#25231F] transition-colors hidden lg:inline"
            >
              History
            </Link>

            <div className="h-4 w-px bg-[#EDE8DF] mx-1 hidden sm:block" />

            <WishlistNavLink />
            <CartNavLink />

            <div className="ml-2">
              <LogoutButton />
            </div>
          </nav>
        </div>
      </header>

      {/* Editorial Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 border-b border-[#EDE8DF]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#EDE8DF] bg-white px-4 py-1.5 text-xs uppercase tracking-[0.2em] font-semibold text-[#80664E] shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#9B8065]" />
                Intelligent Online Shopping System
              </div>

              <h1 className="font-editorial text-4xl sm:text-6xl lg:text-7xl font-normal leading-[1.08] tracking-tight text-[#25231F]">
                Find products that <br />
                <span className="italic font-light text-[#80664E]">fit your world.</span>
              </h1>

              <p className="max-w-xl text-base sm:text-lg text-[#77736D] leading-relaxed">
                Experience an editorial commerce destination powered by vector semantic
                intelligence, relational inventory precision, and seamless customer ordering.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <a
                  href="#products"
                  className="inline-flex items-center gap-2 rounded-full bg-[#25231F] px-8 py-4 text-xs font-semibold uppercase tracking-widest text-[#F7F5F0] hover:bg-[#9B8065] active:scale-[0.98] transition-all duration-200 shadow-md"
                >
                  <span>Explore Collection</span>
                  <svg
                    className="w-4 h-4"
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
                </a>

                <a
                  href="#intelligence"
                  className="inline-flex items-center gap-2 rounded-full border border-[#25231F] bg-transparent px-8 py-4 text-xs font-semibold uppercase tracking-widest text-[#25231F] hover:bg-white transition-all duration-200"
                >
                  <span>AI Architecture</span>
                </a>
              </div>

              {/* Key Highlights */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-[#EDE8DF] max-w-lg">
                <div>
                  <p className="font-editorial text-2xl font-bold text-[#25231F]">Vector</p>
                  <p className="text-xs text-[#77736D] uppercase tracking-wider mt-0.5">
                    Qdrant Search
                  </p>
                </div>
                <div>
                  <p className="font-editorial text-2xl font-bold text-[#25231F]">ACID</p>
                  <p className="text-xs text-[#77736D] uppercase tracking-wider mt-0.5">
                    MySQL Engine
                  </p>
                </div>
                <div>
                  <p className="font-editorial text-2xl font-bold text-[#25231F]">Real-time</p>
                  <p className="text-xs text-[#77736D] uppercase tracking-wider mt-0.5">
                    Stock Precision
                  </p>
                </div>
              </div>
            </div>

            {/* Right Editorial Showcase Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Main Showcase Image */}
                <div className="relative rounded-3xl overflow-hidden border border-[#EDE8DF] bg-white shadow-[0_20px_50px_rgba(37,35,31,0.08)] aspect-[4/5]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000&auto=format&fit=crop"
                    alt="IntelliShop Editorial Showcase"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                  {/* Editorial Tag at Bottom */}
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-[#EDE8DF]">
                      The 2026 Edit
                    </p>
                    <p className="font-editorial text-2xl font-medium mt-1">
                      Curated Intelligence & Minimalist Design
                    </p>
                  </div>
                </div>

                {/* Floating Badge 1: Qdrant Vector Engine */}
                <div className="absolute -top-4 -left-4 sm:-left-6 rounded-2xl bg-white/95 backdrop-blur-md border border-[#EDE8DF] p-4 shadow-xl max-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9B8065] text-white">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-[11px] font-bold text-[#25231F]">Semantic Search</p>
                      <p className="text-[9px] text-[#77736D]">Cosine Similarity</p>
                    </div>
                  </div>
                </div>

                {/* Floating Badge 2: Verified Order Transaction */}
                <div className="absolute -bottom-5 -right-4 sm:-right-6 rounded-2xl bg-white/95 backdrop-blur-md border border-[#EDE8DF] p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                      ✓
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#25231F]">ACID Safe Cart</p>
                      <p className="text-[10px] text-[#77736D]">MySQL InnoDB Engine</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Discovery Section */}
      <Suspense
        fallback={
          <section className="max-w-7xl mx-auto px-6 py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#9B8065] border-t-transparent" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#77736D]">
              Loading IntelliShop Curations...
            </p>
          </section>
        }
      >
        <ProductCatalog />
      </Suspense>

      {/* Intelligent Capabilities Section */}
      <section id="intelligence" className="bg-white border-t border-b border-[#EDE8DF] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9B8065]">
              Intelligent Architecture
            </p>
            <h2 className="mt-2 font-editorial text-3xl md:text-5xl font-medium text-[#25231F]">
              Beyond Traditional Keyword Search
            </h2>
            <p className="mt-3 text-sm text-[#77736D]">
              IntelliShop harmonizes a relational MySQL DBMS with a high-dimensional vector
              database to deliver commercial-grade shopping capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-[#EDE8DF] bg-[#F7F5F0]/60 p-8 hover:border-[#9B8065]/40 hover:bg-white transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#25231F] text-[#F7F5F0] mb-6">
                <svg
                  className="w-6 h-6 stroke-current"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="1.75"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <path d="M11 8v6M8 11h6" />
                </svg>
              </div>
              <h3 className="font-editorial text-2xl font-medium text-[#25231F]">
                Semantic Vector Search
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-[#77736D]">
                Search products using conceptual natural language descriptions. Powered by Qdrant
                vector indexing, queries match product meanings rather than brittle exact keywords.
              </p>
              <div className="mt-6 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#9B8065]">
                <span>Qdrant Embeddings</span>
                <span>→</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-[#EDE8DF] bg-[#F7F5F0]/60 p-8 hover:border-[#9B8065]/40 hover:bg-white transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#9B8065] text-white mb-6">
                <svg
                  className="w-6 h-6 stroke-current"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="1.75"
                >
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
              </div>
              <h3 className="font-editorial text-2xl font-medium text-[#25231F]">
                ACID Inventory Management
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-[#77736D]">
                Enterprise-grade relational transaction control. MySQL guarantees atomic order
                placement, automatic stock reservation, and accurate quantity checks under concurrent
                access.
              </p>
              <div className="mt-6 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#9B8065]">
                <span>MySQL Relational DB</span>
                <span>→</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-[#EDE8DF] bg-[#F7F5F0]/60 p-8 hover:border-[#9B8065]/40 hover:bg-white transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#80664E] text-white mb-6">
                <svg
                  className="w-6 h-6 stroke-current"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="1.75"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="font-editorial text-2xl font-medium text-[#25231F]">
                Personalized History & Wishlist
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-[#77736D]">
                Track purchase history, maintain persistent curated wishlists, and retrace search
                inquiries with instant 1-click repetition for continuous customer engagement.
              </p>
              <div className="mt-6 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#9B8065]">
                <span>Personalized Experience</span>
                <span>→</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Editorial Footer */}
      <footer className="border-t border-[#EDE8DF] bg-[#F7F5F0] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#EDE8DF]">
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25231F] text-[#F7F5F0] font-editorial font-bold">
                  I
                </span>
                <span className="font-editorial text-xl font-semibold tracking-wide text-[#25231F]">
                  INTELLISHOP
                </span>
              </div>
              <p className="text-xs text-[#77736D] leading-relaxed max-w-sm">
                Intelligent Online Shopping System. Developed as an advanced final-year DBMS
                demonstration combining relational database architecture with vector-indexed semantic
                retrieval.
              </p>
            </div>

            <div className="md:col-span-2 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#25231F]">
                Navigation
              </p>
              <ul className="space-y-2 text-xs text-[#77736D]">
                <li>
                  <a href="#products" className="hover:text-[#25231F] transition-colors">
                    Store Catalogue
                  </a>
                </li>
                <li>
                  <Link href="/cart" className="hover:text-[#25231F] transition-colors">
                    Shopping Bag
                  </Link>
                </li>
                <li>
                  <Link href="/wishlist" className="hover:text-[#25231F] transition-colors">
                    Saved Wishlist
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-2 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#25231F]">
                Activity
              </p>
              <ul className="space-y-2 text-xs text-[#77736D]">
                <li>
                  <Link href="/purchase-history" className="hover:text-[#25231F] transition-colors">
                    Order History
                  </Link>
                </li>
                <li>
                  <Link href="/search-history" className="hover:text-[#25231F] transition-colors">
                    Search Records
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:text-[#25231F] transition-colors">
                    Admin Portal
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#25231F]">
                DBMS Stack
              </p>
              <p className="text-xs text-[#77736D] leading-relaxed">
                MySQL 8.0 Relational DBMS · Qdrant Vector Engine · Next.js 16 · React 19 ·
                Tailwind CSS v4
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs text-[#77736D]">
            <p>© 2026 IntelliShop. All rights reserved.</p>
            <p className="text-[#A5A19B]">Designed for Academic Demonstration & Evaluation</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* Authentication and role-based homepage */
async function HomeContent() {
  await connection();

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  return <Storefront />;
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#9B8065] border-t-transparent" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#77736D]">
              Loading IntelliShop...
            </p>
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
