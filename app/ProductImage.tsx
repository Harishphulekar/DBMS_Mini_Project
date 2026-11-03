"use client";

import { useState } from "react";

type ProductImageProps = {
  productId?: number;
  imageUrl?: string | null;
  name: string;
  categoryId?: number;
  className?: string;
  fit?: "contain" | "cover";
  aspectRatio?: string;
};

// Static fallback category photographs in case both DB URL and local file fail
const CATEGORY_FALLBACK_IMAGES: Record<number, string> = {
  1: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop", // Electronics
  2: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop", // Fashion
  3: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?q=80&w=800&auto=format&fit=crop", // Home & Kitchen
  4: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop", // Books
  5: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop", // Beauty
};

const DEFAULT_FALLBACK =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop";

export default function ProductImage({
  productId,
  imageUrl,
  name,
  categoryId,
  className = "w-full h-full",
  fit = "contain",
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  // Determine the best initial source
  let primarySrc = "";
  if (imageUrl && imageUrl.trim().length > 0) {
    primarySrc = imageUrl.trim();
  } else if (productId) {
    primarySrc = `/products/product-${productId}.jpg`;
  } else {
    primarySrc = (categoryId && CATEGORY_FALLBACK_IMAGES[categoryId]) || DEFAULT_FALLBACK;
  }

  const categoryFallback =
    (categoryId && CATEGORY_FALLBACK_IMAGES[categoryId]) || DEFAULT_FALLBACK;

  const activeSrc = hasError ? categoryFallback : primarySrc;

  const objectFitClass = fit === "contain" ? "object-contain p-3" : "object-cover";

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#FBF9F5] flex items-center justify-center group-hover:bg-white transition-colors duration-300">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={activeSrc}
        alt={name}
        loading="lazy"
        onError={() => {
          if (!hasError) {
            setHasError(true);
          }
        }}
        className={`${className} ${objectFitClass} transition-transform duration-500 ease-out group-hover:scale-105 select-none`}
      />
      {/* Subtle bottom vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/[0.03] via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
