"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, X, Package, Loader2 } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAuth } from "@/app/lib/auth-context";
import { getDashboardProducts, createDashboardProduct, updateDashboardProduct, deleteDashboardProduct, type DashboardProduct } from "@/app/lib/business-dashboard-api";

export default function BusinessProductsPage() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<DashboardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", price: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!accessToken) return;
    getDashboardProducts(accessToken)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const handleCreate = async () => {
    if (!accessToken || !form.name.trim()) return;
    setSubmitting(true);
    try {
      const created = await createDashboardProduct(
        accessToken,
        { name: form.name.trim(), category: form.category.trim() || undefined, price: form.price ? Number(form.price) : undefined },
        imageFile ?? undefined,
      );
      setItems((prev) => [created, ...prev]);
      setShowForm(false);
      setForm({ name: "", category: "", price: "" });
      setImageFile(null);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAvailable = async (item: DashboardProduct) => {
    if (!accessToken) return;
    const updated = await updateDashboardProduct(accessToken, item.id, { isAvailable: !item.isAvailable });
    setItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) return;
    await deleteDashboardProduct(accessToken, id);
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col font-sans flex-1 min-h-[calc(100vh-64px)] bg-white w-full">
      {/* Header Bar */}
      <div className="bg-white rounded-none border-b border-slate-200/90 p-4 lg:p-5 shadow-none shadow-slate-200/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-none">
              Catalog Management
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">{items.length} Items</span>
          </div>
          <h1 className="text-base sm:text-2xl font-black text-slate-900 mt-1">Products & Services Catalog</h1>
          <p className="text-[10px] sm:text-xs text-slate-500 font-semibold mt-0.5">Add items, prices, and availability to your public listing.</p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-none shadow-none flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product/Service</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-none border-b border-purple-200 p-5 shadow-none space-y-3  relative z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900">New Product/Service</h3>
            <button onClick={() => setShowForm(false)} className="cursor-pointer text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Item name"
              className="px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-none text-xs font-semibold focus:outline-none focus:border-purple-600"
            />
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Category (optional)"
              className="px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-none text-xs font-semibold focus:outline-none focus:border-purple-600"
            />
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Price in ₹ (optional)"
              className="px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-none text-xs font-semibold focus:outline-none focus:border-purple-600"
            />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} className="text-xs" />
          </div>
          <button
            onClick={handleCreate}
            disabled={submitting || !form.name.trim()}
            className="px-5 py-2.5 bg-purple-600 text-white font-bold text-xs rounded-none cursor-pointer disabled:opacity-60"
          >
            {submitting ? "Adding..." : "Add Item"}
          </button>
        </div>
      )}

      {/* Grid of Catalog Items */}
      {items.length === 0 ? (
        <div className="bg-white rounded-none border-b border-slate-200/90 p-8 text-center text-xs text-slate-500 font-semibold  relative z-10">No products yet.</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-0 relative z-10">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-none border-b border-slate-200/90 overflow-hidden shadow-none space-y-2 p-3 lg:p-4 flex flex-col justify-between ">
              <div className="space-y-2">
                <div className="h-28 sm:h-40 w-full rounded-none overflow-hidden relative bg-slate-100 flex items-center justify-center">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 text-slate-300" />
                  )}
                  {!item.isAvailable && (
                    <span className="absolute top-2 left-2 bg-slate-700 text-white text-[8px] sm:text-[9px] font-black px-1.5 sm:px-2 py-0.5 rounded-none shadow-none">Unavailable</span>
                  )}
                </div>

                <div>
                  {item.category && <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-purple-600">{item.category}</span>}
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight mt-0.5">{item.name}</h4>
                  {item.price != null && <p className="text-sm sm:text-base font-black text-slate-900 mt-0.5">₹{item.price}</p>}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => toggleAvailable(item)}
                  className={cn(
                    "px-2 sm:px-3 py-1 sm:py-1.5 rounded-none sm:rounded-none text-[10px] sm:text-xs font-bold transition-all cursor-pointer",
                    item.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600",
                  )}
                >
                  {item.isAvailable ? "Available" : "Unavailable"}
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 rounded-none hover:bg-rose-50 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
