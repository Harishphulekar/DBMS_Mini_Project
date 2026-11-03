
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SearchRecord = {
  searchId: number;
  queryText: string;
  searchedAt: string;
};

export default function SearchHistoryPage() {
  const router = useRouter();

  const [searches, setSearches] = useState<SearchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSearchHistory() {
      try {
        const response = await fetch("/api/search-history", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load search history.");
        }

        setSearches(data.items);
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

    loadSearchHistory();
  }, []);

  function searchAgain(query: string) {
    router.push(`/?search=${encodeURIComponent(query)}#products`);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

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

      <section className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-sm font-semibold text-indigo-600">
          YOUR SHOPPING ACTIVITY
        </p>

        <h1 className="text-3xl font-bold mt-2">
          Search History
        </h1>

        <p className="text-gray-500 mt-2">
          View and repeat your previous product searches.
        </p>

        {loading && (
          <p className="mt-10 text-gray-500">
            Loading your search history...
          </p>
        )}

        {error && (
          <p className="mt-8 text-red-600 bg-red-50 p-4 rounded-lg">
            {error}
          </p>
        )}

        {!loading && !error && searches.length === 0 && (
          <div className="mt-10 bg-white border rounded-2xl p-10 text-center">
            <p className="text-5xl mb-4">🔎</p>

            <h2 className="text-xl font-bold">
              No searches yet
            </h2>

            <p className="text-gray-500 mt-2">
              Your previous product searches will appear here.
            </p>

            <Link
              href="/"
              className="inline-block mt-6 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Explore Products
            </Link>
          </div>
        )}

        {!loading && !error && searches.length > 0 && (
          <div className="mt-8 bg-white border rounded-2xl overflow-hidden">
            <div className="p-5 border-b bg-gray-50 flex justify-between">
              <h2 className="font-bold">Previous Searches</h2>
              <span className="text-sm text-gray-500">
                {searches.length} searches
              </span>
            </div>

            <div className="divide-y">
              {searches.map((item) => (
                <div
                  key={item.searchId}
                  className="p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                      🔍
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold break-words">
                        {item.queryText}
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(item.searchedAt)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => searchAgain(item.queryText)}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 shrink-0"
                  >
                    Search again →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
