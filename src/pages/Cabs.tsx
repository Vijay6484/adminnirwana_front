import React, { useState, useEffect } from 'react';
import axios, { isAxiosError } from 'axios';
import { Plus, Edit2, Trash2, XCircle } from 'lucide-react';
import { api } from '../lib/apiClient';

interface Cab {
    _id: string;
    name: string;
    type: string;
    driverName?: string;
    driverPhone?: string;
    driverEmail?: string;
    // Legacy per-km rate (no longer editable in UI)
    pricePerKm?: number;
    // Fixed prices for the four standard options
    mumbaiToMahabaleshwarPrice?: number;
    puneToMahabaleshwarPrice?: number;
    localSightseeingPrice?: number;
    airportTransferPrice?: number; // legacy
    airportTransferFromPunePrice?: number;
    airportTransferFromMumbaiPrice?: number;
    features: string[];
    image?: string;
    images?: string[];
    available: boolean;
}

const Cabs: React.FC = () => {
    const [cabs, setCabs] = useState<Cab[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCab, setCurrentCab] = useState<Partial<Cab> | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const fetchCabs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/cabs');
            setCabs(response.data);
        } catch (err) {
            setError(isAxiosError(err) ? err.message : 'Error fetching cabs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCabs();
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setIsUploading(true);
        const uploadedUrls: string[] = [];

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);

                const response = await axios.post('https://oraastay.com/upload_cabs_data.php', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (response.data && response.data.file_url) {
                    uploadedUrls.push(response.data.file_url);
                }
            }

            if (uploadedUrls.length > 0) {
                setCurrentCab(prev => {
                    if (!prev) return prev;
                    // Combine existing images (if any) with the newly uploaded ones
                    const existingImages = prev.images || [];
                    const allImages = [...existingImages, ...uploadedUrls];
                    return { ...prev, images: allImages, image: allImages[0] || prev.image }; // Keep 'image' synced to first image for backward compat
                });
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image(s)');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setCurrentCab(prev => {
            if (!prev || !prev.images) return prev;
            const newImages = [...prev.images];
            newImages.splice(indexToRemove, 1);
            return {
                ...prev,
                images: newImages,
                image: newImages.length > 0 ? newImages[0] : ''
            };
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const { basePrice, ...cabData } = currentCab as any;
        // Ensure features is a clean array of non-empty strings
        if (Array.isArray(cabData.features)) {
            cabData.features = cabData.features.map((f: string) => f.trim()).filter((f: string) => f.length > 0);
        }
        try {
            if (currentCab?._id) {
                await api.patch(`/cabs/${currentCab._id}`, cabData);
            } else {
                await api.post('/cabs', cabData);
            }
            setIsModalOpen(false);
            fetchCabs();
        } catch (err) {
            alert('Failed to save cab. Please try again.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this cab?')) return;
        try {
            await api.delete(`/cabs/${id}`);
            fetchCabs();
        } catch (err) {
            alert('Failed to delete cab. Please try again.');
        }
    };

    const openModal = (cab: Partial<Cab> | null = null) => {
        setCurrentCab(
            cab
                ? {
                    ...cab,
                    // Backward compatibility: if new from-specific values are missing,
                    // fall back to the legacy single airportTransferPrice.
                    airportTransferFromPunePrice: cab.airportTransferFromPunePrice ?? cab.airportTransferPrice,
                    airportTransferFromMumbaiPrice: cab.airportTransferFromMumbaiPrice ?? cab.airportTransferPrice,
                }
                : {
            name: '',
            type: 'Sedan',
            driverName: '',
            driverPhone: '',
            driverEmail: '',
            pricePerKm: undefined,
            mumbaiToMahabaleshwarPrice: undefined,
            puneToMahabaleshwarPrice: undefined,
            localSightseeingPrice: undefined,
            airportTransferPrice: undefined,
            airportTransferFromPunePrice: undefined,
            airportTransferFromMumbaiPrice: undefined,
            features: [''],
            image: '',
            images: [],
            available: true
                }
        );
        setIsModalOpen(true);
    };

    if (error && cabs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <XCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-gray-600">{error}</p>
                <button onClick={fetchCabs} className="mt-4 px-4 py-2 bg-navy-600 text-white rounded">Retry</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            <div className="bg-white shadow-sm z-10">
                <div className="px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Manage Cabs</h1>
                            <p className="mt-1 text-sm text-gray-500">View, add, update, and delete cab details.</p>
                        </div>
                        <button
                            onClick={() => openModal()}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Cab
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-auto bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cabs.map(cab => (
                            <div key={cab._id} className="bg-white border rounded-lg shadow-sm overflow-hidden flex flex-col">
                                <img src={(cab.images && cab.images.length > 0) ? cab.images[0] : (cab.image || 'https://via.placeholder.com/300x150?text=No+Image')} alt={cab.name} className="w-full h-40 object-cover" />
                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-gray-900">{cab.name}</h3>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${cab.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {cab.available ? 'Available' : 'Unavailable'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">{cab.type} Vehicle</p>
                                    {(cab.driverName || cab.driverPhone) && (
                                        <p className="text-xs text-gray-500 mb-2">
                                            {cab.driverName && <span>{cab.driverName}</span>}
                                            {cab.driverPhone && <span className="ml-1">• {cab.driverPhone}</span>}
                                        </p>
                                    )}

                                    <div className="mt-auto">
                                        <div className="bg-gray-50 p-2 rounded text-sm">
                                            <p className="text-gray-500 text-xs text-center">Fixed route prices</p>
                                            <p className="font-semibold text-center">
                                                {(() => {
                                                    const prices = [
                                                        cab.mumbaiToMahabaleshwarPrice,
                                                        cab.puneToMahabaleshwarPrice,
                                                        cab.localSightseeingPrice,
                                                        cab.airportTransferFromPunePrice ?? cab.airportTransferPrice,
                                                        cab.airportTransferFromMumbaiPrice ?? cab.airportTransferPrice,
                                                    ].filter((v): v is number => typeof v === 'number' && v > 0);
                                                    if (!prices.length) return 'Not set';
                                                    const min = Math.min(...prices);
                                                    return `From ₹${min.toFixed(0)}`;
                                                })()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex space-x-2">
                                        <button
                                            onClick={() => openModal(cab)}
                                            className="flex-1 py-1.5 border border-navy-600 text-navy-600 hover:bg-navy-50 rounded text-sm flex items-center justify-center content-center"
                                        >
                                            <Edit2 className="w-4 h-4 mr-1" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cab._id)}
                                            className="flex-1 py-1.5 border border-red-600 text-red-600 hover:bg-red-50 rounded text-sm flex items-center justify-center content-center"
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && currentCab && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">{currentCab._id ? 'Edit Cab' : 'Add New Cab'}</h3>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input type="text" required value={currentCab.name} onChange={e => setCurrentCab({ ...currentCab, name: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-navy-500 focus:ring-navy-500 sm:text-sm p-2 border" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select required value={currentCab.type} onChange={e => setCurrentCab({ ...currentCab, type: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-navy-500 focus:ring-navy-500 sm:text-sm p-2 border">
                                    <option value="Sedan">Sedan</option>
                                    <option value="SUV">SUV</option>
                                    <option value="Hatchback">Hatchback</option>
                                    <option value="Luxury">Luxury</option>
                                </select>
                            </div>
                            {/* Pricing options for four standard routes */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">Fixed Prices (₹)</label>
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <span className="block text-xs text-gray-600 mb-1">Mumbai to Mahabaleshwar</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={currentCab.mumbaiToMahabaleshwarPrice ?? ''}
                                            onChange={e => setCurrentCab({
                                                ...currentCab,
                                                mumbaiToMahabaleshwarPrice: e.target.value === '' ? undefined : Number(e.target.value)
                                            })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                            placeholder="e.g. 4500"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-600 mb-1">Pune to Mahabaleshwar</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={currentCab.puneToMahabaleshwarPrice ?? ''}
                                            onChange={e => setCurrentCab({
                                                ...currentCab,
                                                puneToMahabaleshwarPrice: e.target.value === '' ? undefined : Number(e.target.value)
                                            })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                            placeholder="e.g. 2200"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-600 mb-1">Local Sightseeing</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={currentCab.localSightseeingPrice ?? ''}
                                            onChange={e => setCurrentCab({
                                                ...currentCab,
                                                localSightseeingPrice: e.target.value === '' ? undefined : Number(e.target.value)
                                            })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                            placeholder="e.g. 1800"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-600 mb-1">Airport Transfer (From Pune)</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={currentCab.airportTransferFromPunePrice ?? ''}
                                            onChange={e => setCurrentCab({
                                                ...currentCab,
                                                airportTransferFromPunePrice: e.target.value === '' ? undefined : Number(e.target.value)
                                            })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                            placeholder="e.g. 3000"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-600 mb-1">Airport Transfer (From Mumbai)</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={currentCab.airportTransferFromMumbaiPrice ?? ''}
                                            onChange={e => setCurrentCab({
                                                ...currentCab,
                                                airportTransferFromMumbaiPrice: e.target.value === '' ? undefined : Number(e.target.value)
                                            })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                            placeholder="e.g. 4500"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4 border-t pt-4">
                                <h4 className="text-sm font-medium text-gray-700">Driver Details</h4>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Driver Name</label>
                                    <input type="text" value={currentCab.driverName || ''} onChange={e => setCurrentCab({ ...currentCab, driverName: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-navy-500 focus:ring-navy-500 sm:text-sm p-2 border" placeholder="Driver full name" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Driver Phone</label>
                                    <input type="tel" value={currentCab.driverPhone || ''} onChange={e => setCurrentCab({ ...currentCab, driverPhone: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-navy-500 focus:ring-navy-500 sm:text-sm p-2 border" placeholder="10-digit phone number" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Driver Email</label>
                                    <input type="email" value={currentCab.driverEmail || ''} onChange={e => setCurrentCab({ ...currentCab, driverEmail: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-navy-500 focus:ring-navy-500 sm:text-sm p-2 border" placeholder="driver@example.com" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Features</label>
                                <p className="mt-1 text-xs text-gray-500">Add each feature separately.</p>
                                <div className="mt-2 space-y-2">
                                    {(currentCab.features || ['']).map((feature, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={feature}
                                                onChange={e => {
                                                    const next = [...(currentCab.features || [])];
                                                    next[index] = e.target.value;
                                                    setCurrentCab({ ...currentCab, features: next });
                                                }}
                                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-navy-500 focus:ring-navy-500 sm:text-sm p-2 border"
                                                placeholder="e.g. AC"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const next = [...(currentCab.features || [])];
                                                    next.splice(index, 1);
                                                    setCurrentCab({ ...currentCab, features: next.length ? next : [''] });
                                                }}
                                                className="px-2 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentCab({
                                                ...currentCab,
                                                features: [...(currentCab.features || []), '']
                                            })
                                        }
                                        className="mt-1 inline-flex items-center px-2 py-1 text-xs font-medium text-navy-700 bg-navy-50 hover:bg-navy-100 rounded border border-navy-100"
                                    >
                                        + Add Feature
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cab Images</label>
                                <div className="mt-1 flex flex-col space-y-4">
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageUpload}
                                            disabled={isUploading}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-navy-50 file:text-navy-700 hover:file:bg-navy-100 border border-gray-300 p-2 rounded-md"
                                        />
                                        {isUploading && <p className="text-xs text-navy-600 mt-1">Uploading image(s)...</p>}
                                    </div>
                                    {currentCab.images && currentCab.images.length > 0 ? (
                                        <div className="flex gap-2 flex-wrap">
                                            {currentCab.images.map((imgUrl, idx) => (
                                                <div key={idx} className="relative group">
                                                    <img src={imgUrl} alt={`Preview ${idx + 1}`} className="h-16 w-24 object-cover rounded border" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(idx)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 opacity-100 transition-opacity"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : currentCab.image ? (
                                        <div className="flex gap-2 flex-wrap">
                                            <div className="relative group">
                                                <img src={currentCab.image} alt="Preview" className="h-16 w-24 object-cover rounded border" />
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentCab({ ...currentCab, image: '' })}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 opacity-100 transition-opacity"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" id="available" checked={currentCab.available} onChange={e => setCurrentCab({ ...currentCab, available: e.target.checked })} className="h-4 w-4 text-navy-600 border-gray-300 rounded" />
                                <label htmlFor="available" className="ml-2 block text-sm text-gray-900">Available for booking</label>
                            </div>

                            <div className="pt-4 border-t flex justify-end space-x-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">Save Cab</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cabs;
