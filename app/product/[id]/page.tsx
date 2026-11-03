
import { Suspense } from "react";
import ProductDetailsClient from "./ProductDetailsClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function ProductDetailsPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-lg text-gray-600">
            Loading product details...
          </p>
        </main>
      }
    >
      <ProductDetailsRoute params={params} />
    </Suspense>
  );
}

async function ProductDetailsRoute({ params }: PageProps) {
  const { id } = await params;

  return <ProductDetailsClient productId={id} />;
}
