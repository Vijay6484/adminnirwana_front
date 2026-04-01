import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, XCircle, Image as ImageIcon, X } from 'lucide-react';
import { api } from '../lib/apiClient';

interface Package {
    _id: string;
    title: string;
    duration: string;
    numDays: number;
    price: string;
    numericPrice?: number;
    perPerson?: string;
    description?: string;
    features?: string[];
    highlights?: string[];
    tag?: string;
    images?: string[];
    image?: string;
    category: string;
    subcategory?: string;
    isActive: boolean;
    extraServices?: { title: string; price: number }[];
    foodOptions?: { title: string; price: number }[];
}

const CATEGORIES = ['Couple', 'Family', 'Group', 'Adventure'];

const emptyPackage = (): Partial<Package> => ({
    title: '',
    duration: '',
    numDays: 1,
    price: '',
    numericPrice: 0,
    perPerson: 'per person',
    description: '',
    features: [],
    highlights: [],
    tag: '',
    images: [],
    image: '',
    category: 'Couple',
    subcategory: '',
    isActive: true,
    extraServices: [],
    foodOptions: [],
});

const AdminPackages: React.FC = () => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPkg, setCurrentPkg] = useState<Partial<Package> | null>(null);
    const [featuresInput, setFeaturesInput] = useState('');
    const [highlightsInput, setHighlightsInput] = useState('');
    const [imagesInput, setImagesInput] = useState('');
    const [extraServices, setExtraServices] = useState<{ title: string; price: number }[]>([]);
    const [foodOptions, setFoodOptions] = useState<{ title: string; price: number }[]>([]);
    const [saving, setSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const fetchPackages = async () => {
        try {
            setLoading(true);
            const res = await api.get('/packages/admin/all');
            setPackages(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            setError('Failed to load packages.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPackages(); }, []);

    const openModal = (pkg: Partial<Package> | null = null) => {
        const data = pkg ? { ...pkg } : emptyPackage();
        setCurrentPkg(data);
        setFeaturesInput(data.features?.join('\n') || '');
        setHighlightsInput(data.highlights?.join('\n') || '');
        setImagesInput(data.images?.join('\n') || (data.image ? data.image : ''));
        setExtraServices(data.extraServices ? [...data.extraServices] : []);
        setFoodOptions(data.foodOptions ? [...data.foodOptions] : []);
        setIsModalOpen(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setIsUploading(true);
        const uploadedUrls: string[] = [];

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                const response = await axios.post('https://oraastay.com/upload_packages.php', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (response.data && response.data.file_url) {
                    uploadedUrls.push(response.data.file_url);
                }
            }

            if (uploadedUrls.length > 0) {
                const newUrlsStr = uploadedUrls.join('\n');
                setImagesInput(prev => prev ? prev + '\n' + newUrlsStr : newUrlsStr);
            }
        } catch (error) {
            console.error('Error uploading images:', error);
            alert('Failed to upload image(s)');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPkg) return;
        setSaving(true);
        try {
            const imgs = imagesInput.split('\n').map(s => s.trim()).filter(Boolean);
            const payload = {
                ...currentPkg,
                features: featuresInput.split('\n').map(s => s.trim()).filter(Boolean),
                highlights: highlightsInput.split('\n').map(s => s.trim()).filter(Boolean),
                images: imgs,
                image: imgs[0] || '',
                extraServices: extraServices.filter(es => es.title.trim() !== '' && es.price >= 0),
                foodOptions: foodOptions.filter(fo => fo.title.trim() !== '' && fo.price >= 0),
            };
            if (currentPkg._id) {
                await api.patch(`/packages/${currentPkg._id}`, payload);
            } else {
                await api.post('/packages', payload);
            }
            setIsModalOpen(false);
            fetchPackages();
        } catch (err) {
            alert('Failed to save package.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this package?')) return;
        try {
            await api.delete(`/packages/${id}`);
            fetchPackages();
        } catch {
            alert('Failed to delete package.');
        }
    };

    const handleToggleActive = async (pkg: Package) => {
        try {
            await api.patch(`/packages/${pkg._id}`, { isActive: !pkg.isActive });
            fetchPackages();
        } catch {
            alert('Failed to update status.');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
            <XCircle className="w-12 h-12 text-red-500" />
            <p className="text-gray-600">{error}</p>
            <button onClick={fetchPackages} className="px-4 py-2 bg-green-600 text-white rounded-md">Retry</button>
        </div>
    );

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Manage Packages</h1>
                        <p className="mt-1 text-sm text-gray-500">Create, update, and delete tour packages.</p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add Package
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
                {packages.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No packages yet. Add your first package.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {packages.map(pkg => {
                            const thumb = (pkg.images && pkg.images[0]) || pkg.image || '';
                            return (
                                <div key={pkg._id} className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
                                    <div className="relative h-44">
                                        <img
                                            src={thumb || 'https://via.placeholder.com/400x200?text=No+Image'}
                                            alt={pkg.title}
                                            className="w-full h-full object-cover"
                                        />
                                        {pkg.tag && (
                                            <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                                                {pkg.tag}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleToggleActive(pkg)}
                                            className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded font-semibold ${pkg.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                        >
                                            {pkg.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </div>
                                    <div className="p-4 flex flex-col flex-1">
                                        <div className="text-xs text-gray-400 mb-1">{pkg.duration} · {pkg.subcategory || pkg.category}</div>
                                        <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-1">{pkg.title}</h3>
                                        {pkg.description && (
                                            <p className="text-sm text-gray-500 line-clamp-2 mb-2">{pkg.description}</p>
                                        )}
                                        <div className="mt-auto flex items-center justify-between pt-3 border-t">
                                            <div>
                                                <span className="text-lg font-bold text-green-700">{pkg.price}</span>
                                                {pkg.perPerson && <span className="text-xs text-gray-400 ml-1">{pkg.perPerson}</span>}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openModal(pkg)}
                                                    className="flex items-center gap-1 text-sm border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(pkg._id)}
                                                    className="flex items-center gap-1 text-sm border border-red-300 text-red-600 px-3 py-1.5 rounded hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && currentPkg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h2 className="text-lg font-bold text-gray-900">
                                {currentPkg._id ? 'Edit Package' : 'Add New Package'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Title */}
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                    <input
                                        type="text" required
                                        value={currentPkg.title || ''}
                                        onChange={e => setCurrentPkg({ ...currentPkg, title: e.target.value })}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                                        placeholder="e.g. Mahabaleshwar Honeymoon Special"
                                    />
                                </div>

                                {/* Duration Text (display only) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration text *</label>
                                    <input
                                        type="text" required
                                        value={currentPkg.duration || ''}
                                        onChange={e => setCurrentPkg({ ...currentPkg, duration: e.target.value })}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                                        placeholder="e.g. 3 Days / 2 Nights"
                                    />
                                </div>

                                {/* Price */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (display) *</label>
                                    <input
                                        type="text" required
                                        value={currentPkg.price || ''}
                                        onChange={e => setCurrentPkg({ ...currentPkg, price: e.target.value })}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                                        placeholder="e.g. ₹12,999"
                                    />
                                </div>

                                {/* Numeric Price */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Numeric Price (for sorting)</label>
                                    <input
                                        type="number" min={0}
                                        value={currentPkg.numericPrice || 0}
                                        onChange={e => setCurrentPkg({ ...currentPkg, numericPrice: Number(e.target.value) })}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                                    />
                                </div>

                                {/* Per Person */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Per Person Text</label>
                                    <input
                                        type="text"
                                        value={currentPkg.perPerson || ''}
                                        onChange={e => setCurrentPkg({ ...currentPkg, perPerson: e.target.value })}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                                        placeholder="e.g. per couple"
                                    />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        value={currentPkg.category || 'Couple'}
                                        onChange={e => setCurrentPkg({ ...currentPkg, category: e.target.value })}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                                    >
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>

                                {/* Subcategory */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                                    <select
                                        value={currentPkg.subcategory || ''}
                                        onChange={e => setCurrentPkg({ ...currentPkg, subcategory: e.target.value })}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                                    >
                                        <option value="">Select Subcategory</option>
                                        <option value="Honeymoon Packages">Honeymoon Packages</option>
                                        <option value="Family Tour Packages">Family Tour Packages</option>
                                        <option value="Weekend Packages">Weekend Packages</option>
                                        <option value="Group & Special Packages">Group & Special Packages</option>
                                        <option value="Tour Package from Mumbai">Tour Package from Mumbai</option>
                                        <option value="Tour Package from Pune">Tour Package from Pune</option>
                                    </select>
                                </div>

                                {/* Tag */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tag (optional)</label>
                                    <input
                                        type="text"
                                        value={currentPkg.tag || ''}
                                        onChange={e => setCurrentPkg({ ...currentPkg, tag: e.target.value })}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                                        placeholder="e.g. Bestseller"
                                    />
                                </div>

                                {/* Description */}
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        rows={3}
                                        value={currentPkg.description || ''}
                                        onChange={e => setCurrentPkg({ ...currentPkg, description: e.target.value })}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none resize-none"
                                        placeholder="Describe the package experience..."
                                    />
                                </div>

                                {/* Images */}
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Package Images (Upload multiple or paste URLs)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageUpload}
                                        disabled={isUploading}
                                        className="mb-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 border border-gray-300 p-2 rounded-md transition-all"
                                    />
                                    {isUploading && <p className="text-xs text-green-600 mb-2">Uploading images smoothly to array...</p>}

                                    {imagesInput.split('\n').filter(Boolean).length > 0 && (
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                            {imagesInput.split('\n').map(s => s.trim()).filter(Boolean).map((url, i) => (
                                                <div key={i} className="relative group">
                                                    <img src={url} alt="" className="h-16 w-24 object-cover rounded border" onError={e => (e.currentTarget.style.display = 'none')} />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const urls = imagesInput.split('\n').map(s => s.trim()).filter(Boolean);
                                                            urls.splice(i, 1);
                                                            setImagesInput(urls.join('\n'));
                                                        }}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-100 shadow-sm hover:bg-red-600"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Features */}
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        What's Included / Features <span className="text-gray-400 font-normal">(one per line)</span>
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={featuresInput}
                                        onChange={e => setFeaturesInput(e.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none resize-none"
                                        placeholder={"Breakfast included\nSightseeing\nHotel accommodation"}
                                    />
                                </div>

                                {/* Highlights */}
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Highlights <span className="text-gray-400 font-normal">(one per line)</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={highlightsInput}
                                        onChange={e => setHighlightsInput(e.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none resize-none"
                                        placeholder={"Visit Venna Lake\nStrawberry farm tour"}
                                    />
                                </div>

                                {/* Extra Services */}
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Extra Services (Optional)
                                    </label>
                                    <div className="space-y-2">
                                        {extraServices.map((es, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    placeholder="Service Title (e.g., Honeymoon Setup)"
                                                    value={es.title}
                                                    onChange={e => {
                                                        const newEs = [...extraServices];
                                                        newEs[idx].title = e.target.value;
                                                        setExtraServices(newEs);
                                                    }}
                                                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Price"
                                                    value={es.price}
                                                    onChange={e => {
                                                        const newEs = [...extraServices];
                                                        newEs[idx].price = Number(e.target.value);
                                                        setExtraServices(newEs);
                                                    }}
                                                    className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setExtraServices(extraServices.filter((_, i) => i !== idx))}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setExtraServices([...extraServices, { title: '', price: 0 }])}
                                        className="mt-2 text-sm text-green-600 hover:text-green-700 flex items-center gap-1 font-medium"
                                    >
                                        <Plus className="w-4 h-4" /> Add Extra Service
                                    </button>
                                </div>

                                {/* Food Options */}
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Food Options (Per Person / Per Day)
                                    </label>
                                    <div className="space-y-2">
                                        {foodOptions.map((fo, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    placeholder="Food Title (e.g., Breakfast & Dinner)"
                                                    value={fo.title}
                                                    onChange={e => {
                                                        const newFo = [...foodOptions];
                                                        newFo[idx].title = e.target.value;
                                                        setFoodOptions(newFo);
                                                    }}
                                                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Price"
                                                    value={fo.price}
                                                    onChange={e => {
                                                        const newFo = [...foodOptions];
                                                        newFo[idx].price = Number(e.target.value);
                                                        setFoodOptions(newFo);
                                                    }}
                                                    className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setFoodOptions(foodOptions.filter((_, i) => i !== idx))}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFoodOptions([...foodOptions, { title: '', price: 0 }])}
                                        className="mt-2 text-sm text-green-600 hover:text-green-700 flex items-center gap-1 font-medium"
                                    >
                                        <Plus className="w-4 h-4" /> Add Food Option
                                    </button>
                                </div>

                                {/* Active */}
                                <div className="sm:col-span-2 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={currentPkg.isActive !== false}
                                        onChange={e => setCurrentPkg({ ...currentPkg, isActive: e.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300 text-green-600"
                                    />
                                    <label htmlFor="isActive" className="text-sm text-gray-700">Active (visible on website)</label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 text-sm rounded-md text-gray-700 hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md shadow disabled:opacity-50">
                                    {saving ? 'Saving...' : (currentPkg._id ? 'Update Package' : 'Create Package')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPackages;
