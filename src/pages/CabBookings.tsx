import React, { useState, useEffect } from 'react';
import axios, { isAxiosError } from 'axios';
import { XCircle } from 'lucide-react';
import { api } from '../lib/apiClient';

interface CabBooking {
    _id: string;
    guestName: string;
    guestPhone: string;
    tripType: string;
    pickup: string;
    drop: string;
    date: string;
    time: string;
    vehicle: string;
    amount?: number;
    selectedOption?: string;
    status: 'Pending' | 'Confirmed' | 'Cancelled';
    createdAt: string;
}

const CabBookings: React.FC = () => {
    const [bookings, setBookings] = useState<CabBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.get('/cab-bookings');
            if (response.data.success && Array.isArray(response.data.data)) {
                setBookings(response.data.data);
            } else {
                setBookings([]);
            }
        } catch (err) {
            console.error('Error fetching cab bookings:', err);
            setError(isAxiosError(err) ? err.response?.data?.message || err.message : 'Failed to fetch cab bookings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    if (loading && bookings.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600"></div>
            </div>
        );
    }

    if (error && bookings.length === 0) {
        return (
            <div className="text-center py-10">
                <div className="mx-auto h-12 w-12 text-red-400">
                    <XCircle className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading cab bookings</h3>
                <p className="mt-1 text-sm text-gray-500">{error}</p>
                <button
                    onClick={() => fetchBookings()}
                    className="mt-4 px-4 py-2 bg-navy-600 text-white rounded-md hover:bg-navy-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            <div className="bg-white shadow-sm z-10">
                <div className="px-4 py-4 sm:px-6 lg:px-8">
                    <div className="sm:flex sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Cab Bookings</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Manage all cab booking requests from customers.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-auto">
                <div className="px-4 py-6 sm:px-6 lg:px-8">
                    {loading && bookings.length > 0 && (
                        <div className="text-center py-2 mb-6">
                            <div className="inline-flex items-center text-sm text-gray-500">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-navy-600 mr-2"></div>
                                Loading...
                            </div>
                        </div>
                    )}

                    <div className="bg-white shadow rounded-lg overflow-hidden border">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested At</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trip Info</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle / Option</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {bookings.map((booking) => (
                                        <tr key={booking._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(booking.createdAt).toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{booking.guestName}</span>
                                                    <span className="text-xs text-gray-500">{booking.guestPhone}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <div className="flex flex-col">
                                                    <span className="capitalize">{booking.tripType}</span>
                                                    <span className="text-xs text-gray-500 truncate max-w-[150px]">{booking.pickup} → {booking.drop}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div className="flex flex-col">
                                                    <span>{booking.date}</span>
                                                    <span className="text-xs">{booking.time}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div className="flex flex-col">
                                                    <span>{booking.vehicle}</span>
                                                    {booking.selectedOption && (
                                                        <span className="text-xs text-gray-400">{booking.selectedOption}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {typeof booking.amount === 'number' ? `₹${booking.amount.toFixed(0)}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span
                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${booking.status === 'Confirmed'
                                                        ? 'bg-green-100 text-green-800'
                                                        : booking.status === 'Pending'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}
                                                >
                                                    {booking.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {bookings.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                                                No cab bookings found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CabBookings;
