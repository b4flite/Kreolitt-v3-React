import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { bookingService } from '../services/bookingService';
import { financeService } from '../services/financeService';
import { settingsService } from '../services/settingsService';
import { userService } from '../services/userService';
import { useAuth } from '../services/authService';
import { Invoice } from '../types';
import { Logo } from '../components/Logo';
import { 
  DocumentTextIcon, 
  PrinterIcon, 
  XMarkIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const ClientPortal: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Self-healing: Sync legacy/guest bookings on load
  useEffect(() => {
    if (user) {
        bookingService.syncUserBookings().then(() => {
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
        });
    }
  }, [user, queryClient]);

  const handleManualSync = async () => {
      setIsSyncing(true);
      await bookingService.syncUserBookings();
      await queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      setIsSyncing(false);
      toast.success("Account synced");
  };

  // Profile Form
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || ''
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { name: string; phone: string }) => userService.updateUserProfile(user!.id, data),
    onSuccess: async () => {
        await refreshUser();
        toast.success("Profile updated successfully");
        setIsEditingProfile(false);
    },
    onError: (err: any) => toast.error(`Update failed: ${err.message}`)
  });

  // Fetch Bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['my-bookings', user?.id, user?.email],
    queryFn: () => bookingService.getClientBookings(user?.id || '', user?.email),
    enabled: !!user
  });

  // Fetch Invoices
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['my-invoices'],
    queryFn: financeService.getClientInvoices,
    enabled: !!user
  });

  // Fetch Business Settings for Invoice Header
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getSettings
  });

  if (bookingsLoading || invoicesLoading) return <div className="p-8 text-center text-gray-500">Loading your trips...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Profile Header Card */}
      <div className="bg-white shadow rounded-lg p-6 border-t-4 border-sey-yellow flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Bookings</h1>
          <p className="text-gray-600">Welcome back, <span className="font-bold text-sey-blue">{user?.name}</span>.</p>
        </div>
        <button 
           onClick={() => setIsEditingProfile(true)}
           className="mt-4 md:mt-0 flex items-center text-sm font-medium text-gray-500 hover:text-sey-blue bg-gray-50 hover:bg-blue-50 px-4 py-2 rounded-lg transition"
        >
            <UserIcon className="w-4 h-4 mr-2" /> Edit Profile
        </button>
      </div>

      {/* Booking List */}
      <div className="space-y-4">
        {bookings?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-100">
            <p className="text-gray-900 font-bold text-lg mb-2">No active bookings found</p>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">If you made a booking recently, it might not be linked to your account yet.</p>
            <button 
                onClick={handleManualSync} 
                disabled={isSyncing}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sey-blue hover:bg-blue-800 focus:outline-none disabled:opacity-50 transition-all"
            >
                <ArrowPathIcon className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Searching...' : 'Locate Missing Bookings'}
            </button>
          </div>
        ) : (
          bookings?.map((booking) => {
            // Find linked invoice
            const invoice = invoices?.find(inv => inv.bookingId === booking.id);

            return (
              <div key={booking.id} className="bg-white shadow-sm hover:shadow-md transition-shadow rounded-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center border border-gray-100">
                 <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-sey-blue">{booking.serviceType}</h3>
                        <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                          {bookingService.formatBookingRef(booking.id)}
                        </span>
                    </div>
                    <p className="text-gray-900 font-medium">
                      {new Date(booking.pickupTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {new Date(booking.pickupTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
                            {invoice.paid ? (
                                <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                    <CheckCircleIcon className="w-3 h-3 mr-1" /> Paid
                                </span>
                            ) : (
                                <span className="flex items-center text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                                    <ExclamationCircleIcon className="w-3 h-3 mr-1" /> Unpaid
                                </span>
                            )}
                            <button 
                                onClick={() => setSelectedInvoice(invoice)}
                                className="flex items-center text-xs font-medium text-sey-blue hover:underline bg-blue-50 px-2 py-1 rounded border border-blue-100 hover:bg-blue-100 transition"
                            >
                                <DocumentTextIcon className="w-3 h-3 mr-1" />
                                {invoice.paid ? 'View Receipt' : 'View Invoice'}
                            </button>
                        </div>
                    )}
                 </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-bold text-gray-900">Edit Profile</h3>
                   <button onClick={() => setIsEditingProfile(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-5 h-5" /></button>
                </div>
                
                <form onSubmit={handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input {...register("name")} className="w-full border p-2.5 rounded-lg text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input {...register("phone")} className="w-full border p-2.5 rounded-lg text-sm" placeholder="+248 ..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input disabled value={user?.email} className="w-full border p-2.5 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
                        <p className="text-[10px] text-gray-400 mt-1">Email cannot be changed directly.</p>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsEditingProfile(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-bold text-white bg-sey-blue hover:bg-blue-800 rounded-lg shadow-sm">
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* INVOICE MODAL with PRINT BREAKOUT */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm print:hidden" onClick={() => setSelectedInvoice(null)}></div>
          
          {/* Main Invoice Container - Added 'print-breakout' to fill page on print */}
          <div className="bg-white rounded-xl w-full max-w-2xl relative shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden print-breakout">
             
             {/* Header - Screen vs Print Logic */}
             <div className="bg-gray-50 border-b border-gray-200 p-5 flex justify-between items-start print:bg-white print:border-none print:pt-0">
                <div className="w-full">
                    {/* Print Header (Letterhead) */}
                    <div className="hidden print:block mb-8">
                       <div className="flex justify-between items-start">
                           <div>
                               <Logo className="h-16 mb-2" />
                               <p className="text-sm font-bold text-gray-900">{settings?.name}</p>
                               <p className="text-xs text-gray-500 whitespace-pre-wrap">{settings?.address}</p>
                               <p className="text-xs text-gray-500">{settings?.phone} | {settings?.email}</p>
                           </div>
                           <div className="text-right">
                               <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight uppercase">
                                   {selectedInvoice.paid ? 'RECEIPT' : 'INVOICE'}
                               </h2>
                               <p className="text-base font-bold text-gray-500 mt-1">#{selectedInvoice.id.substring(0,8).toUpperCase()}</p>
                           </div>
                       </div>
                    </div>

                    {/* Screen Header */}
                    <div className="print:hidden">
                       <h2 className="text-3xl font-extrabold text-sey-blue tracking-tight uppercase">
                           {selectedInvoice.paid ? 'RECEIPT' : 'INVOICE'}
                       </h2>
                       <p className="text-sm text-gray-500 font-mono mt-1">#{selectedInvoice.id.substring(0,8).toUpperCase()}</p>
                    </div>
                </div>

                {/* Buttons - Hidden on Print */}
                <div className="flex space-x-2 print:hidden">
                    <button onClick={() => window.print()} className="p-2 text-gray-600 hover:text-sey-blue hover:bg-blue-50 rounded-full transition" title="Print">
                         <PrinterIcon className="w-6 h-6" />
                    </button>
                    <button onClick={() => setSelectedInvoice(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition" title="Close">
                         <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
             </div>

             {/* Content */}
             <div className="p-8 overflow-y-auto flex-1 bg-white print:p-0 print:overflow-visible" id="invoice-content">
                 
                 {/* Print Watermark */}
                 {selectedInvoice.paid && (
                     <div className="hidden print:block absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] opacity-10 pointer-events-none">
                         <span className="text-9xl font-black text-green-600 border-[12px] border-green-600 px-12 py-4 rounded-xl uppercase">
                             PAID
                         </span>
                     </div>
                 )}

                 {/* Screen Paid Badge */}
                 {selectedInvoice.paid && (
                     <div className="print:hidden absolute top-28 left-1/2 transform -translate-x-1/2 -rotate-12 pointer-events-none opacity-20">
                         <span className="text-8xl font-black text-green-600 border-8 border-green-600 px-8 py-2 rounded-xl uppercase tracking-widest">
                             PAID
                         </span>
                     </div>
                 )}
                 
                 {/* Bill To & Dates */}
                 <div className="flex flex-col md:flex-row justify-between mb-10 gap-8 print:flex-row print:mb-8">
                     <div className="print:hidden">
                         <h3 className="font-bold text-gray-900 text-lg">{settings?.name}</h3>
                         <div className="text-sm text-gray-600 mt-2 space-y-1">
                             <p>{settings?.address}</p>
                             <p>{settings?.phone}</p>
                             <p>{settings?.email}</p>
                         </div>
                     </div>
                     <div className="flex-1 print:flex-none">
                         <p className="text-xs font-bold text-gray-400 uppercase">Billed To</p>
                         <p className="font-bold text-gray-900 text-lg">{selectedInvoice.clientName}</p>
                     </div>
                     <div className="text-right">
                         <div className="mb-4">
                             <p className="text-xs font-bold text-gray-400 uppercase">Currency</p>
                             <p className="font-bold text-gray-900">{selectedInvoice.currency}</p>
                         </div>
                         <div>
                             <p className="text-xs font-bold text-gray-400 uppercase">Date Issued</p>
                             <p className="font-medium text-gray-900">{new Date(selectedInvoice.date).toLocaleDateString('en-GB')}</p>
                         </div>
                     </div>
                 </div>

                 {/* Items Table */}
                 <div className="border rounded-lg overflow-hidden mb-8 print:border-gray-300 print:rounded-none">
                     <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 print:bg-gray-100 print:border-gray-300">
                            <tr>
                                <th className="text-left py-3 px-4 font-bold text-gray-600 uppercase w-1/2 print:text-black">Description</th>
                                <th className="text-center py-3 px-4 font-bold text-gray-600 uppercase print:text-black">Qty</th>
                                <th className="text-right py-3 px-4 font-bold text-gray-600 uppercase print:text-black">Price</th>
                                <th className="text-right py-3 px-4 font-bold text-gray-600 uppercase print:text-black">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 print:divide-gray-200">
                           {selectedInvoice.items?.map((item) => (
                               <tr key={item.id}>
                                   <td className="py-3 px-4 text-gray-800 font-medium">{item.description}</td>
                                   <td className="py-3 px-4 text-center text-gray-600">{Number(item.quantity)}</td>
                                   <td className="py-3 px-4 text-right text-gray-600">{Number(item.unitPrice).toLocaleString('en-GB', {minimumFractionDigits: 2})}</td>
                                   <td className="py-3 px-4 text-right font-bold text-gray-900">{Number(item.total).toLocaleString('en-GB', {minimumFractionDigits: 2})}</td>
                               </tr>
                           ))}
                        </tbody>
                     </table>
                 </div>

                 {/* Totals */}
                 <div className="flex justify-end">
                     <div className="w-64 space-y-2">
                         {settings?.showVatBreakdown && (
                             <>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Subtotal</span>
                                    <span>{selectedInvoice.currency} {selectedInvoice.subtotal.toLocaleString('en-GB', {minimumFractionDigits: 2})}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600 pb-2 border-b border-gray-100 print:border-gray-300">
                                    <span>VAT ({(settings.vatRate * 100).toFixed(1)}%)</span>
                                    <span>{selectedInvoice.currency} {selectedInvoice.taxAmount.toLocaleString('en-GB', {minimumFractionDigits: 2})}</span>
                                </div>
                             </>
                         )}
                         <div className="flex justify-between text-xl font-extrabold text-sey-blue pt-1 print:text-black">
                             <span>Total</span>
                             <span>{selectedInvoice.currency} {selectedInvoice.total.toLocaleString('en-GB', {minimumFractionDigits: 2})}</span>
                         </div>
                     </div>
                 </div>
                 
                 {settings?.paymentInstructions && (
                    <div className="mt-8 pt-6 border-t border-gray-100 print:border-gray-300">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Payment Information</h4>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 print:bg-transparent print:border-gray-300 print:p-2">
                            <pre className="text-sm text-gray-600 font-mono whitespace-pre-wrap font-medium">{settings.paymentInstructions}</pre>
                        </div>
                    </div>
                 )}

                 <div className="mt-8 pt-8 border-t border-gray-100 text-center text-xs text-gray-400 print:border-gray-300">
                     <p>Thank you for choosing {settings?.name}!</p>
                     <p className="mt-1 print:hidden">For any inquiries, please contact us at {settings?.email}</p>
                 </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;