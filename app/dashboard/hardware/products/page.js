'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { BOQ_SECTIONS, findCatalogItem } from '@/lib/boq/catalog';

const BRANDS_BY_CATEGORY = {
  Cement: ['PPC', 'Lafarge', 'Sino', 'Dura', 'Other', 'No specific brand'],
  Bricks: ['Betta Bricks', 'Willdale', 'Other', 'No specific brand'],
  Roofing: ['Turnall', 'Zimboard', 'Dura', 'Other', 'No specific brand'],
  Timber: ['Other', 'No specific brand'],
  Steel: ['Steelmakers', 'Other', 'No specific brand'],
  default: ['Other', 'No specific brand'],
};

const EMPTY_FORM = {
  id: null,
  catalog_name: '',
  brand: '',
  price_usd: '',
  in_stock: true,
};

// Derive a category label from the catalog section (used for brand suggestions)
function categoryFromSection(sectionKey) {
  if (sectionKey === 'A' || sectionKey === 'B') return 'Cement';
  if (sectionKey === 'C') return 'Roofing';
  if (sectionKey === 'D') return 'Finishes';
  if (sectionKey === 'E') return 'Services';
  return 'default';
}

export default function HardwareProductsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    loadData();
  }, [router]);

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const { data: storeData, error: storeError } = await supabase
      .from('hardware_stores')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (storeError) {
      console.error('Store lookup error:', storeError);
      setError(storeError.message);
      setLoading(false);
      return;
    }

    if (!storeData) {
      setError('You do not have a hardware store listing yet.');
      setLoading(false);
      return;
    }

    setStore(storeData);

    const { data: productsData, error: productsError } = await supabase
      .from('materials')
      .select('*')
      .eq('hardware_store_id', storeData.id)
      .order('name', { ascending: true });

    if (productsError) {
      console.error('Products load error:', productsError);
      setError(productsError.message);
      setLoading(false);
      return;
    }

    setProducts(productsData || []);
    setLoading(false);
  }

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const openAddForm = () => {
    setFormData(EMPTY_FORM);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const openEditForm = (product) => {
    setFormData({
      id: product.id,
      catalog_name: product.name || '',
      brand: '',
      price_usd: product.price_usd != null ? String(product.price_usd) : '',
      in_stock: product.in_stock !== false,
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;

    const { error: deleteError } = await supabase
      .from('materials')
      .delete()
      .eq('id', product.id);

    if (deleteError) {
      setError(`Failed to delete: ${deleteError.message}`);
      return;
    }

    setProducts(products.filter((p) => p.id !== product.id));
    setSuccess('Product deleted.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    if (!formData.catalog_name) {
      setError('Please select a BOQ material from the list');
      setSaving(false);
      return;
    }

    if (!formData.price_usd || isNaN(parseFloat(formData.price_usd))) {
      setError('A valid price is required');
      setSaving(false);
      return;
    }

    const catalogItem = findCatalogItem(formData.catalog_name);
    if (!catalogItem) {
      setError('Selected material not found in catalog');
      setSaving(false);
      return;
    }

    // Build the description. Brand, when present, is prefixed to the name.
    const displayName = formData.brand && formData.brand !== 'No specific brand'
      ? `${formData.brand} - ${catalogItem.name}`
      : catalogItem.name;

    const payload = {
      hardware_store_id: store.id,
      name: catalogItem.name,
      category: catalogItem.section,
      unit: catalogItem.unit,
      price_usd: parseFloat(formData.price_usd),
      currency: 'USD',
      in_stock: !!formData.in_stock,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (formData.id) {
      result = await supabase
        .from('materials')
        .update(payload)
        .eq('id', formData.id)
        .select();
    } else {
      result = await supabase.from('materials').insert([payload]).select();
    }

    if (result.error) {
      console.error('Save error:', result.error);
      setError(`Failed to save: ${result.error.message}`);
      setSaving(false);
      return;
    }

    await loadData();
    setShowForm(false);
    setFormData(EMPTY_FORM);
    setSuccess(formData.id ? 'Product updated.' : 'Product added.');
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="md:ml-64 p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h2 className="font-bold text-amber-900 mb-2">No store listing found</h2>
              <p className="text-sm text-amber-800 mb-4">
                You need a hardware store listing before you can add products.
              </p>
              <button
                onClick={() => router.push('/dashboard/hardware')}
                className="bg-[#F47B20] text-white px-5 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition text-sm"
              >
                Go to My Store
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedItem = formData.catalog_name ? findCatalogItem(formData.catalog_name) : null;
  const brandOptions = selectedItem
    ? BRANDS_BY_CATEGORY[categoryFromSection(selectedItem.section)] || BRANDS_BY_CATEGORY.default
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="md:ml-64 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">

          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <button
                onClick={() => router.push('/dashboard/hardware')}
                className="text-sm text-gray-600 hover:text-gray-800 mb-2"
              >
                ← Back to My Store
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] mb-1">
                My Products
              </h1>
              <p className="text-gray-600 text-sm">
                {store.store_name} — your price list appears on BOQ pages in your city.
              </p>
            </div>
            <button
              onClick={openAddForm}
              className="bg-[#F47B20] text-white px-5 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition text-sm whitespace-nowrap"
            >
              + Add Product
            </button>
          </div>

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {products.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4 text-gray-300">[ ]</div>
              <h2 className="text-xl font-bold text-[#2C3E50] mb-2">
                No products yet
              </h2>
              <p className="text-gray-500 mb-6">
                Add your first product to start appearing in BOQ price comparisons.
              </p>
              <button
                onClick={openAddForm}
                className="bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition"
              >
                Add Your First Product
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#2C3E50] text-white">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">BOQ Material</th>
                      <th className="text-left px-4 py-3 font-semibold">Unit</th>
                      <th className="text-right px-4 py-3 font-semibold">Price (USD)</th>
                      <th className="text-center px-4 py-3 font-semibold">In Stock</th>
                      <th className="text-right px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 font-medium text-[#2C3E50]">
                          {product.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{product.unit}</td>
                        <td className="px-4 py-3 text-right font-semibold text-[#2C3E50]">
                          ${Number(product.price_usd).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              product.in_stock !== false
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {product.in_stock !== false ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openEditForm(product)}
                            className="text-[#F47B20] hover:underline text-sm font-medium mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="text-red-500 hover:underline text-sm font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-4 text-center">
            Products are matched against BOQ line items by exact name. Select from the standard
            catalog to guarantee a match. Brand is displayed on your store profile but does not
            affect matching.
          </p>

        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#2C3E50]">
                {formData.id ? 'Edit Product' : 'Add Product'}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Select a material from the standard BOQ catalog.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  BOQ Material <span className="text-red-500">*</span>
                </label>
                <select
                  name="catalog_name"
                  value={formData.catalog_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none text-sm"
                  required
                >
                  <option value="">— Select a material —</option>
                  {BOQ_SECTIONS.map((section) => (
                    <optgroup key={section.key} label={`Section ${section.key} — ${section.label}`}>
                      {section.items.map((item) => (
                        <option key={item.code} value={item.name}>
                          {item.name} ({item.unit})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {selectedItem && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
                  <div className="text-gray-600">
                    <span className="font-medium">Code:</span> {selectedItem.code}
                  </div>
                  <div className="text-gray-600">
                    <span className="font-medium">Unit:</span> {selectedItem.unit}
                  </div>
                </div>
              )}

              {selectedItem && brandOptions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand (optional)
                  </label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none text-sm"
                  >
                    <option value="">— Not specified —</option>
                    {brandOptions.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Shown on your store page. Does not affect BOQ matching.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (USD) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price_usd"
                  value={formData.price_usd}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none text-sm"
                  placeholder="11.00"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="in_stock"
                  checked={formData.in_stock}
                  onChange={handleChange}
                  id="in_stock"
                  className="w-4 h-4 rounded border-gray-300 text-[#F47B20] focus:ring-[#F47B20]"
                />
                <label htmlFor="in_stock" className="text-sm text-gray-700">
                  Currently in stock
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData(EMPTY_FORM);
                    setError('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#F47B20] text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-[#E06B10] transition disabled:opacity-50 text-sm"
                >
                  {saving ? 'Saving...' : formData.id ? 'Update' : 'Add Product'}
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
  }
