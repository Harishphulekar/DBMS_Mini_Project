"use client";

import { useEffect, useState, useMemo, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Product {
  product_id: number;
  product_name: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  brand: string | null;
  image_url: string | null;
  category_id: number;
  category_name: string | null;
  stock_quantity: number;
  reserved_quantity: number;
  reorder_level: number;
}

interface Category {
  category_id: number;
  category_name: string;
  description: string | null;
  parent_category_id: number | null;
}

interface ProductForm {
  product_name: string;
  description: string;
  brand: string;
  category_id: string;
  price: string;
  discount_price: string;
  image_url: string;
  stock_quantity: string;
  reorder_level: string;
}

interface CategoryForm {
  category_name: string;
  description: string;
  parent_category_id: string;
}

const initialForm: ProductForm = {
  product_name: "",
  description: "",
  brand: "",
  category_id: "",
  price: "",
  discount_price: "",
  image_url: "",
  stock_quantity: "0",
  reorder_level: "5",
};

const initialCategoryForm: CategoryForm = {
  category_name: "",
  description: "",
  parent_category_id: "",
};

export default function AdminDashboard() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Tab navigation
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "inventory">("products");

  // Filter/search state
  const [tableSearch, setTableSearch] = useState("");
  const [tableCategoryFilter, setTableCategoryFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(initialCategoryForm);

  async function loadDashboard() {
    const [productResponse, categoryResponse] = await Promise.all([
      fetch("/api/admin/products", { credentials: "include" }),
      fetch("/api/admin/categories", { credentials: "include" }),
    ]);

    if (
      productResponse.status === 401 ||
      productResponse.status === 403 ||
      categoryResponse.status === 401 ||
      categoryResponse.status === 403
    ) {
      router.replace("/login");
      return;
    }

    const productData = await productResponse.json();
    const categoryData = await categoryResponse.json();

    if (!productResponse.ok || !productData.success) {
      throw new Error(productData.message || "Unable to load products");
    }

    if (!categoryResponse.ok || !categoryData.success) {
      throw new Error(categoryData.message || "Unable to load categories");
    }

    setProducts(productData.products || []);
    setCategories(categoryData.categories || []);
  }

  useEffect(() => {
    async function initialize() {
      try {
        await loadDashboard();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, [router]);

  function updateField(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function updateCategoryField(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;
    setCategoryForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function validateProductForm() {
    const price = Number(form.price);
    const discountPrice =
      form.discount_price.trim() === "" ? null : Number(form.discount_price);
    const stock = Number(form.stock_quantity);
    const reorder = Number(form.reorder_level);

    if (
      !form.product_name.trim() ||
      !form.category_id ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      !Number.isInteger(reorder) ||
      reorder < 0 ||
      (discountPrice !== null &&
        (!Number.isFinite(discountPrice) ||
          discountPrice < 0 ||
          discountPrice > price))
    ) {
      throw new Error("Please enter valid product details.");
    }

    return { price, discountPrice, stock, reorder };
  }

  async function handleSaveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    let values;
    try {
      values = validateProductForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid product details");
      return;
    }

    setSaving(true);

    try {
      const isEditing = editingProductId !== null;
      let imageUrl = form.image_url.trim();

      if (selectedImage) {
        const uploadData = new FormData();
        uploadData.append("image", selectedImage);

        const uploadResponse = await fetch("/api/admin/upload", {
          method: "POST",
          credentials: "include",
          body: uploadData,
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadResult.success || !uploadResult.imageUrl) {
          throw new Error(uploadResult.message || "Unable to upload product image");
        }

        imageUrl = uploadResult.imageUrl;
      }

      const response = await fetch("/api/admin/products", {
        method: isEditing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing ? { product_id: editingProductId } : {}),
          product_name: form.product_name.trim(),
          description: form.description.trim(),
          brand: form.brand.trim(),
          category_id: Number(form.category_id),
          price: values.price,
          discount_price: values.discountPrice,
          image_url: imageUrl,
          stock_quantity: values.stock,
          reorder_level: values.reorder,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save product");
      }

      setSuccess(
        isEditing ? "Product updated successfully!" : "Product added successfully!"
      );

      setForm(initialForm);
      setSelectedImage(null);
      setImagePreview("");
      setEditingProductId(null);
      setShowForm(false);

      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save product");
    } finally {
      setSaving(false);
    }
  }

  function startEditing(product: Product) {
    setEditingProductId(product.product_id);
    setForm({
      product_name: product.product_name,
      description: product.description || "",
      brand: product.brand || "",
      category_id: String(product.category_id),
      price: String(product.price),
      discount_price:
        product.discount_price !== null ? String(product.discount_price) : "",
      image_url: product.image_url || "",
      stock_quantity: String(product.stock_quantity),
      reorder_level: String(product.reorder_level),
    });

    setSelectedImage(null);
    setImagePreview(product.image_url || "");
    setShowForm(true);
    setActiveTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingProductId(null);
    setForm(initialForm);
    setSelectedImage(null);
    setImagePreview("");
    setShowForm(false);
  }

  async function handleDeleteProduct(productId: number) {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    setError("");
    setSuccess("");
    setDeletingId(productId);

    try {
      const response = await fetch(
        `/api/admin/products?productId=${productId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete product");
      }

      setSuccess("Product deleted successfully!");
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete product");
    } finally {
      setDeletingId(null);
    }
  }

  function startEditingCategory(category: Category) {
    setEditingCategoryId(category.category_id);
    setCategoryForm({
      category_name: category.category_name,
      description: category.description || "",
      parent_category_id:
        category.parent_category_id !== null
          ? String(category.parent_category_id)
          : "",
    });
    setShowCategoryForm(true);
    setActiveTab("categories");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelCategoryEditing() {
    setEditingCategoryId(null);
    setCategoryForm(initialCategoryForm);
    setShowCategoryForm(false);
  }

  async function handleSaveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const categoryName = categoryForm.category_name.trim();

    if (!categoryName || categoryName.length > 100) {
      setError("Enter a valid category name (maximum 100 characters).");
      return;
    }

    if (
      categoryForm.parent_category_id &&
      Number(categoryForm.parent_category_id) === editingCategoryId
    ) {
      setError("A category cannot be its own parent.");
      return;
    }

    setSavingCategory(true);

    try {
      const isEditing = editingCategoryId !== null;

      const response = await fetch("/api/admin/categories", {
        method: isEditing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing ? { category_id: editingCategoryId } : {}),
          category_name: categoryName,
          description: categoryForm.description.trim(),
          parent_category_id: categoryForm.parent_category_id
            ? Number(categoryForm.parent_category_id)
            : null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save category");
      }

      setSuccess(
        isEditing
          ? "Category updated successfully!"
          : "Category created successfully!"
      );

      setCategoryForm(initialCategoryForm);
      setEditingCategoryId(null);
      setShowCategoryForm(false);

      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save category");
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleDeleteCategory(categoryId: number) {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }

    setError("");
    setSuccess("");
    setDeletingCategoryId(categoryId);

    try {
      const response = await fetch(
        `/api/admin/categories?categoryId=${categoryId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete category");
      }

      setSuccess("Category deleted successfully!");
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete category");
    } finally {
      setDeletingCategoryId(null);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      router.replace("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
      alert("Unable to sign out.");
    }
  }

  const lowStockCount = products.filter(
    (product) => product.stock_quantity <= product.reorder_level
  ).length;

  // Filtered product list for table
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const query = tableSearch.trim().toLowerCase();
      const matchesQuery =
        !query ||
        item.product_name.toLowerCase().includes(query) ||
        (item.brand && item.brand.toLowerCase().includes(query));

      const matchesCat =
        tableCategoryFilter === "all" ||
        item.category_id === Number(tableCategoryFilter);

      return matchesQuery && matchesCat;
    });
  }, [products, tableSearch, tableCategoryFilter]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#9B8065] border-t-transparent" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#77736D]">
            Loading Administrative Console...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#25231F] flex flex-col">
      {/* SaaS Executive Top Header */}
      <header className="sticky top-0 z-50 bg-[#25231F] text-white border-b border-black/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9B8065] text-white font-editorial text-lg font-bold">
                I
              </span>
              <div>
                <span className="font-editorial text-xl font-bold tracking-wider">
                  INTELLISHOP
                </span>
                <span className="ml-2.5 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#EDE8DF]">
                  Admin Console
                </span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-white/10 text-xs text-white/60">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>DBMS: MySQL 8.0 Connected</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/20 transition-all"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>View Store</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-all"
            >
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-700 flex justify-between items-center shadow-sm">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} className="font-bold ml-4">✕</button>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs text-emerald-800 flex justify-between items-center shadow-sm">
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess("")} className="font-bold ml-4">✕</button>
          </div>
        )}

        {/* Executive KPI Stats Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="rounded-2xl bg-white border border-[#EDE8DF] p-6 shadow-sm">
            <div className="flex items-center justify-between text-[#77736D] text-xs">
              <span className="uppercase tracking-wider font-semibold">Total SKUs</span>
              <span className="h-2 w-2 rounded-full bg-[#9B8065]" />
            </div>
            <p className="mt-3 font-editorial text-4xl font-semibold text-[#25231F]">
              {products.length}
            </p>
            <p className="mt-1 text-xs text-[#77736D]">Active catalogue products</p>
          </div>

          <div className="rounded-2xl bg-white border border-[#EDE8DF] p-6 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="uppercase tracking-wider font-semibold text-[#77736D]">
                Low Stock Alerts
              </span>
              <span className={`h-2 w-2 rounded-full ${lowStockCount > 0 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
            </div>
            <p className={`mt-3 font-editorial text-4xl font-semibold ${lowStockCount > 0 ? "text-amber-700" : "text-[#25231F]"}`}>
              {lowStockCount}
            </p>
            <p className="mt-1 text-xs text-[#77736D]">
              {lowStockCount > 0 ? "Items at or below reorder level" : "All inventories healthy"}
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-[#EDE8DF] p-6 shadow-sm">
            <div className="flex items-center justify-between text-[#77736D] text-xs">
              <span className="uppercase tracking-wider font-semibold">Categories</span>
              <span className="h-2 w-2 rounded-full bg-[#80664E]" />
            </div>
            <p className="mt-3 font-editorial text-4xl font-semibold text-[#25231F]">
              {categories.length}
            </p>
            <p className="mt-1 text-xs text-[#77736D]">Department taxonomies</p>
          </div>

          <div className="rounded-2xl bg-white border border-[#EDE8DF] p-6 shadow-sm">
            <div className="flex items-center justify-between text-[#77736D] text-xs">
              <span className="uppercase tracking-wider font-semibold">Database Engine</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <p className="mt-3 font-editorial text-4xl font-semibold text-[#25231F]">
              InnoDB
            </p>
            <p className="mt-1 text-xs text-[#77736D]">ACID Relational Locking</p>
          </div>
        </section>

        {/* Tab Navigation Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#EDE8DF] mb-8">
          <div className="inline-flex rounded-full bg-[#EDE8DF]/70 p-1 border border-[#EDE8DF]">
            <button
              type="button"
              onClick={() => setActiveTab("products")}
              className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === "products"
                  ? "bg-[#25231F] text-white shadow-sm"
                  : "text-[#77736D] hover:text-[#25231F]"
              }`}
            >
              Product Management ({products.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("categories")}
              className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === "categories"
                  ? "bg-[#25231F] text-white shadow-sm"
                  : "text-[#77736D] hover:text-[#25231F]"
              }`}
            >
              Categories ({categories.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("inventory")}
              className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === "inventory"
                  ? "bg-[#25231F] text-white shadow-sm"
                  : "text-[#77736D] hover:text-[#25231F]"
              }`}
            >
              Inventory Levels {lowStockCount > 0 && `(${lowStockCount} Alert)`}
            </button>
          </div>

          {activeTab === "products" && (
            <button
              type="button"
              onClick={() => {
                if (showForm) {
                  cancelEditing();
                } else {
                  setEditingProductId(null);
                  setForm(initialForm);
                  setSelectedImage(null);
                  setImagePreview("");
                  setShowForm(true);
                  setError("");
                  setSuccess("");
                }
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[#25231F] px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#F7F5F0] hover:bg-[#9B8065] transition-colors shadow-sm"
            >
              <span>{showForm ? "✕ Close Form" : "+ Add Product"}</span>
            </button>
          )}

          {activeTab === "categories" && (
            <button
              type="button"
              onClick={() => {
                if (showCategoryForm) {
                  cancelCategoryEditing();
                } else {
                  setEditingCategoryId(null);
                  setCategoryForm(initialCategoryForm);
                  setShowCategoryForm(true);
                  setError("");
                  setSuccess("");
                }
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[#25231F] px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#F7F5F0] hover:bg-[#9B8065] transition-colors shadow-sm"
            >
              <span>{showCategoryForm ? "✕ Close Form" : "+ Add Category"}</span>
            </button>
          )}
        </div>

        {/* TAB 1: PRODUCT MANAGEMENT */}
        {activeTab === "products" && (
          <div className="space-y-8">
            {/* Product Add / Edit Form */}
            {showForm && (
              <div className="rounded-3xl bg-white border border-[#EDE8DF] p-6 sm:p-10 shadow-sm animate-in fade-in duration-300">
                <div className="flex justify-between items-center pb-6 border-b border-[#EDE8DF]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9B8065]">
                      Catalog Editor
                    </p>
                    <h3 className="font-editorial text-2xl font-medium text-[#25231F] mt-1">
                      {editingProductId !== null ? `Edit Product #${editingProductId}` : "Create New Product"}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="text-xs uppercase tracking-wider text-[#77736D] hover:text-[#25231F]"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} className="mt-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#25231F] mb-2">
                        Product Name *
                      </label>
                      <input
                        name="product_name"
                        value={form.product_name}
                        onChange={updateField}
                        required
                        maxLength={255}
                        placeholder="e.g. Minimalist Wireless Headphones"
                        className="w-full rounded-xl border border-[#EDE8DF] bg-[#F7F5F0]/30 px-4 py-3 text-sm focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#25231F] mb-2">
                        Brand
                      </label>
                      <input
                        name="brand"
                        value={form.brand}
                        onChange={updateField}
                        maxLength={120}
                        placeholder="e.g. Studio Craft"
                        className="w-full rounded-xl border border-[#EDE8DF] bg-[#F7F5F0]/30 px-4 py-3 text-sm focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#25231F] mb-2">
                        Category *
                      </label>
                      <select
                        name="category_id"
                        value={form.category_id}
                        onChange={updateField}
                        required
                        className="w-full rounded-xl border border-[#EDE8DF] bg-white px-4 py-3 text-sm"
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category.category_id} value={category.category_id}>
                            {category.category_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#25231F] mb-2">
                        Price (₹) *
                      </label>
                      <input
                        name="price"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={form.price}
                        onChange={updateField}
                        required
                        placeholder="1999.00"
                        className="w-full rounded-xl border border-[#EDE8DF] bg-[#F7F5F0]/30 px-4 py-3 text-sm focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#25231F] mb-2">
                        Discount Price (₹)
                      </label>
                      <input
                        name="discount_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.discount_price}
                        onChange={updateField}
                        placeholder="Leave blank if no discount"
                        className="w-full rounded-xl border border-[#EDE8DF] bg-[#F7F5F0]/30 px-4 py-3 text-sm focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#25231F] mb-2">
                        Stock Quantity *
                      </label>
                      <input
                        name="stock_quantity"
                        type="number"
                        min="0"
                        step="1"
                        value={form.stock_quantity}
                        onChange={updateField}
                        required
                        className="w-full rounded-xl border border-[#EDE8DF] bg-[#F7F5F0]/30 px-4 py-3 text-sm focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#25231F] mb-2">
                        Reorder Threshold Level *
                      </label>
                      <input
                        name="reorder_level"
                        type="number"
                        min="0"
                        step="1"
                        value={form.reorder_level}
                        onChange={updateField}
                        required
                        className="w-full rounded-xl border border-[#EDE8DF] bg-[#F7F5F0]/30 px-4 py-3 text-sm focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#25231F] mb-2">
                        Product Image URL
                      </label>
                      <input
                        name="image_url"
                        type="url"
                        value={form.image_url}
                        onChange={updateField}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full rounded-xl border border-[#EDE8DF] bg-[#F7F5F0]/30 px-4 py-3 text-sm focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#25231F] mb-2">
                      Upload Image File (Alternative)
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="w-full rounded-xl border border-[#EDE8DF] bg-[#F7F5F0]/30 px-4 py-2.5 text-xs text-[#77736D]"
                    />
                    {imagePreview && (
                      <div className="mt-3 flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-16 w-16 rounded-xl border border-[#EDE8DF] object-cover"
                        />
                        <span className="text-xs text-[#77736D]">Active image preview</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#25231F] mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={updateField}
                      rows={3}
                      placeholder="Detailed overview of the product specifications and materials..."
                      className="w-full rounded-xl border border-[#EDE8DF] bg-[#F7F5F0]/30 px-4 py-3 text-sm focus:bg-white"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={saving || categories.length === 0}
                      className="rounded-full bg-[#25231F] px-8 py-3.5 text-xs font-semibold uppercase tracking-widest text-[#F7F5F0] hover:bg-[#9B8065] transition-colors disabled:opacity-50"
                    >
                      {saving
                        ? "Saving Changes..."
                        : editingProductId !== null
                        ? "Update Product"
                        : "Save Product"}
                    </button>

                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="rounded-full border border-[#EDE8DF] bg-white px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#77736D] hover:text-[#25231F] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Product Table Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="search"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Filter products by name or brand..."
                className="flex-1 rounded-xl border border-[#EDE8DF] bg-white px-4 py-3 text-sm"
              />

              <select
                value={tableCategoryFilter}
                onChange={(e) => setTableCategoryFilter(e.target.value)}
                className="rounded-xl border border-[#EDE8DF] bg-white px-4 py-3 text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Products Table */}
            <div className="rounded-3xl bg-white border border-[#EDE8DF] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#EDE8DF] bg-[#F7F5F0]/60 text-[#77736D] uppercase tracking-wider">
                      <th className="py-4 px-5">ID</th>
                      <th className="py-4 px-5">Product Details</th>
                      <th className="py-4 px-5">Category</th>
                      <th className="py-4 px-5">Pricing</th>
                      <th className="py-4 px-5">Stock Level</th>
                      <th className="py-4 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE8DF]/60">
                    {filteredProducts.map((p) => {
                      const isLowStock = p.stock_quantity <= p.reorder_level;

                      return (
                        <tr key={p.product_id} className="hover:bg-[#F7F5F0]/30 transition-colors">
                          <td className="py-4 px-5 font-mono text-[#77736D]">
                            #{p.product_id}
                          </td>

                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={p.image_url || `/products/product-${p.product_id}.jpg`}
                                alt={p.product_name}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop";
                                }}
                                className="h-11 w-11 rounded-lg object-contain p-1 border border-[#EDE8DF] bg-[#FBF9F5]"
                              />
                              <div>
                                <p className="font-semibold text-sm text-[#25231F]">{p.product_name}</p>
                                {p.brand && <p className="text-[11px] text-[#77736D]">{p.brand}</p>}
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-5 text-[#77736D]">
                            <span className="rounded-full bg-[#EDE8DF] px-2.5 py-0.5 text-[10px] font-semibold text-[#80664E] uppercase tracking-wider">
                              {p.category_name || "Unassigned"}
                            </span>
                          </td>

                          <td className="py-4 px-5">
                            <p className="font-semibold text-[#25231F]">
                              ₹{Number(p.discount_price ?? p.price).toLocaleString("en-IN")}
                            </p>
                            {p.discount_price !== null && (
                              <p className="text-[10px] text-[#A5A19B] line-through">
                                ₹{Number(p.price).toLocaleString("en-IN")}
                              </p>
                            )}
                          </td>

                          <td className="py-4 px-5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                                isLowStock
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${isLowStock ? "bg-rose-600" : "bg-emerald-600"}`} />
                              {p.stock_quantity} in stock (Reorder: {p.reorder_level})
                            </span>
                          </td>

                          <td className="py-4 px-5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => startEditing(p)}
                                className="rounded-lg border border-[#EDE8DF] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#25231F] hover:bg-[#25231F] hover:text-white transition-colors"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p.product_id)}
                                disabled={deletingId === p.product_id}
                                className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-rose-600 hover:bg-rose-600 hover:text-white transition-colors disabled:opacity-50"
                              >
                                {deletingId === p.product_id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-xs text-[#77736D]">
                          No products found matching the criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORY MANAGEMENT */}
        {activeTab === "categories" && (
          <div className="space-y-8">
            {/* Category Form */}
            {showCategoryForm && (
              <div className="rounded-3xl bg-white border border-[#EDE8DF] p-6 sm:p-10 shadow-sm animate-in fade-in duration-300">
                <div className="flex justify-between items-center pb-6 border-b border-[#EDE8DF]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9B8065]">
                      Taxonomy Editor
                    </p>
                    <h3 className="font-editorial text-2xl font-medium text-[#25231F] mt-1">
                      {editingCategoryId !== null
                        ? `Edit Category #${editingCategoryId}`
                        : "Create Category"}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={cancelCategoryEditing}
                    className="text-xs uppercase tracking-wider text-[#77736D] hover:text-[#25231F]"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleSaveCategory} className="mt-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#25231F] mb-2">
                        Category Name *
                      </label>
                      <input
                        name="category_name"
                        value={categoryForm.category_name}
                        onChange={updateCategoryField}
                        required
                        maxLength={100}
                        placeholder="e.g. Fine Fragrances"
                        className="w-full rounded-xl border border-[#EDE8DF] bg-[#F7F5F0]/30 px-4 py-3 text-sm focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#25231F] mb-2">
                        Parent Category (Optional)
                      </label>
                      <select
                        name="parent_category_id"
                        value={categoryForm.parent_category_id}
                        onChange={updateCategoryField}
                        className="w-full rounded-xl border border-[#EDE8DF] bg-white px-4 py-3 text-sm"
                      >
                        <option value="">No parent (Top level department)</option>
                        {categories
                          .filter((c) => c.category_id !== editingCategoryId)
                          .map((c) => (
                            <option key={c.category_id} value={c.category_id}>
                              {c.category_name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#25231F] mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={categoryForm.description}
                      onChange={updateCategoryField}
                      rows={3}
                      placeholder="Category scope and merchandising notes..."
                      className="w-full rounded-xl border border-[#EDE8DF] bg-[#F7F5F0]/30 px-4 py-3 text-sm focus:bg-white"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={savingCategory}
                      className="rounded-full bg-[#25231F] px-8 py-3.5 text-xs font-semibold uppercase tracking-widest text-[#F7F5F0] hover:bg-[#9B8065] transition-colors disabled:opacity-50"
                    >
                      {savingCategory
                        ? "Saving..."
                        : editingCategoryId !== null
                        ? "Update Category"
                        : "Save Category"}
                    </button>

                    <button
                      type="button"
                      onClick={cancelCategoryEditing}
                      className="rounded-full border border-[#EDE8DF] bg-white px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#77736D] hover:text-[#25231F] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Categories Table */}
            <div className="rounded-3xl bg-white border border-[#EDE8DF] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#EDE8DF] bg-[#F7F5F0]/60 text-[#77736D] uppercase tracking-wider">
                      <th className="py-4 px-5">ID</th>
                      <th className="py-4 px-5">Category Name</th>
                      <th className="py-4 px-5">Description</th>
                      <th className="py-4 px-5">Parent Category</th>
                      <th className="py-4 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE8DF]/60">
                    {categories.map((c) => {
                      const parent = categories.find((item) => item.category_id === c.parent_category_id);

                      return (
                        <tr key={c.category_id} className="hover:bg-[#F7F5F0]/30 transition-colors">
                          <td className="py-4 px-5 font-mono text-[#77736D]">
                            #{c.category_id}
                          </td>
                          <td className="py-4 px-5 font-semibold text-[#25231F]">
                            {c.category_name}
                          </td>
                          <td className="py-4 px-5 text-[#77736D] max-w-xs truncate">
                            {c.description || "—"}
                          </td>
                          <td className="py-4 px-5 text-[#77736D]">
                            {parent ? parent.category_name : "None (Root)"}
                          </td>
                          <td className="py-4 px-5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => startEditingCategory(c)}
                                className="rounded-lg border border-[#EDE8DF] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#25231F] hover:bg-[#25231F] hover:text-white transition-colors"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(c.category_id)}
                                disabled={deletingCategoryId === c.category_id}
                                className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-rose-600 hover:bg-rose-600 hover:text-white transition-colors disabled:opacity-50"
                              >
                                {deletingCategoryId === c.category_id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {categories.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-xs text-[#77736D]">
                          No categories defined in the database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INVENTORY LEVELS */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            {lowStockCount > 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-xs text-amber-900 flex items-center gap-3">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="font-semibold">Reorder Warning Required</p>
                  <p className="mt-0.5">
                    There are {lowStockCount} items at or below their configured safety reorder thresholds.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-xs text-emerald-900 flex items-center gap-3">
                <span className="text-lg">✓</span>
                <p className="font-semibold">All inventory stock quantities exceed reorder thresholds.</p>
              </div>
            )}

            <div className="rounded-3xl bg-white border border-[#EDE8DF] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#EDE8DF] bg-[#F7F5F0]/60 text-[#77736D] uppercase tracking-wider">
                      <th className="py-4 px-5">Product Name</th>
                      <th className="py-4 px-5">Category</th>
                      <th className="py-4 px-5">Unit Price</th>
                      <th className="py-4 px-5">Stock In Warehouse</th>
                      <th className="py-4 px-5">Safety Threshold</th>
                      <th className="py-4 px-5">Status</th>
                      <th className="py-4 px-5 text-right">Adjustment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE8DF]/60">
                    {products.map((p) => {
                      const isLow = p.stock_quantity <= p.reorder_level;

                      return (
                        <tr key={p.product_id} className="hover:bg-[#F7F5F0]/30 transition-colors">
                          <td className="py-4 px-5 font-semibold text-[#25231F]">
                            {p.product_name}
                          </td>
                          <td className="py-4 px-5 text-[#77736D]">
                            {p.category_name || "Uncategorized"}
                          </td>
                          <td className="py-4 px-5 font-mono text-[#25231F]">
                            ₹{Number(p.price).toFixed(2)}
                          </td>
                          <td className="py-4 px-5 font-bold text-sm">
                            {p.stock_quantity}
                          </td>
                          <td className="py-4 px-5 text-[#77736D]">
                            {p.reorder_level}
                          </td>
                          <td className="py-4 px-5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                isLow
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${isLow ? "bg-rose-600" : "bg-emerald-600"}`} />
                              {isLow ? "Low Stock" : "Sufficient"}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right">
                            <button
                              type="button"
                              onClick={() => startEditing(p)}
                              className="rounded-lg border border-[#EDE8DF] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#25231F] hover:bg-[#25231F] hover:text-white transition-colors"
                            >
                              Restock / Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
