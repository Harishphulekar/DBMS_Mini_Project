import pool from "@/lib/db";
import qdrantClient from "@/lib/qdrant";
import type { RowDataPacket } from "mysql2";

export interface CartInputItem {
  productId: number;
  name: string;
  brand?: string;
  categoryId?: number;
  categoryName?: string;
  description?: string;
}

export interface RecommendationItem {
  productId: number;
  name: string;
  brand: string;
  categoryId: number;
  categoryName: string;
  price: number;
  discountPrice: number | null;
  imageUrl: string;
  stockQuantity: number;
  score: number;
  reason: string;
  source: "HYBRID" | "SEMANTIC" | "RULE_BASED";
}

interface ProductDbRow extends RowDataPacket {
  product_id: number;
  product_name: string;
  brand: string;
  category_id: number;
  category_name: string;
  price: string | number;
  discount_price: string | number | null;
  image_url: string;
  description: string;
  stock_quantity: number | null;
}

/**
 * Domain rules mapping cart product classifications to complementary candidate products and contextual reasons.
 */
interface DomainRule {
  categoryMatch: string;
  cartKeywordRegex: RegExp;
  complementaryProductKeywords: string[];
  semanticPrompt: string;
  reasonTemplate: (cartItemName: string, candidateName: string) => string;
  priorityWeight: number;
}

