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
          err instanceof Error ? err.message : "Something went wrong."
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

      {/* Main Content */}
      <section className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <div className="pb-8 border-b border-[#EDE8DF]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9B8065]">
            Intelligence Activity
          </p>
          <h1 className="mt-1 font-editorial text-4xl sm:text-5xl font-medium text-[#25231F]">
            Search Records
          </h1>
          <p className="text-xs text-[#77736D] mt-2">
            Every keyword and semantic natural language search query recorded in your DBMS profile.
          </p>
        </div>

        {loading && (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#9B8065] border-t-transparent" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#77736D]">
              Retrieving Search Logs...
            </p>
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-700">
            {error}
          </div>
        )}

        {!loading && !error && searches.length === 0 && (
          <div className="my-16 rounded-3xl border border-dashed border-[#DDD6C9] bg-white/70 p-16 text-center max-w-lg mx-auto">
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
            <h2 className="font-editorial text-2xl font-medium text-[#25231F]">
              No Search Records Yet
            </h2>
            <p className="mt-2 text-xs text-[#77736D] leading-relaxed">
              When you use semantic or keyword search in our collection, queries are saved
              for quick retrieval.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25231F] px-8 py-3.5 text-xs font-semibold uppercase tracking-widest text-[#F7F5F0] hover:bg-[#9B8065] transition-colors"
            >
              Start Searching
            </Link>
          </div>
        )}

        {!loading && !error && searches.length > 0 && (
          <div className="mt-10 rounded-3xl bg-white border border-[#EDE8DF] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#EDE8DF] bg-[#F7F5F0]/40 flex justify-between items-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#25231F]">
                Recorded Queries
              </span>
              <span className="text-xs text-[#77736D]">
                {searches.length} total inquiries
              </span>
            </div>

            <div className="divide-y divide-[#EDE8DF]/60">
              {searches.map((item) => (
                <div
                  key={item.searchId}
                  className="p-5 sm:p-6 flex items-center justify-between gap-4 hover:bg-[#F7F5F0]/30 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDE8DF]/60 text-[#9B8065]">
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
                    </span>

                    <div className="min-w-0">
                      <p className="font-medium text-sm text-[#25231F] break-words">
                        &ldquo;{item.queryText}&rdquo;
                      </p>
                      <p className="text-[11px] text-[#A5A19B] mt-0.5">
                        {formatDate(item.searchedAt)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => searchAgain(item.queryText)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#EDE8DF] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#25231F] hover:bg-[#25231F] hover:text-[#F7F5F0] transition-colors shrink-0"
                  >
                    <span>Repeat</span>
                    <span className="text-sm">→</span>
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
