'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function MaterialsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: '',
    price_usd: '',
  });

  const categories = [
    'Cement', 'Bricks', 'Steel', 'Timber', 'Roofing', 
    'Paint', 'Plumbing', 'Electrical', 'Sanitary', 'Hardware', 'Other'
  ];

  const units = ['bag', 'piece', 'sheet', 'litre', 'm³', 'kg', 'roll', 'set', 'tonne', 'day', 'each'];

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: storeData } = await supabase
        .from('hardware_stores')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (storeData) {
        setStore(storeData);
        
        const { data: materialsData } = await supabase
          .from('materials')
          .select('*')
          .eq('hardware_store_id', storeData.id)
          .order('created_at', { ascending: false });

        setMaterials(materialsData || []);
      }

      setLoading(false);
    }

    loadData();
  }, [router]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    if (!formData.name || !formData.price_usd) {
      setMessage({ type: 'error', text: 'Please fill in material name and price.' });
      setSaving(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('materials')
        .insert({
          hardware_store_id: store.id,
          name: formData.name,
          category: formData.category || 'Other',
          unit: formData.unit || 'each',
          price_usd: parseFloat(formData.price_usd),
          currency: 'USD',
          in_stock: true,
        })
        .select();

      if (error) {
        setMessage({ type: 'error', text: error.message });
        setSaving(false);
        return;
      }

      setMessage({ type: 'success', text: '✅ Material added successfully!' });
      setMaterials([data[0], ...materials]);
      setFormData({ name: '', category: '', unit: '', price_usd: '' });
      setShowForm(false);
    } catch (err) {
      setMessage({ type: 'error', text: 'Something went wrong.' });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      if (error) {
        alert('Failed to delete material.');
        return;
      }

      setMaterials(materials.filter(m => m.id !== id));
    } catch (err) {
      alert('Something went wrong.');
    }
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    setMessage('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F47B20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#2C3E50]">📦 Materials</h1>
            <p className="text-gray-600">Manage your store inventory</p>
          </div>
          
          <button
            type="button"
            onClick={toggleForm}
            className="bg-[#F47B20] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#E06B10] transition w-full sm:w-auto cursor-pointer"
          >
            {showForm ? '✕ Cancel' : '+ Add Material'}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Add Material Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-bold text-[#2C3E50] mb-4">Add New Material</h2>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                  placeholder="e.g., Cement 50kg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                >
                  <option value="">Select unit</option>
                  {units.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD) *</label>
                <input
                  type="number"
                  name="price_usd"
                  value={formData.price_usd}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F47B20] focus:border-transparent outline-none"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="md:col-span-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#F47B20] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E06B10] transition disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Add Material'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Materials List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {materials.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#2C3E50] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Material</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Unit</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Price (USD)</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((material) => (
                    <tr key={material.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-[#2C3E50]">{material.name}</td>
                      <td className="px-4 py-3 text-gray-600">{material.category || 'Uncategorized'}</td>
                      <td className="px-4 py-3 text-gray-600">{material.unit}</td>
                      <td className="px-4 py-3 font-bold text-[#2C3E50]">${material.price_usd}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(material.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-500">No materials added yet</p>
              {/* THIS IS A BUTTON - NOT A LINK - NO 404 */}
              <button
                type="button"
                onClick={toggleForm}
                className="mt-4 text-[#F47B20] hover:underline font-medium cursor-pointer"
              >
                + Add your first material
              </button>
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <Link href="/dashboard/hardware" className="text-gray-600 hover:text-[#2C3E50] transition">
            ← Back to Hardware Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
    }