const DOMAIN_RULES: DomainRule[] = [
  // --- Electronics: Laptops ---
  {
    categoryMatch: "Electronics",
    cartKeywordRegex: /\b(laptop|macbook|thinkpad|loq|victus|nitro|tuf|inspiron)\b/i,
    complementaryProductKeywords: ["mouse", "keyboard", "headphones", "speaker"],
    semanticPrompt: "computer peripherals wireless mouse mechanical keyboard gaming headset audio",
    reasonTemplate: (cartName) => `Essential peripheral companion for your ${cartName}.`,
    priorityWeight: 0.95,
  },
  // --- Electronics: Smartphones ---
  {
    categoryMatch: "Electronics",
    cartKeywordRegex: /\b(phone|smartphone|iphone|galaxy|nord)\b/i,
    complementaryProductKeywords: ["headphones", "speaker", "watch"],
    semanticPrompt: "wireless earbuds headphones bluetooth speaker portable audio smartwatch",
    reasonTemplate: (cartName) => `Immersive audio and smart accessory for your ${cartName}.`,
    priorityWeight: 0.92,
  },
  // --- Electronics: Cameras ---
  {
    categoryMatch: "Electronics",
    cartKeywordRegex: /\b(camera|dslr|lens)\b/i,
    complementaryProductKeywords: ["laptop", "headphones", "speaker"],
    semanticPrompt: "laptop for photo editing headphones creator workstation",
    reasonTemplate: (cartName) => `Powerful companion device for editing your ${cartName} shots.`,
    priorityWeight: 0.88,
  },
  // --- Electronics: Audio & Peripherals ---
  {
    categoryMatch: "Electronics",
    cartKeywordRegex: /\b(headphones|speaker|keyboard|mouse)\b/i,
    complementaryProductKeywords: ["laptop", "phone", "mouse", "keyboard", "speaker"],
    semanticPrompt: "workspace setup electronics accessories laptop smartphone",
    reasonTemplate: (cartName) => `Elevates your tech setup alongside your ${cartName}.`,
    priorityWeight: 0.85,
  },
  // --- Fashion: Tops / Jackets / Shirts / Hoodies ---
  {
    categoryMatch: "Fashion",
    cartKeywordRegex: /\b(jacket|shirt|t\s*shirt|hoodie|kurti|dress)\b/i,
    complementaryProductKeywords: ["jeans", "wallet", "watch", "shoes", "sneakers", "sunglasses", "handbag"],
    semanticPrompt: "designer fashion accessories leather wallet wrist watch sunglasses shoes handbag",
    reasonTemplate: (cartName) => `Completes your look alongside your ${cartName}.`,
    priorityWeight: 0.92,
  },
  // --- Fashion: Bottoms / Jeans ---
  {
    categoryMatch: "Fashion",
    cartKeywordRegex: /\b(jeans|trousers|pants)\b/i,
    complementaryProductKeywords: ["shirt", "jacket", "wallet", "watch", "shoes", "sneakers", "sunglasses"],
    semanticPrompt: "casual shirt jacket leather shoes sneakers wrist watch wallet",
    reasonTemplate: (cartName) => `Styled to pair effortlessly with your ${cartName}.`,
    priorityWeight: 0.90,
  },
  // --- Fashion: Shoes & Sneakers ---
  {
    categoryMatch: "Fashion",
    cartKeywordRegex: /\b(shoes|sneakers)\b/i,
    complementaryProductKeywords: ["jacket", "hoodie", "jeans", "watch", "wallet", "sunglasses"],
    semanticPrompt: "streetwear jacket casual jeans sportswear hoodie lifestyle accessories",
    reasonTemplate: (cartName) => `Lifestyle staple to match with your ${cartName}.`,
    priorityWeight: 0.87,
  },
  // --- Fashion: Bags & Accessories ---
  {
    categoryMatch: "Fashion",
    cartKeywordRegex: /\b(wallet|handbag|watch|sunglasses)\b/i,
    complementaryProductKeywords: ["dress", "jacket", "shirt", "shoes", "lipstick"],
    semanticPrompt: "luxury apparel designer dress jacket elegant shoes makeup",
    reasonTemplate: (cartName) => `Curated accessory pairing for your ${cartName}.`,
    priorityWeight: 0.88,
  },
  // --- Home & Kitchen: Small Appliances ---
  {
    categoryMatch: "Home & Kitchen",
    cartKeywordRegex: /\b(coffee|air fryer|microwave|mixer|kettle|cooktop)\b/i,
    complementaryProductKeywords: ["cookware", "pressure cooker", "dinner set", "bottle"],
    semanticPrompt: "nonstick cookware pressure cooker dining dinner set kitchen essentials",
    reasonTemplate: (cartName) => `Everyday kitchen essential to use alongside your ${cartName}.`,
    priorityWeight: 0.94,
  },
  // --- Home & Kitchen: Cookware & Dining ---
  {
    categoryMatch: "Home & Kitchen",
    cartKeywordRegex: /\b(cookware|pressure cooker|dinner set|bottle)\b/i,
    complementaryProductKeywords: ["kettle", "coffee", "air fryer", "mixer", "cooktop"],
    semanticPrompt: "kitchen appliances induction kettle coffee maker blender",
    reasonTemplate: (cartName) => `Gourmet preparation companion for your ${cartName}.`,
    priorityWeight: 0.91,
  },
  // --- Home & Kitchen: Living & Home Care ---
  {
    categoryMatch: "Home & Kitchen",
    cartKeywordRegex: /\b(pillow|lamp|vacuum|fan|refrigerator)\b/i,
    complementaryProductKeywords: ["lamp", "pillow", "vacuum"],
    semanticPrompt: "ambient home decor ergonomic pillow lighting living room essentials",
    reasonTemplate: (cartName) => `Enhance your living space comfort alongside your ${cartName}.`,
    priorityWeight: 0.86,
  },
  // --- Books: Tech & Programming ---
  {
    categoryMatch: "Books",
    cartKeywordRegex: /\b(database|python|let us c|c programming|c\+\+|java|clean code|networks|operating system|intelligence|sql|data structures)\b/i,
    complementaryProductKeywords: ["clean code", "sql", "structures", "database", "python"],
    semanticPrompt: "software engineering programming algorithms computer science clean code sql",
    reasonTemplate: (cartName) => `Essential technical reference to master alongside ${cartName}.`,
    priorityWeight: 0.94,
  },
  // --- Books: Self-Help & Personal Finance ---
  {
    categoryMatch: "Books",
    cartKeywordRegex: /\b(habits|money|rich|psychology|alchemist)\b/i,
    complementaryProductKeywords: ["habits", "psychology", "rich", "alchemist"],
    semanticPrompt: "bestselling personal growth psychology habits wealth mindset books",
    reasonTemplate: (cartName) => `Transformative companion read recommended with ${cartName}.`,
    priorityWeight: 0.93,
  },
  // --- Beauty: Skincare Serums & Treatments ---
  {
    categoryMatch: "Beauty",
    cartKeywordRegex: /\b(serum|vitamin c|toner|face wash|cleanser)\b/i,
    complementaryProductKeywords: ["sunscreen", "moisturizer", "toner", "cleanser", "serum", "scrub", "face cream"],
    semanticPrompt: "skincare routine hydrating cleanser soothing toner moisturizer spf sunscreen",
    reasonTemplate: (cartName) => `Complete your skincare regimen following your ${cartName}.`,
    priorityWeight: 0.95,
  },
  // --- Beauty: Moisturizers & Sunscreens ---
  {
    categoryMatch: "Beauty",
    cartKeywordRegex: /\b(moisturizer|sunscreen|face cream)\b/i,
    complementaryProductKeywords: ["serum", "cleanser", "face wash", "toner"],
    semanticPrompt: "gentle face wash serum toner daily skincare routine prep",
    reasonTemplate: (cartName) => `Locks in hydration and skin defense with your ${cartName}.`,
    priorityWeight: 0.92,
  },
  // --- Beauty: Makeup & Hair Care ---
  {
    categoryMatch: "Beauty",
    cartKeywordRegex: /\b(foundation|mascara|lipstick|nail polish|shampoo|hair serum|body butter)\b/i,
    complementaryProductKeywords: ["cleanser", "lipstick", "mascara", "foundation", "serum", "moisturizer"],
    semanticPrompt: "beauty makeup essentials lipstick foundation gentle skincare cleanser",
    reasonTemplate: (cartName) => `Flawless finishing touch to pair with your ${cartName}.`,
    priorityWeight: 0.90,
  },
];

