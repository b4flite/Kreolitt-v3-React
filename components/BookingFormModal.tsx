import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { BookingInput, BookingStatus, ServiceType, CurrencyCode } from '../types';
import { bookingService, bookingSchema } from '../services/bookingService';
import { useAuth } from '../services/authService';

interface BookingFormModalProps {
  onClose: () => void;
}

export const BookingFormModal: React.FC<BookingFormModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { pax: 1, serviceType: ServiceType.TRANSFER, status: BookingStatus.PENDING, currency: 'SCR' }
  });

  const createBookingMutation = useMutation({
    mutationFn: (data: BookingInput) => bookingService.createBooking(data, undefined, user?.name || 'Admin (Manual)'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success("New booking created");
      onClose();
    },
    onError: (e: any) => {
        toast.error("Failed to create booking: " + e.message);
    }
  });

  const onSubmit = (data: BookingInput) => {
    createBookingMutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl my-8">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-gray-900">New Booking Entry</h3>
               <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                       <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Client Information</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                              <input {...register("clientName")} className="w-full border p-2.5 rounded-lg text-sm" placeholder="e.g. John Doe" />
                              {errors.clientName && <span className="text-red-500 text-xs">{errors.clientName.message}</span>}
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                              <input {...register("email")} className="w-full border p-2.5 rounded-lg text-sm" placeholder="john@example.com" />
                              {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
                          </div>
                          <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                              <input {...register("phone")} className="w-full border p-2.5 rounded-lg text-sm" placeholder="+248 ..." />
                          </div>
                       </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Service Type</label>
                        <select {...register("serviceType")} className="w-full border p-2.5 rounded-lg bg-white text-sm">
                            <option value={ServiceType.TRANSFER}>Transfer</option>
                            <option value={ServiceType.TOUR}>Tour</option>
                            <option value={ServiceType.CHARTER}>Charter</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Passengers (Pax)</label>
                        <input type="number" {...register("pax", { valueAsNumber: true })} className="w-full border p-2.5 rounded-lg text-sm" min="1" />
                        {errors.pax && <span className="text-red-500 text-xs">{errors.pax.message}</span>}
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Price / Amount</label>
                            <div className="flex">
                                <select 
                                    {...register("currency")} 
                                    className="border-y border-l rounded-l-lg bg-gray-50 p-2.5 text-sm font-bold border-gray-300 focus:ring-0 focus:border-gray-300"
                                >
                                    <option value="SCR">SCR</option>
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                </select>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    {...register("amount", { valueAsNumber: true })} 
                                    className="flex-1 border p-2.5 rounded-r-lg text-sm font-bold border-gray-300 focus:ring-sey-blue focus:border-sey-blue" 
                                    placeholder="Amount" 
                                />
                            </div>
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pickup Date & Time</label>
                           <input type="datetime-local" {...register("pickupTime")} className="w-full border p-2.5 rounded-lg text-sm border-gray-300 focus:ring-sey-blue focus:border-sey-blue" />
                           {errors.pickupTime && <span className="text-red-500 text-xs">{errors.pickupTime.message}</span>}
                        </div>
                    </div>

                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pickup Location</label>
                       <input {...register("pickupLocation")} className="w-full border p-2.5 rounded-lg text-sm border-gray-300 focus:ring-sey-blue focus:border-sey-blue" />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Dropoff Location</label>
                       <input {...register("dropoffLocation")} className="w-full border p-2.5 rounded-lg text-sm border-gray-300 focus:ring-sey-blue focus:border-sey-blue" />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Additional Notes</label>
                    <textarea {...register("notes")} rows={3} className="w-full border p-2.5 rounded-lg text-sm border-gray-300 focus:ring-sey-blue focus:border-sey-blue" placeholder="Flight number, special requests..." />
                 </div>

                 <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                    <button type="submit" disabled={createBookingMutation.isPending} className="px-6 py-2.5 bg-sey-blue text-white rounded-lg font-bold hover:bg-blue-800 shadow-sm disabled:opacity-50 transition-all">
                        {createBookingMutation.isPending ? 'Creating...' : 'Create Booking'}
                    </button>
                 </div>
            </form>
        </div>
    </div>
  );
};