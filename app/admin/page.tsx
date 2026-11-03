"use client";


import { useEffect, useState, type FormEvent } from "react";

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

  const [deletingCategoryId, setDeletingCategoryId] =

    useState<number | null>(null);


  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");


  const [showForm, setShowForm] = useState(false);

  const [editingProductId, setEditingProductId] = useState<number | null>(

    null

  );


  const [form, setForm] = useState<ProductForm>(initialForm);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [imagePreview, setImagePreview] = useState("");
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const [editingCategoryId, setEditingCategoryId] =

    useState<number | null>(null);

  const [categoryForm, setCategoryForm] =

    useState<CategoryForm>(initialCategoryForm);


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

    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>

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

      form.discount_price.trim() === ""

        ? null

        : Number(form.discount_price);


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

      setError(

        err instanceof Error ? err.message : "Invalid product details"

      );

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

        isEditing

          ? "Product updated successfully!"

          : "Product added successfully!"

      );


      setForm(initialForm);

      setSelectedImage(null);

      setImagePreview("");

      setEditingProductId(null);

      setShowForm(false);


      await loadDashboard();

    } catch (err) {

      setError(

        err instanceof Error ? err.message : "Unable to save product"

      );

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

        product.discount_price == null

          ? ""

          : String(product.discount_price),

      image_url: product.image_url || "",

      stock_quantity: String(product.stock_quantity),

      reorder_level: String(product.reorder_level),

    });


    setSelectedImage(null);

    setImagePreview(product.image_url || "");

    setError("");

    setSuccess("");

    setShowForm(true);


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

    if (

      !window.confirm(

        "Are you sure you want to delete this product?"

      )

    ) {

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


      if (editingProductId === productId) {

        cancelEditing();

      }


      setSuccess("Product deleted successfully!");

      await loadDashboard();

    } catch (err) {

      setError(

        err instanceof Error ? err.message : "Unable to delete product"

      );

    } finally {

      setDeletingId(null);

    }

  }


  // CATEGORY MANAGEMENT


  function startEditingCategory(category: Category) {

    setEditingCategoryId(category.category_id);


    setCategoryForm({

      category_name: category.category_name,

      description: category.description || "",

      parent_category_id:

        category.parent_category_id == null

          ? ""

          : String(category.parent_category_id),

    });


    setShowCategoryForm(true);

    setError("");

    setSuccess("");


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

          : "Category added successfully!"

      );


      setCategoryForm(initialCategoryForm);

      setEditingCategoryId(null);

      setShowCategoryForm(false);


      await loadDashboard();

    } catch (err) {

      setError(

        err instanceof Error ? err.message : "Unable to save category"

      );

    } finally {

      setSavingCategory(false);

    }

  }


  async function handleDeleteCategory(categoryId: number) {

    if (

      !window.confirm(

        "Are you sure you want to delete this category?"

      )

    ) {

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


      if (editingCategoryId === categoryId) {

        cancelCategoryEditing();

      }


      setSuccess("Category deleted successfully!");

      await loadDashboard();

    } catch (err) {

      setError(

        err instanceof Error ? err.message : "Unable to delete category"

      );

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

    } catch {

      setError("Unable to log out. Please try again.");

    }

  }


  const lowStockCount = products.filter(

    (product) => product.stock_quantity <= product.reorder_level

  ).length;


  if (loading) {

    return <main className="p-8">Loading admin dashboard...</main>;

  }


  return (

    <main className="min-h-screen bg-gray-100 p-6 text-gray-900 md:p-10">

      <div className="mx-auto max-w-7xl">


        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">

          <div>

            <h1 className="text-3xl font-bold">IntelliShop Admin</h1>

            <p className="mt-2 text-gray-600">

              Manage your online shopping store

            </p>

          </div>


          <div className="flex gap-3">

            <Link

              href="/"

              className="rounded-lg bg-gray-900 px-5 py-3 text-white hover:bg-gray-700"

            >

              View Store

            </Link>


            <button

              onClick={handleLogout}

              className="rounded-lg bg-red-600 px-5 py-3 text-white hover:bg-red-700"

            >

              Logout

            </button>

          </div>

        </header>


        {error && (

          <p className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">

            {error}

          </p>

        )}


        {success && (

          <p className="mb-6 rounded-lg bg-green-100 p-4 text-green-700">

            {success}

          </p>

        )}


        <section className="mb-8 grid gap-5 sm:grid-cols-2">

          <div className="rounded-xl bg-white p-6 shadow-sm">

            <p className="text-gray-500">Total Products</p>

            <p className="mt-2 text-3xl font-bold">{products.length}</p>

          </div>


          <div className="rounded-xl bg-white p-6 shadow-sm">

            <p className="text-gray-500">Low Stock Products</p>

            <p className="mt-2 text-3xl font-bold text-red-600">

              {lowStockCount}

            </p>

          </div>

        </section>


        {/* PRODUCT MANAGEMENT */}


        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>

              <h2 className="text-xl font-bold">Product Management</h2>

              <p className="mt-1 text-sm text-gray-500">

                Add, edit and manage products

              </p>

            </div>


            <button

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

              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"

            >

              {showForm ? "Close Form" : "+ Add Product"}

            </button>

          </div>


          {showForm && (

            <form onSubmit={handleSaveProduct} className="mt-6 space-y-5">

              <h3 className="text-lg font-semibold">

                {editingProductId !== null ? "Edit Product" : "Add New Product"}

              </h3>


              <div className="grid gap-5 md:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-medium">

                    Product Name *

                  </label>

                  <input

                    name="product_name"

                    value={form.product_name}

                    onChange={updateField}

                    required

                    maxLength={255}

                    className="w-full rounded-lg border p-3"

                  />

                </div>


                <div>

                  <label className="mb-2 block text-sm font-medium">

                    Brand

                  </label>

                  <input

                    name="brand"

                    value={form.brand}

                    onChange={updateField}

                    maxLength={120}

                    className="w-full rounded-lg border p-3"

                  />

                </div>


                <div>

                  <label className="mb-2 block text-sm font-medium">

                    Category *

                  </label>

                  <select

                    name="category_id"

                    value={form.category_id}

                    onChange={updateField}

                    required

                    className="w-full rounded-lg border bg-white p-3"

                  >

                    <option value="">Select a category</option>

                    {categories.map((category) => (

                      <option

                        key={category.category_id}

                        value={category.category_id}

                      >

                        {category.category_name}

                      </option>

                    ))}

                  </select>

                </div>


                <div>

                  <label className="mb-2 block text-sm font-medium">

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

                    className="w-full rounded-lg border p-3"

                  />

                </div>


                <div>

                  <label className="mb-2 block text-sm font-medium">

                    Discount Price (₹)

                  </label>

                  <input

                    name="discount_price"

                    type="number"

                    min="0"

                    step="0.01"

                    value={form.discount_price}

                    onChange={updateField}

                    className="w-full rounded-lg border p-3"

                  />

                </div>


                <div>

                  <label className="mb-2 block text-sm font-medium">

                    Product Image (JPG, PNG, WEBP; max 5 MB)

                  </label>

                  <input

                    type="file"

                    accept="image/jpeg,image/png,image/webp"

                    onChange={handleImageChange}

                    className="w-full rounded-lg border p-3"

                  />

                  {imagePreview && (

                    <div className="mt-3">

                      <p className="mb-2 text-xs text-gray-500">Image preview</p>

                      <img

                        src={imagePreview}

                        alt="Product image preview"

                        className="h-32 w-32 rounded-lg border object-contain"

                      />

                    </div>

                  )}

                  <label className="mb-2 mt-3 block text-sm font-medium">

                    Or enter an existing Image URL

                  </label>

                  <input

                    name="image_url"

                    type="url"

                    value={form.image_url}

                    onChange={updateField}

                    placeholder="https\://example.com/product.jpg"

                    className="w-full rounded-lg border p-3"

                  />

                </div>


                <div>

                  <label className="mb-2 block text-sm font-medium">

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

                    className="w-full rounded-lg border p-3"

                  />

                </div>


                <div>

                  <label className="mb-2 block text-sm font-medium">

                    Reorder Level *

                  </label>

                  <input

                    name="reorder_level"

                    type="number"

                    min="0"

                    step="1"

                    value={form.reorder_level}

                    onChange={updateField}

                    required

                    className="w-full rounded-lg border p-3"

                  />

                </div>

              </div>


              <div>

                <label className="mb-2 block text-sm font-medium">

                  Description

                </label>

                <textarea

                  name="description"

                  value={form.description}

                  onChange={updateField}

                  rows={4}

                  className="w-full rounded-lg border p-3"

                />

              </div>


              <div className="flex flex-wrap gap-3">

                <button

                  type="submit"

                  disabled={saving || categories.length === 0}

                  className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"

                >

                  {saving

                    ? "Saving..."

                    : editingProductId !== null

                      ? "Update Product"

                      : "Save Product"}

                </button>


                {editingProductId !== null && (

                  <button

                    type="button"

                    onClick={cancelEditing}

                    className="rounded-lg bg-gray-200 px-6 py-3 font-semibold"

                  >

                    Cancel Edit

                  </button>

                )}

              </div>

            </form>

          )}

        </section>


        {/* CATEGORY MANAGEMENT */}


        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>

              <h2 className="text-xl font-bold">Category Management</h2>

              <p className="mt-1 text-sm text-gray-500">

                Add, edit and manage product categories

              </p>

            </div>


            <button

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

              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"

            >

              {showCategoryForm ? "Close Form" : "+ Add Category"}

            </button>

          </div>


          {showCategoryForm && (

            <form

              onSubmit={handleSaveCategory}

              className="mt-6 space-y-5"

            >

              <h3 className="text-lg font-semibold">

                {editingCategoryId !== null

                  ? "Edit Category"

                  : "Add New Category"}

              </h3>


              <div className="grid gap-5 md:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-medium">

                    Category Name *

                  </label>

                  <input

                    name="category_name"

                    value={categoryForm.category_name}

                    onChange={updateCategoryField}

                    required

                    maxLength={100}

                    className="w-full rounded-lg border p-3"

                    placeholder="Enter category name"

                  />

                </div>


                <div>

                  <label className="mb-2 block text-sm font-medium">

                    Parent Category

                  </label>

                  <select

                    name="parent_category_id"

                    value={categoryForm.parent_category_id}

                    onChange={updateCategoryField}

                    className="w-full rounded-lg border bg-white p-3"

                  >

                    <option value="">No parent category</option>

                    {categories

                      .filter(

                        (category) =>

                          category.category_id !== editingCategoryId

                      )

                      .map((category) => (

                        <option

                          key={category.category_id}

                          value={category.category_id}

                        >

                          {category.category_name}

                        </option>

                      ))}

                  </select>

                </div>

              </div>


              <div>

                <label className="mb-2 block text-sm font-medium">

                  Description

                </label>

                <textarea

                  name="description"

                  value={categoryForm.description}

                  onChange={updateCategoryField}

                  rows={3}

                  className="w-full rounded-lg border p-3"

                  placeholder="Describe this category"

                />

              </div>


              <div className="flex flex-wrap gap-3">

                <button

                  type="submit"

                  disabled={savingCategory}

                  className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"

                >

                  {savingCategory

                    ? "Saving..."

                    : editingCategoryId !== null

                      ? "Update Category"

                      : "Save Category"}

                </button>


                {editingCategoryId !== null && (

                  <button

                    type="button"

                    onClick={cancelCategoryEditing}

                    className="rounded-lg bg-gray-200 px-6 py-3 font-semibold"

                  >

                    Cancel Edit

                  </button>

                )}

              </div>

            </form>

          )}


          <div className="mt-6 overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead>

                <tr className="border-b text-gray-500">

                  <th className="p-3">Category ID</th>

                  <th className="p-3">Category Name</th>

                  <th className="p-3">Description</th>

                  <th className="p-3">Parent</th>

                  <th className="p-3">Actions</th>

                </tr>

              </thead>


              <tbody>

                {categories.map((category) => (

                  <tr

                    key={category.category_id}

                    className="border-b last:border-0"

                  >

                    <td className="p-3">{category.category_id}</td>


                    <td className="p-3 font-medium">

                      {category.category_name}

                    </td>


                    <td className="p-3">

                      {category.description || "—"}

                    </td>


                    <td className="p-3">

                      {categories.find(

                        (item) =>

                          item.category_id === category.parent_category_id

                      )?.category_name || "None"}

                    </td>


                    <td className="p-3">

                      <div className="flex flex-wrap gap-2">

                        <button

                          onClick={() => startEditingCategory(category)}

                          className="rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"

                        >

                          Edit

                        </button>


                        <button

                          onClick={() =>

                            handleDeleteCategory(category.category_id)

                          }

                          disabled={

                            deletingCategoryId === category.category_id

                          }

                          className="rounded-md bg-red-600 px-3 py-2 text-white hover:bg-red-700 disabled:opacity-50"

                        >

                          {deletingCategoryId === category.category_id

                            ? "Deleting..."

                            : "Delete"}

                        </button>

                      </div>

                    </td>

                  </tr>

                ))}


                {categories.length === 0 && (

                  <tr>

                    <td

                      colSpan={5}

                      className="p-6 text-center text-gray-500"

                    >

                      No categories found.

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </section>


        {/* PRODUCT INVENTORY */}


        <section className="rounded-xl bg-white p-6 shadow-sm">

          <h2 className="mb-5 text-xl font-bold">Product Inventory</h2>


          {products.length === 0 ? (

            <p className="py-8 text-center text-gray-500">

              No products found. Add products to get started.

            </p>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-left text-sm">

                <thead>

                  <tr className="border-b text-gray-500">

                    <th className="p-3">Product</th>

                    <th className="p-3">Category</th>

                    <th className="p-3">Price</th>

                    <th className="p-3">Stock</th>

                    <th className="p-3">Actions</th>

                  </tr>

                </thead>


                <tbody>

                  {products.map((product) => (

                    <tr

                      key={product.product_id}

                      className="border-b last:border-0"

                    >

                      <td className="p-3 font-medium">

                        {product.product_name}

                      </td>


                      <td className="p-3">

                        {product.category_name || "Uncategorized"}

                      </td>


                      <td className="p-3">

                        ₹{Number(product.price).toFixed(2)}

                      </td>


                      <td className="p-3">

                        <span

                          className={

                            product.stock_quantity <= product.reorder_level

                              ? "font-semibold text-red-600"

                              : "font-semibold text-green-700"

                          }

                        >

                          {product.stock_quantity}

                        </span>

                      </td>


                      <td className="p-3">

                        <div className="flex flex-wrap gap-2">

                          <button

                            onClick={() => startEditing(product)}

                            className="rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"

                          >

                            Edit

                          </button>


                          <button

                            onClick={() =>

                              handleDeleteProduct(product.product_id)

                            }

                            disabled={deletingId === product.product_id}

                            className="rounded-md bg-red-600 px-3 py-2 text-white hover:bg-red-700 disabled:opacity-50"

                          >

                            {deletingId === product.product_id

                              ? "Deleting..."

                              : "Delete"}

                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>

    </main>

  );

}
