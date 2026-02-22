import React from 'react';
import { Booking, Invoice } from '../../types';
import { bookingService } from '../../services/bookingService';
import {
    ArrowPathIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';

interface BookingListProps {
    bookings: Booking[];
    invoices: Invoice[];
    isSyncing: boolean;
    onManualSync: () => void;
    onViewInvoice: (invoice: Invoice) => void;
}

export const BookingList: React.FC<BookingListProps> = ({
    bookings,
    invoices,
    isSyncing,
    onManualSync,
    onViewInvoice
}) => {
    if (bookings.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-100">
                <p className="text-gray-900 font-bold text-lg mb-2">No active bookings found</p>
                <button
                    onClick={onManualSync}
                    disabled={isSyncing}
                    className="inline-flex items-center px-4 py-2 text-white bg-sey-blue rounded-md shadow-sm"
                >
                    <ArrowPathIcon className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Searching...' : 'Locate Missing Bookings'}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {bookings.map((booking) => {
                const invoice = invoices?.find(inv => inv.bookingId === booking.id);
                return (
                    <div key={booking.id} className="bg-white shadow-sm rounded-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center border border-gray-100">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-bold text-sey-blue">{booking.serviceType}</h3>
                                <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                    {bookingService.formatBookingRef(booking.id)}
                                </span>
                            </div>
                            <p className="text-gray-900 font-medium">
                                {new Date(booking.pickupTime).toLocaleDateString()} at {new Date(booking.pickupTime).toLocaleTimeString()}
                            </p>
                            <p className="text-gray-600 mt-1 flex items-center text-sm">
                                <span className="font-semibold mr-1">Route:</span> {booking.pickupLocation} <span className="mx-2 text-sey-red">&rarr;</span> {booking.dropoffLocation}
                            </p>
                        </div>

                        <div className="mt-4 md:mt-0 flex flex-col items-end gap-3 min-w-[140px]">
                            <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">SCR {booking.amount.toLocaleString()}</div>
                                <div className="flex justify-end mt-1">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border 
                                        ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800 border-green-200' :
                                            booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                                'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                        {booking.status}
                                    </span>
                                </div>
                            </div>

                            {invoice && (
                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 w-full justify-end">
                                    <span className={`flex items-center text-xs font-bold px-2 py-1 rounded ${invoice.paid ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                        {invoice.paid ? <CheckCircleIcon className="w-3 h-3 mr-1" /> : <ExclamationCircleIcon className="w-3 h-3 mr-1" />}
                                        {invoice.paid ? 'Paid' : 'Unpaid'}
                                    </span>
                                    <button
                                        onClick={() => onViewInvoice(invoice)}
                                        className="flex items-center text-xs font-medium text-sey-blue hover:underline bg-blue-50 px-2 py-1 rounded border border-blue-100"
                                    >
                                        <DocumentTextIcon className="w-3 h-3 mr-1" />
                                        View {invoice.paid ? 'Receipt' : 'Invoice'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