/**
 * Query Qdrant for semantic similarity with graceful error recovery.
 */
async function queryQdrantComplements(
  semanticQueries: string[],
  limit: number = 15
): Promise<Map<number, number>> {
  const scoresByProductId = new Map<number, number>();

  if (!semanticQueries.length) return scoresByProductId;

  try {
    const combinedQuery = semanticQueries.slice(0, 3).join(" ");
    const result = await qdrantClient.query("product_embeddings", {
      query: {
        text: combinedQuery,
        model: "sentence-transformers/all-minilm-l6-v2",
      },
      limit,
      with_payload: true,
    });

    if (result && Array.isArray(result.points)) {
      for (const point of result.points) {
        const prodId = Number(point.payload?.product_id ?? point.id);
        if (prodId > 0) {
          // Normalize vector similarity score to [0, 1]
          const normalized = Math.min(1.0, Math.max(0.0, (Number(point.score) + 0.1) / 1.1));
          scoresByProductId.set(prodId, normalized);
        }
      }
    }
  } catch (error) {
    console.warn(
      "[Recommendation Engine] Qdrant query skipped or failed, using database & rule engine fallback:",
      error instanceof Error ? error.message : error
    );
  }

  return scoresByProductId;
}

/**
 * Persist computed recommendations into the MySQL `user_recommendation` table.
 */
