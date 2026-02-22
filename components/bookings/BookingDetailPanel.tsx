import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    PencilSquareIcon, XMarkIcon, CalendarIcon, MapPinIcon,
    UserIcon, CurrencyDollarIcon, EnvelopeIcon, TruckIcon,
    TrashIcon, CheckCircleIcon, ChevronDownIcon, PhoneIcon
} from '@heroicons/react/24/outline';
import { Booking, BookingStatus, ServiceType, CurrencyCode } from '../../types';
import { bookingService } from '../../services/bookingService';
import { formatDate, formatDateTime, formatCurrency } from '../../lib/utils';

interface BookingDetailPanelProps {
    booking: Booking;
    onClose: () => void;
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: BookingStatus) => void;
    onInitiateConfirmation: (booking: Booking) => void;
    onGenerateInvoice: (booking: Booking) => void;
    onSaveEdit: (id: string, data: Partial<Booking>) => void;
    onViewInvoice?: (invoice: any) => void;
    invoice?: any;
}

const RenderStatusBadge = ({ status }: { status: BookingStatus }) => {
    const styles = {
        [BookingStatus.CONFIRMED]: 'bg-green-100 text-green-800 border-green-200',
        [BookingStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        [BookingStatus.CANCELLED]: 'bg-red-100 text-red-800 border-red-200',
        [BookingStatus.COMPLETED]: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return (
        <span className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full border ${styles[status]}`}>
            {status}
        </span>
    );
};

export const BookingDetailPanel: React.FC<BookingDetailPanelProps> = ({
    booking,
    onClose,
    onDelete,
    onStatusChange,
    onInitiateConfirmation,
    onGenerateInvoice,
    onSaveEdit,
    onViewInvoice,
    invoice
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const { register, handleSubmit } = useForm<Partial<Booking>>({ defaultValues: booking });

    const onSubmit = (data: Partial<Booking>) => {
        onSaveEdit(booking.id, data);
        setIsEditing(false);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="absolute inset-y-0 right-0 max-w-2xl w-full bg-white shadow-2xl transform transition-transform flex flex-col h-full animate-in slide-in-from-right-10">

                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {isEditing ? 'Edit Booking' : 'Booking Details'}
                            </h2>
                            {!isEditing && <RenderStatusBadge status={booking.status} />}
                        </div>
                        <p className="text-sm text-gray-500 font-mono">Reference: <span className="font-bold text-sey-blue">{bookingService.formatBookingRef(booking.id)}</span></p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {!isEditing && (
                            <>
                                <button
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this booking?')) {
                                            onDelete(booking.id);
                                        }
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                                    title="Delete Booking"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => setIsEditing(true)} className="p-2 text-gray-400 hover:text-sey-blue hover:bg-blue-50 rounded-full transition" title="Edit Booking"><PencilSquareIcon className="w-5 h-5" /></button>
                            </>
                        )}
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"><XMarkIcon className="w-6 h-6" /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-6">
                    {isEditing ? (
                        <form id="edit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Client Name</label>
                                    <input {...register("clientName")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input {...register("email")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                                    <input {...register("phone")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Currency</label>
                                        <select {...register("currency")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white">
                                            <option value="SCR">SCR</option>
                                            <option value="EUR">EUR</option>
                                            <option value="USD">USD</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Amount</label>
                                        <input {...register("amount", { valueAsNumber: true })} type="number" step="0.01" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Pax</label>
                                    <input {...register("pax", { valueAsNumber: true })} type="number" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Service Type</label>
                                    <select {...register("serviceType")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white">
                                        <option value={ServiceType.TRANSFER}>Transfer</option>
                                        <option value={ServiceType.TOUR}>Tour</option>
                                        <option value={ServiceType.CHARTER}>Charter</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Pickup Location</label>
                                    <input {...register("pickupLocation")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Dropoff Location</label>
                                    <input {...register("dropoffLocation")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                                    <textarea {...register("notes")} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-8">
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Current Status</p>
                                    <div className="flex items-center gap-2">
                                        <RenderStatusBadge status={booking.status} />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    {booking.status === BookingStatus.PENDING && (
                                        <button
                                            onClick={() => onInitiateConfirmation(booking)}
                                            className="flex-1 sm:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg shadow-sm transition flex items-center justify-center"
                                        >
                                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                                            Confirm Booking
                                        </button>
                                    )}

                                    <div className="relative flex-1 sm:flex-none min-w-[160px]">
                                        <select
                                            value={booking.status}
                                            onChange={(e) => {
                                                const newStatus = e.target.value as BookingStatus;
                                                if (newStatus === BookingStatus.CONFIRMED) {
                                                    onInitiateConfirmation(booking);
                                                } else if (newStatus !== booking.status) {
                                                    if (window.confirm(`Are you sure you want to change status to ${newStatus}?`)) {
                                                        onStatusChange(booking.id, newStatus);
                                                    }
                                                }
                                            }}
                                            className="w-full appearance-none pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none cursor-pointer shadow-sm"
                                        >
                                            {Object.values(BookingStatus).map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                            <ChevronDownIcon className="h-4 w-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 flex items-center">
                                    <UserIcon className="w-4 h-4 mr-2 text-sey-blue" /> Client Information
                                </h3>
                                <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase">Full Name</p>
                                        <p className="font-semibold text-gray-900 text-lg">{booking.clientName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase">Contact Info</p>
                                        <a href={`mailto:${booking.email}`} className="font-medium text-sey-blue hover:underline flex items-center mb-1">
                                            <EnvelopeIcon className="w-3 h-3 mr-1" /> {booking.email}
                                        </a>
                                        {booking.phone && (
                                            <a href={`tel:${booking.phone}`} className="font-medium text-gray-700 hover:underline flex items-center">
                                                <PhoneIcon className="w-3 h-3 mr-1" /> {booking.phone}
                                            </a>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase">Passengers</p>
                                        <p className="font-medium text-gray-900">{booking.pax} Pax</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-xs text-gray-500 font-bold uppercase">Special Notes</p>
                                        <div className="bg-white p-3 rounded border border-blue-100 mt-1 text-sm text-gray-600 italic">
                                            {booking.notes || "No additional notes provided."}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 flex items-center">
                                    <MapPinIcon className="w-4 h-4 mr-2 text-sey-blue" /> Journey Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="flex items-start">
                                            <div className="mt-1 bg-white p-2 rounded-full shadow-sm mr-3 text-sey-blue">
                                                <CalendarIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-bold uppercase">Date & Time</p>
                                                <p className="font-bold text-gray-900">{formatDate(booking.pickupTime)}</p>
                                                <p className="text-sm text-gray-600">{formatDateTime(booking.pickupTime).split(' ')[1]}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="flex items-start">
                                            <div className="mt-1 bg-white p-2 rounded-full shadow-sm mr-3 text-sey-green">
                                                <CurrencyDollarIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-bold uppercase">Price ({booking.currency})</p>
                                                <p className="font-bold text-gray-900">{formatCurrency(booking.amount, booking.currency)}</p>
                                                <p className="text-xs text-gray-500">{booking.serviceType}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-1 md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="flex items-center justify-between relative">
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Pickup</p>
                                                <p className="font-semibold text-gray-900">{booking.pickupLocation}</p>
                                            </div>
                                            <div className="px-4 text-gray-400">
                                                <TruckIcon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 text-right">
                                                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Dropoff</p>
                                                <p className="font-semibold text-gray-900">{booking.dropoffLocation}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>

                <div className="px-8 py-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                    {isEditing ? (
                        <>
                            <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-white transition">Cancel</button>
                            <button type="submit" form="edit-form" className="px-5 py-2.5 rounded-lg bg-sey-blue text-white font-bold hover:bg-blue-800 shadow-md transition">Save Changes</button>
                        </>
                    ) : (
                        <>
                            {!invoice && (
                                <button onClick={() => onGenerateInvoice(booking)} className="flex items-center px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 hover:text-sey-blue transition">
                                    <CurrencyDollarIcon className="w-5 h-5 mr-2 text-gray-500" /> Generate Invoice
                                </button>
                            )}
                            {invoice && (
                                <button
                                    onClick={() => onViewInvoice?.(invoice)}
                                    className="flex items-center px-4 py-2.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-bold hover:bg-green-100 transition"
                                >
                                    <CheckCircleIcon className="w-4 h-4 mr-2" /> Invoice Generated
                                </button>
                            )}
                            <button onClick={onClose} className="px-6 py-2.5 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition">Close</button>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};