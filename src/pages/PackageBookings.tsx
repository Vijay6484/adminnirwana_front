import React, { useState, useEffect } from 'react';
import axios, { isAxiosError } from 'axios';
import { XCircle } from 'lucide-react';
import { api } from '../lib/apiClient';

interface GuestDetail {
    name: string;
    email?: string;
    phone?: string;
}

interface PackageBooking {
    _id: string;
    packageId: string;
    packageTitle: string;
    checkInDate: string;
    adults: number;
    children: number;
    totalGuests: number;
    primaryGuestName: string;
    primaryGuestEmail: string;
    primaryGuestPhone: string;
    guests: GuestDetail[];
    status: 'Pending' | 'Confirmed' | 'Cancelled';
    notes?: string;
    createdAt: string;
}

const PackageBookings: React.FC = () => {
    const [bookings, setBookings] = useState<PackageBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get('/package-bookings');
            if (res.data.success && Array.isArray(res.data.data)) {
                setBookings(res.data.data);
            } else {
                setBookings([]);
            }
        } catch (err) {
            setError(isAxiosError(err) ? err.response?.data?.message || err.message : 'Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBookings(); }, []);

    if (loading && bookings.length === 0) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
        </div>
    );

    if (error && bookings.length === 0) return (
        <div className="text-center py-10">
            <XCircle className="h-12 w-12 text-red-400 mx-auto" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading package bookings</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button onClick={fetchBookings} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md">Try Again</button>
        </div>
    );

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="px-4 py-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-bold text-gray-900">Package Bookings</h1>
                    <p className="mt-1 text-sm text-gray-500">View and manage all package booking requests.</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-auto px-4 py-6 sm:px-6 lg:px-8">
                <div className="bg-white shadow rounded-lg overflow-hidden border">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booked At</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guests</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {bookings.map(booking => (
                                    <React.Fragment key={booking._id}>
                                        <tr
                                            className="hover:bg-gray-50 cursor-pointer"
                                            onClick={() => setExpanded(expanded === booking._id ? null : booking._id)}
                                        >
                                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                {new Date(booking.createdAt).toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-[180px]">
                                                <div className="truncate">{booking.packageTitle}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <div className="font-medium">{booking.primaryGuestName}</div>
                                                <div className="text-xs text-gray-500">{booking.primaryGuestPhone}</div>
                                                <div className="text-xs text-gray-400">{booking.primaryGuestEmail}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                                                {new Date(booking.checkInDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div className="text-xs">
                                                    <span className="font-medium">{booking.adults}</span> Adults
                                                    {booking.children > 0 && <>, <span className="font-medium">{booking.children}</span> Children</>}
                                                </div>
                                                <div className="text-xs text-gray-400">Total: {booking.totalGuests || (booking.adults + booking.children)}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${booking.status === 'Confirmed' ? 'bg-green-100 text-green-800'
                                                        : booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                        </tr>
                                        {/* Expanded row — show all guest details */}
                                        {expanded === booking._id && (
                                            <tr className="bg-blue-50">
                                                <td colSpan={6} className="px-6 py-4">
                                                    <div className="text-sm text-gray-700 space-y-3">
                                                        <p className="font-semibold text-gray-900">Additional Guest Details</p>
                                                        {booking.guests && booking.guests.length > 0 ? (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                                {booking.guests.map((g, i) => (
                                                                    <div key={i} className="bg-white rounded-lg p-3 border">
                                                                        <p className="font-medium text-gray-800">{g.name || '—'}</p>
                                                                        {g.email && <p className="text-xs text-gray-500">{g.email}</p>}
                                                                        {g.phone && <p className="text-xs text-gray-500">{g.phone}</p>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-gray-400 italic text-xs">No additional guests provided.</p>
                                                        )}
                                                        {booking.notes && (
                                                            <p className="text-xs text-gray-500"><span className="font-medium">Notes:</span> {booking.notes}</p>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                                {bookings.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                                            No package bookings found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PackageBookings;