export async function persistUserRecommendations(
  customerId: number,
  recommendations: Array<{ productId: number; score: number }>
): Promise<void> {
  if (!customerId || customerId <= 0 || !recommendations.length) return;

  try {
    // Confirm customer exists in customer table
    const [custRows]: any = await pool.execute(
      "SELECT customer_id FROM customer WHERE customer_id = ? LIMIT 1",
      [customerId]
    );

    if (!custRows || custRows.length === 0) {
      return;
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.execute(
        "DELETE FROM user_recommendation WHERE customer_id = ? AND recommender_type = 'CART_HYBRID'",
        [customerId]
      );

      for (const rec of recommendations) {
        // Strict MySQL constraint check: score >= 0 AND score <= 1
        const clampedScore = Math.min(1.0, Math.max(0.000001, Number(rec.score.toFixed(6))));
        await connection.execute(
          `INSERT INTO user_recommendation (customer_id, product_id, score, recommender_type, generated_at)
           VALUES (?, ?, ?, 'CART_HYBRID', NOW())`,
          [customerId, rec.productId, clampedScore]
        );
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      console.error("[Recommendation Engine] Error saving recommendations:", err);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("[Recommendation Engine] Persist error:", error);
  }
}

/**
 * Core Hybrid Recommendation Engine.
 * Combines domain-specific functional complementarity, Qdrant semantic similarity,
 * real-time inventory checks, and diversity re-ranking.
 */
export async function getCartRecommendations(options: {
  customerId: number;
  cartItems: CartInputItem[];
  limit?: number;
}): Promise<RecommendationItem[]> {
  const { customerId, cartItems, limit = 4 } = options;

  if (!cartItems || cartItems.length === 0) {
    return [];
  }

  const inCartIds = new Set(cartItems.map((item) => Number(item.productId)));

  // Identify applicable domain rules for the cart items
  const activeSemanticPrompts: string[] = [];
  const candidateTargetKeywords: Set<string> = new Set();
  const matchedRulesByItem: Array<{
    cartItem: CartInputItem;
    rule: DomainRule;
  }> = [];

  for (const item of cartItems) {
    const textToMatch = `${item.name} ${item.description ?? ""}`.trim();

    for (const rule of DOMAIN_RULES) {
      // If the cart item has an explicit category, enforce category alignment to prevent false cross-domain matches
      if (item.categoryName) {
        if (!rule.categoryMatch.toLowerCase().includes(item.categoryName.toLowerCase())) {
          continue;
        }
      }

      if (rule.cartKeywordRegex.test(textToMatch)) {
        matchedRulesByItem.push({ cartItem: item, rule });
        activeSemanticPrompts.push(rule.semanticPrompt);
        for (const kw of rule.complementaryProductKeywords) {
          candidateTargetKeywords.add(kw.toLowerCase());
        }
      }
    }
  }

  // Layer 2: Qdrant Vector Semantic Query
  const qdrantScores = await queryQdrantComplements(
    activeSemanticPrompts.length > 0
      ? activeSemanticPrompts
      : cartItems.map((i) => `accessories complements for ${i.name}`),
    20
  );

  // Layer 1 & Fallback: Query all in-stock products from MySQL
  const [dbProducts] = await pool.execute<ProductDbRow[]>(
    `SELECT
       p.product_id,
       p.product_name,
       p.brand,
       p.category_id,
       c.category_name,
       p.price,
       p.discount_price,
       p.image_url,
       p.description,
       i.stock_quantity
     FROM product p
     JOIN category c ON c.category_id = p.category_id
     LEFT JOIN inventory i ON i.product_id = p.product_id
     WHERE i.stock_quantity > 0`
  );

  // Layer 3: Blended Scoring & Reason Generation
  interface ScoredCandidate {
    product: ProductDbRow;
    score: number;
    reason: string;
    source: "HYBRID" | "SEMANTIC" | "RULE_BASED";
    subCategoryTag: string;
    categoryName: string;
  }

  const scoredCandidates: ScoredCandidate[] = [];

  for (const prod of dbProducts) {
    // Condition 1: Never recommend what is already in the cart
    if (inCartIds.has(prod.product_id)) {
      continue;
    }

    // Condition 2: Must be strictly in stock (stock_quantity > 0)
    if ((prod.stock_quantity ?? 0) <= 0) {
      continue;
    }

    const prodText = `${prod.product_name} ${prod.description} ${prod.category_name}`.toLowerCase();
    let bestRuleScore = 0;
    let chosenReason = "";

    // Check match against domain rules
    for (const { cartItem, rule } of matchedRulesByItem) {
      // Do not recommend the exact same functional device (e.g. laptop for laptop)
      if (
        rule.cartKeywordRegex.test(prod.product_name) &&
        rule.cartKeywordRegex.test(cartItem.name)
      ) {
        continue;
      }

      for (const kw of rule.complementaryProductKeywords) {
        if (prodText.includes(kw)) {
          const ruleScore = rule.priorityWeight;
          if (ruleScore > bestRuleScore) {
            bestRuleScore = ruleScore;
            chosenReason = rule.reasonTemplate(cartItem.name, prod.product_name);
          }
        }
      }
    }

    // Qdrant vector semantic component
    const vectorScore = qdrantScores.get(prod.product_id) ?? 0;

    let finalScore = 0;
    let source: "HYBRID" | "SEMANTIC" | "RULE_BASED" = "RULE_BASED";

    if (bestRuleScore > 0 && vectorScore > 0) {
      // Hybrid: Blend rule confidence (60%) and semantic similarity (40%)
      finalScore = bestRuleScore * 0.6 + vectorScore * 0.4;
      source = "HYBRID";
    } else if (bestRuleScore > 0) {
      // Rule-based fallback
      finalScore = bestRuleScore * 0.85;
      source = "RULE_BASED";
    } else if (vectorScore > 0) {
      // Pure semantic discovery
      finalScore = vectorScore * 0.8;
      source = "SEMANTIC";
      const primaryCartItem = cartItems[0]?.name || "your cart";
      chosenReason = `Smart complementary recommendation for ${primaryCartItem}.`;
    } else {
      // Category affinity baseline fallback
      const sameCategoryAsCart = cartItems.some(
        (i) => i.categoryId === prod.category_id || i.categoryName === prod.category_name
      );
      if (sameCategoryAsCart) {
        finalScore = 0.45;
        source = "RULE_BASED";
        chosenReason = `Popular companion in ${prod.category_name}.`;
      }
    }

    if (finalScore >= 0.4) {
      // Bonus for discounts or exceptional value
      if (prod.discount_price && Number(prod.discount_price) < Number(prod.price)) {
        finalScore += 0.03;
      }

      // Determine coarse subcategory tag for diversity filtering
      let subTag = prod.category_name;
      if (/\b(mouse|keyboard|headphones|speaker)\b/i.test(prod.product_name)) {
        subTag = RegExp.$1.toLowerCase();
      } else if (/\b(skincare|cleanser|serum|sunscreen|moisturizer|toner|scrub)\b/i.test(prod.product_name)) {
        subTag = RegExp.$1.toLowerCase();
      } else if (/\b(wallet|watch|shoes|sneakers|jacket|sunglasses)\b/i.test(prod.product_name)) {
        subTag = RegExp.$1.toLowerCase();
      }

      scoredCandidates.push({
        product: prod,
        score: Math.min(0.98, Math.max(0.1, finalScore)),
        reason: chosenReason || `Curated complement for your shopping bag.`,
        source,
        subCategoryTag: subTag,
        categoryName: prod.category_name,
      });
    }
  }

  // Sort candidates by score descending
  scoredCandidates.sort((a, b) => b.score - a.score);

  // Apply multi-category diversity re-ranking:
  // If cart has items from multiple categories, ensure representation across categories
  const cartCategories = new Set(cartItems.map((i) => i.categoryName).filter(Boolean));
  const isMultiCategoryCart = cartCategories.size > 1;

  const selected: ScoredCandidate[] = [];
  const subTagCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();

  for (const cand of scoredCandidates) {
    if (selected.length >= limit) break;

    const subCount = subTagCounts.get(cand.subCategoryTag) ?? 0;
    const catCount = categoryCounts.get(cand.categoryName) ?? 0;

    // In multi-category carts, cap at 2 items per category so diverse categories get represented
    const catLimit = isMultiCategoryCart ? Math.ceil(limit / cartCategories.size) : limit;

    if (subCount < 2 && catCount < catLimit) {
      selected.push(cand);
      subTagCounts.set(cand.subCategoryTag, subCount + 1);
      categoryCounts.set(cand.categoryName, catCount + 1);
    }
  }

  // If diversity filter was too strict and we have remaining slots, fill with next best
  if (selected.length < limit) {
    for (const cand of scoredCandidates) {
      if (selected.length >= limit) break;
      if (!selected.some((s) => s.product.product_id === cand.product.product_id)) {
        selected.push(cand);
      }
    }
  }

  const finalRecommendations: RecommendationItem[] = selected.map((item) => ({
    productId: item.product.product_id,
    name: item.product.product_name,
    brand: item.product.brand,
    categoryId: item.product.category_id,
    categoryName: item.product.category_name,
    price: Number(item.product.price),
    discountPrice:
      item.product.discount_price != null ? Number(item.product.discount_price) : null,
    imageUrl: item.product.image_url,
    stockQuantity: Number(item.product.stock_quantity ?? 0),
    score: Number(item.score.toFixed(6)),
    reason: item.reason,
    source: item.source,
  }));

  // Persist recommendations
  try {
    await persistUserRecommendations(
      customerId,
      finalRecommendations.map((r) => ({ productId: r.productId, score: r.score }))
    );
  } catch (err) {
    console.error("[Recommendation Engine] Persist error:", err);
  }

  return finalRecommendations;
}
