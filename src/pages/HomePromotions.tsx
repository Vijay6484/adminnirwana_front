import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, XCircle, Image as ImageIcon, Link2, Loader } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../lib/apiClient';

interface Promotion {
  id: string;
  imageUrl: string;
  title: string;
  link: string;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm = (): Omit<Promotion, 'id'> => ({
  imageUrl: '',
  title: '',
  link: '/hotels',
  sortOrder: 0,
  isActive: true,
});

const HomePromotions: React.FC = () => {
  const [items, setItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get<Promotion[]>('/admin/promotions');
      setItems(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError('Failed to load promotions. Check your access or try again.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (p: Promotion) => {
    setEditingId(p.id);
    setForm({
      imageUrl: p.imageUrl,
      title: p.title,
      link: p.link || '/',
      sortOrder: p.sortOrder,
      isActive: p.isActive,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl.trim()) {
      Swal.fire('Required', 'Image URL is required.', 'warning');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/promotions/${editingId}`, form);
        Swal.fire('Saved', 'Promotion updated.', 'success');
      } else {
        await api.post('/admin/promotions', form);
        Swal.fire('Created', 'Promotion added.', 'success');
      }
      closeModal();
      await load();
    } catch {
      Swal.fire('Error', 'Could not save promotion.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const r = await Swal.fire({
      title: 'Delete this slide?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Delete',
    });
    if (!r.isConfirmed) return;
    try {
      await api.delete(`/admin/promotions/${id}`);
      Swal.fire('Deleted', '', 'success');
      await load();
    } catch {
      Swal.fire('Error', 'Could not delete.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 md:pb-0">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homepage — Exclusive offers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Images shown in the “Exclusive Offers” carousel on the public site. Managers cannot access this page.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="mt-4 sm:mt-0 inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700"
        >
          <Plus className="h-5 w-5" />
          Add slide
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-800 flex gap-2">
          <XCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 ? (
          <p className="text-gray-500 col-span-full">No promotion slides yet. Add one to show on the homepage.</p>
        ) : (
          items.map((p) => (
            <div
              key={p.id}
              className={`rounded-lg border bg-white shadow-sm overflow-hidden ${p.isActive ? '' : 'opacity-60'}`}
            >
              <div className="aspect-[5/3] bg-gray-100 relative">
                <img src={p.imageUrl} alt={p.title || 'Promotion'} className="w-full h-full object-cover" />
                {!p.isActive && (
                  <span className="absolute top-2 left-2 text-xs bg-gray-900/80 text-white px-2 py-0.5 rounded">
                    Inactive
                  </span>
                )}
              </div>
              <div className="p-3 space-y-1">
                <p className="font-medium text-gray-900 truncate">{p.title || '(No title)'}</p>
                <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                  <Link2 className="h-3 w-3 flex-shrink-0" />
                  {p.link}
                </p>
                <p className="text-xs text-gray-400">Sort: {p.sortOrder}</p>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="flex-1 inline-flex justify-center items-center gap-1 rounded border border-gray-300 py-1.5 text-sm hover:bg-gray-50"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="inline-flex justify-center items-center rounded border border-red-200 text-red-700 px-3 py-1.5 text-sm hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-emerald-600" />
                {editingId ? 'Edit slide' : 'New slide'}
              </h2>
              <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Image URL *</label>
                <input
                  type="text"
                  required
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="https://..."
                />
                <p className="mt-1 text-xs text-gray-500">Use your CDN or upload elsewhere, then paste the link.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Title (overlay)</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g. Monsoon getaway"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Link when clicked</label>
                <input
                  type="text"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="/hotels or full URL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sort order</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value, 10) || 0 })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Active (visible on homepage)
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePromotions;
