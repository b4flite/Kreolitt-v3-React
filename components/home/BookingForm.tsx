import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookingService, bookingSchema } from '../../services/bookingService';
import { BookingInput, ServiceType, User } from '../../types';
import { toast } from 'react-hot-toast';
import { CheckBadgeIcon } from '@heroicons/react/24/outline';

interface BookingFormProps {
    user: User | null;
    businessName: string;
    externalValues?: Partial<BookingInput>;
    onResetExternal?: () => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({ user, businessName, externalValues, onResetExternal }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
    const [lastBookingRef, setLastBookingRef] = useState<string>('');

    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<any>({
        resolver: zodResolver(bookingSchema) as any,
        defaultValues: {
            pax: 2,
            serviceType: ServiceType.TRANSFER
        }
    });

    useEffect(() => {
        if (user) {
            setValue('clientName', user.name);
            setValue('email', user.email);
            if (user.phone) setValue('phone', user.phone);
        }
    }, [user, setValue]);

    useEffect(() => {
        if (externalValues) {
            Object.entries(externalValues).forEach(([key, value]) => {
                setValue(key as any, value);
            });
        }
    }, [externalValues, setValue]);

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            const creatorName = user ? 'Client Portal' : 'Website Guest';
            const newBooking = await bookingService.createBooking(data, user?.id, creatorName);
            const ref = bookingService.formatBookingRef(newBooking.id);
            setLastBookingRef(ref);
            setBookingSuccess(true);
        } catch (error: any) {
            toast.error(error.message || "Failed to submit booking.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetBooking = () => {
        setBookingSuccess(false);
        setLastBookingRef('');
        reset();
        if (user) {
            setValue('clientName', user.name);
            setValue('email', user.email);
        }
        document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section id="booking-form" className="py-20 bg-sey-blue relative">
            <div className="container mx-auto px-4 relative z-10">
                <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-4xl mx-auto transition-all">
                    {bookingSuccess ? (
                        <div className="text-center py-12">
                            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
                                <CheckBadgeIcon className="h-16 w-16 text-green-600" />
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Booking Confirmed!</h2>
                            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">Thank you for choosing {businessName}.</p>
                            <div className="inline-block bg-gray-50 border border-gray-200 rounded-lg px-8 py-4 mb-10">
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Booking Reference</p>
                                <p className="text-3xl font-mono font-bold text-sey-blue tracking-wider">{lastBookingRef}</p>
                            </div>
                            <div>
                                <button onClick={handleResetBooking} className="bg-sey-blue hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all transform hover:scale-105">Make Another Booking</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-bold text-gray-800">Ready to Book?</h2>
                                <p className="text-gray-600 mt-2">Secure your transfer or tour instantly.</p>
                            </div>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <input {...register("clientName")} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg" placeholder="John Doe" />
                                        {errors.clientName && <span className="text-sey-red text-xs mt-1">{errors.clientName.message}</span>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <input {...register("email")} type="email" className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg" placeholder="john@example.com" />
                                        {errors.email && <span className="text-sey-red text-xs mt-1">{errors.email.message}</span>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                        <input {...register("phone")} type="tel" className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg" placeholder="+248 ..." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                                        <select {...register("serviceType")} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg">
                                            <option value={ServiceType.TRANSFER}>Airport Transfer</option>
                                            <option value={ServiceType.TOUR}>Island Tour</option>
                                            <option value={ServiceType.CHARTER}>Private Charter</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
                                        <input {...register("pax", { valueAsNumber: true })} type="number" min="1" className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg" />
                                        {errors.pax && <span className="text-sey-red text-xs mt-1">{errors.pax.message}</span>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date & Time</label>
                                        <input {...register("pickupTime")} type="datetime-local" className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg" />
                                        {errors.pickupTime && <span className="text-sey-red text-xs mt-1">{errors.pickupTime.message}</span>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                                        <input {...register("pickupLocation")} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg" placeholder="Airport / Hotel" />
                                        {errors.pickupLocation && <span className="text-sey-red text-xs mt-1">{errors.pickupLocation.message}</span>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Dropoff Location</label>
                                        <input {...register("dropoffLocation")} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg" placeholder="Hotel / Airport" />
                                        {errors.dropoffLocation && <span className="text-sey-red text-xs mt-1">{errors.dropoffLocation.message}</span>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                                        <textarea {...register("notes")} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg" rows={3} placeholder="Requests..." />
                                    </div>
                                </div>
                                <button disabled={isSubmitting} type="submit" className="w-full bg-sey-red hover:bg-red-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg">
                                    {isSubmitting ? 'Processing...' : 'Confirm Booking'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
};
