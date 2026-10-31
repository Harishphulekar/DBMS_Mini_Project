
import { Suspense } from "react";
import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

async function OrderDetails({ params }: Props) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white border rounded-2xl shadow-sm max-w-lg w-full p-8 text-center">
        <div className="text-6xl mb-5">🎉</div>

        <h1 className="text-3xl font-bold text-gray-900">
          Order Placed Successfully!
        </h1>

        <p className="text-gray-500 mt-3">
          Thank you for shopping with IntelliShop.
          Your order has been received.
        </p>

        <div className="bg-indigo-50 rounded-xl p-5 mt-7">
          <p className="text-sm text-indigo-600 font-semibold">
            YOUR ORDER ID
          </p>

          <p className="text-2xl font-bold mt-2">
            #{id}
          </p>

          <p className="text-sm text-gray-500 mt-2">
            Payment Method: Cash on Delivery
          </p>
        </div>

        <Link
          href="/"
          className="block mt-7 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
        >
          Continue Shopping
        </Link>
      </div>
    </main>
  );
}

export default function OrderConfirmationPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          Loading order confirmation...
        </main>
      }
    >
      <OrderDetails params={params} />
    </Suspense>
  );
}
