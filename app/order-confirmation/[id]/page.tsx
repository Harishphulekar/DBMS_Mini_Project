import { Suspense } from "react";
import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

async function OrderDetails({ params }: Props) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-6 text-[#25231F]">
      <div className="bg-white border border-[#EDE8DF] rounded-3xl shadow-[0_20px_50px_rgba(37,35,31,0.06)] max-w-lg w-full p-8 sm:p-12 text-center">
        {/* Monogram / Checkmark Badge */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EDE8DF]/60 text-[#80664E] mb-6">
          <svg
            className="w-8 h-8 stroke-current"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9B8065]">
          Order Confirmed
        </p>

        <h1 className="mt-2 font-editorial text-3xl sm:text-4xl font-medium text-[#25231F]">
          Thank You For Shopping
        </h1>

        <p className="text-xs text-[#77736D] mt-3 leading-relaxed max-w-sm mx-auto">
          Your order has been recorded in our MySQL database and the inventory reservation is complete.
        </p>

        {/* Order Details Receipt Box */}
        <div className="bg-[#F7F5F0]/60 border border-[#EDE8DF] rounded-2xl p-6 mt-8 text-left space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#77736D] uppercase tracking-wider">Order Reference</span>
            <span className="font-editorial text-lg font-bold text-[#25231F]">#{id}</span>
          </div>

          <div className="h-px bg-[#EDE8DF]" />

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#77736D] uppercase tracking-wider">Payment Method</span>
            <span className="font-semibold text-[#25231F]">Cash on Delivery</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#77736D] uppercase tracking-wider">Status</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Processing
            </span>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center rounded-full bg-[#25231F] py-3.5 text-xs font-semibold uppercase tracking-widest text-[#F7F5F0] hover:bg-[#9B8065] transition-colors"
          >
            Continue Shopping
          </Link>

          <div>
            <Link
              href="/purchase-history"
              className="text-xs text-[#77736D] hover:text-[#25231F] transition-colors underline decoration-[#EDE8DF]"
            >
              View Order in Purchase History
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function OrderConfirmationPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#9B8065] border-t-transparent" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#77736D]">
              Loading Confirmation...
            </p>
          </div>
        </main>
      }
    >
      <OrderDetails params={params} />
    </Suspense>
  );
}
