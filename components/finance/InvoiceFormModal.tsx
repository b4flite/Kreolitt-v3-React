import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  TrashIcon, XMarkIcon, PrinterIcon, 
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import { Invoice, InvoiceItem, BookingStatus, Booking, CurrencyCode } from '../../types';
import { bookingService } from '../../services/bookingService';
import { financeService } from '../../services/financeService';
import { generateUUID, formatCurrency } from '../../lib/utils';
import { Logo } from '../Logo';

interface InvoiceFormModalProps {
  invoice?: Invoice | null;
  bookingOptions?: Booking[];
  currentVatRate: number;
  settings?: any;
  isProcessing?: boolean;
  onSave: (data: Partial<Invoice>) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onUpdateBookingStatus: (id: string, status: BookingStatus) => void;
  onClose: () => void;
}

export const InvoiceFormModal: React.FC<InvoiceFormModalProps> = ({ 
  invoice, 
  bookingOptions, 
  currentVatRate, 
  settings, 
  isProcessing = false,
  onSave, 
  onDelete, 
  onToggleStatus, 
  onClose 
}) => {
  const isCreateMode = !invoice;
  const [isEditMode, setIsEditMode] = useState(isCreateMode); 
  const [items, setItems] = useState<InvoiceItem[]>(invoice?.items || []);
  
  const { register, handleSubmit, setValue, watch } = useForm<Partial<Invoice>>({
    defaultValues: invoice ? {
        ...invoice,
        date: new Date(invoice.date).toISOString().split('T')[0] as any
    } : {
        date: new Date().toISOString().split('T')[0] as any,
        paid: false,
        currency: 'SCR'
    }
  });

  const watchBookingId = watch('bookingId');
  const watchCurrency = watch('currency') as CurrencyCode;

  useEffect(() => {
    if (isCreateMode && watchBookingId && bookingOptions) {
       const b = bookingOptions.find(bk => bk.id === watchBookingId);
       if (b) {
           setValue('clientName', b.clientName);
           setValue('total', b.amount);
           setValue('currency', b.currency || 'SCR');
       }
    }
  }, [isCreateMode, watchBookingId, bookingOptions, setValue]);

  const handleAddItem = () => {
    setItems([...items, {
        id: generateUUID(),
        description: "New Service Item",
        quantity: 1,
        unitPrice: 0,
        total: 0
    }]);
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    const updatedItems = items.map(item => {
        if (item.id === id) {
            const updated = { ...item, [field]: value };
            if (field === 'quantity' || field === 'unitPrice') {
                const qty = Number(updated.quantity) || 0;
                const price = Number(updated.unitPrice) || 0;
                updated.total = qty * price;
            }
            return updated;
        }
        return item;
    });
    setItems(updatedItems);
  };

  const onSubmit = (data: Partial<Invoice>) => {
      let finalItems = items;
      let finalTotal = Number(data.total) || 0;

      if (isCreateMode && items.length === 0 && finalTotal > 0) {
          finalItems = [{
              id: generateUUID(),
              description: "Service Charge",
              quantity: 1,
              unitPrice: finalTotal,
              total: finalTotal
          }];
      } else if (items.length > 0) {
          finalItems = items.map(item => ({
             ...item,
             quantity: Number(item.quantity),
             unitPrice: Number(item.unitPrice),
             total: Number(item.total)
          }));
          finalTotal = finalItems.reduce((acc, curr) => acc + curr.total, 0);
      }

      const { subtotal, taxAmount } = financeService.calculateTotals(finalTotal, currentVatRate);
      
      onSave({
          ...data,
          items: finalItems,
          total: finalTotal,
          subtotal,
          taxAmount
      });
      
      // Do not close automatically here. The parent component handles closing on success.
      if (!isCreateMode) {
          setIsEditMode(false);
      }
  };

  if (isCreateMode) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm print:hidden" onClick={onClose}></div>
          <div className="bg-white rounded-2xl w-full max-w-lg relative p-6 shadow-2xl animate-in zoom-in-95 print:hidden">
            <h3 className="text-xl font-bold mb-6 text-gray-900 text-center">Create New Invoice</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Link to Booking</label>
                   <select {...register("bookingId")} className="w-full border border-gray-300 p-2.5 rounded-lg bg-gray-50 text-sm">
                      <option value="">-- Manual Invoice --</option>
                      {bookingOptions?.map(b => (
                         <option key={b.id} value={b.id}>
                            {bookingService.formatBookingRef(b.id)} - {b.clientName} ({b.currency} {b.amount})
                         </option>
                      ))}
                   </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Date</label>
                        <input type="date" {...register("date")} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Currency</label>
                        <select {...register("currency")} className="w-full border border-gray-300 p-2.5 rounded-lg bg-white text-sm font-bold">
                            <option value="SCR">SCR</option>
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Client Name</label>
                    <input {...register("clientName", {required: true})} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm" />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Amount</label>
                    <input type="number" step="0.01" {...register("total", {required: true})} className="w-full border border-gray-300 p-2.5 rounded-lg text-lg font-bold" />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={onClose} disabled={isProcessing} className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                    <button type="submit" disabled={isProcessing} className="px-5 py-2.5 bg-sey-blue text-white font-bold rounded-lg hover:bg-blue-800 shadow-sm disabled:opacity-50 transition-all flex items-center">
                        {isProcessing ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Creating...
                            </>
                        ) : 'Create Invoice'}
                    </button>
                </div>
            </form>
          </div>
        </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay - Hidden when printing */}
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm print:hidden" onClick={onClose}></div>
      
      {/* Main Container - The "print-breakout" class allows this div to escape the modal layout during print */}
      <div className="bg-white rounded-2xl w-full max-w-3xl relative p-0 overflow-hidden shadow-2xl flex flex-col max-h-[90vh] print-breakout">
         
         {/* HEADER - Different for Print vs Screen */}
         <div className="bg-gray-50 border-b border-gray-200 p-6 flex justify-between items-start print:bg-white print:border-none print:pt-0">
            <div className="w-full">
               <div className="flex justify-between items-start mb-6 print:mb-8">
                  <div className="hidden print:block">
                     {/* Print Letterhead Logo */}
                     <Logo className="h-16 mb-2" />
                     <p className="text-sm font-bold text-gray-900">{settings?.name}</p>
                     <p className="text-xs text-gray-500 whitespace-pre-wrap">{settings?.address}</p>
                     <p className="text-xs text-gray-500">{settings?.phone} | {settings?.email}</p>
                  </div>
                  <div className="print:text-right">
                     <h2 className="text-2xl font-extrabold text-sey-blue tracking-tight uppercase print:text-4xl print:text-gray-900">INVOICE</h2>
                     <p className="text-sm text-gray-500 font-mono mt-1 print:text-base print:font-bold print:mt-2">#{invoice!.id.substring(0,8).toUpperCase()}</p>
                  </div>
               </div>

               {/* Screen-Only Header Items */}
               <div className="flex items-center gap-3 mt-4 print:hidden">
                   <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${invoice!.paid ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                       {invoice!.paid ? 'Paid' : 'Unpaid'}
                   </span>
                   <button onClick={() => onToggleStatus(invoice!.id)} className="text-xs font-medium text-gray-500 hover:text-sey-blue underline decoration-dotted underline-offset-2">
                       Toggle Status
                   </button>
               </div>
            </div>

            {/* Modal Controls - Hidden on Print */}
            <div className="text-right flex flex-col items-end gap-2 print:hidden absolute top-6 right-6">
                <div className="flex space-x-2">
                    {!isEditMode && (
                       <button onClick={() => setIsEditMode(true)} className="flex items-center px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 shadow-sm transition">
                           <PencilSquareIcon className="w-4 h-4 mr-2" /> Edit
                       </button>
                    )}
                    <button onClick={() => onDelete(invoice!.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                         <TrashIcon className="w-5 h-5" />
                    </button>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                         <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
         </div>

         <div className="p-8 overflow-y-auto flex-1 print:p-0 print:overflow-visible">
             
             {/* Print-Only: Paid Stamp */}
             {invoice!.paid && (
                <div className="hidden print:block absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] opacity-20 pointer-events-none z-0">
                    <span className="text-9xl font-black text-green-600 border-[10px] border-green-600 px-12 py-4 rounded-xl uppercase">PAID</span>
                </div>
             )}

             <div className="grid grid-cols-2 mb-10 gap-8">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Bill To</p>
                    {isEditMode ? (
                        <input {...register("clientName")} className="border p-1 rounded w-full max-w-xs" />
                    ) : (
                        <p className="font-bold text-xl text-gray-900">{invoice!.clientName}</p>
                    )}
                </div>
                <div className="text-right">
                    <div className="mb-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date Issued</p>
                        <p className="font-medium text-gray-900">{new Date(invoice!.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Currency</p>
                        {isEditMode ? (
                            <select {...register("currency")} className="border p-1 rounded font-bold">
                                <option value="SCR">SCR</option>
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                            </select>
                        ) : (
                            <p className="font-bold text-gray-900">{invoice!.currency}</p>
                        )}
                    </div>
                </div>
             </div>

             <div className="border rounded-lg overflow-hidden mb-8 print:border-gray-300 print:rounded-none">
                 <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200 print:bg-gray-100 print:border-gray-300">
                        <tr>
                            <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/2 print:text-gray-900">Service</th>
                            <th className="text-center py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-gray-900">Qty</th>
                            <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-gray-900">Price</th>
                            <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-gray-900">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 print:divide-gray-200">
                       {items.map((item) => (
                           <tr key={item.id}>
                               <td className="py-3 px-4">
                                   {isEditMode ? (
                                       <input value={item.description} onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)} className="w-full border-gray-300 p-1.5 rounded text-sm" />
                                   ) : (
                                       <span className="text-sm text-gray-900">{item.description}</span>
                                   )}
                               </td>
                               <td className="py-3 px-4 text-center">
                                   {isEditMode ? (
                                       <input type="number" value={item.quantity} onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)} className="w-16 border-gray-300 p-1.5 rounded text-center text-sm" />
                                   ) : (
                                       <span className="text-sm text-gray-600">{item.quantity}</span>
                                   )}
                               </td>
                               <td className="py-3 px-4 text-right">
                                   {isEditMode ? (
                                       <input type="number" step="0.01" value={item.unitPrice} onChange={(e) => handleUpdateItem(item.id, 'unitPrice', e.target.value)} className="w-24 border-gray-300 p-1.5 rounded text-right text-sm" />
                                   ) : (
                                       <span className="text-sm text-gray-600">{formatCurrency(item.unitPrice, watchCurrency)}</span>
                                   )}
                               </td>
                               <td className="py-3 px-4 text-right font-bold text-gray-900">
                                   {formatCurrency(item.total, watchCurrency)}
                               </td>
                           </tr>
                       ))}
                    </tbody>
                 </table>
             </div>

             <div className="flex justify-end">
                 <div className="w-72 space-y-3">
                     {(() => {
                         const liveTotal = items.reduce((acc, curr) => acc + Number(curr.total), 0);
                         const { subtotal, taxAmount } = financeService.calculateTotals(liveTotal, currentVatRate);
                         return (
                            <>
                                {settings?.showVatBreakdown && (
                                    <>
                                        <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatCurrency(subtotal, watchCurrency)}</span></div>
                                        <div className="flex justify-between text-sm text-gray-600"><span>VAT ({(currentVatRate * 100).toFixed(1)}%)</span><span>{formatCurrency(taxAmount, watchCurrency)}</span></div>
                                    </>
                                )}
                                <div className="flex justify-between text-xl font-extrabold text-gray-900 border-t border-gray-300 pt-3 mt-1 print:border-black">
                                    <span>Total</span>
                                    <span>{formatCurrency(liveTotal, watchCurrency)}</span>
                                </div>
                            </>
                          );
                     })()}
                 </div>
             </div>

             {/* Payment Instructions - Print Only */}
             {settings?.paymentInstructions && (
                 <div className="hidden print:block mt-12 pt-6 border-t border-gray-200">
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Instructions</p>
                     <div className="bg-gray-50 p-4 rounded border border-gray-200">
                        <pre className="text-sm font-mono whitespace-pre-wrap text-gray-700">{settings.paymentInstructions}</pre>
                     </div>
                 </div>
             )}

             <div className="hidden print:block mt-12 text-center text-xs text-gray-500">
                 <p>Thank you for choosing {settings?.name}!</p>
             </div>
         </div>

         <div className="bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-3 print:hidden">
             {isEditMode ? (
                 <>
                    <button onClick={() => setIsEditMode(false)} disabled={isProcessing} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg disabled:opacity-50">Cancel</button>
                    <button onClick={handleSubmit(onSubmit)} disabled={isProcessing} className="px-5 py-2.5 bg-sey-blue text-white font-bold rounded-lg hover:bg-blue-800 transition shadow-sm disabled:opacity-50 flex items-center">
                        {isProcessing ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Saving...
                            </>
                        ) : 'Save Invoice'}
                    </button>
                 </>
             ) : (
                 <>
                    <button onClick={() => window.print()} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 flex items-center shadow-sm">
                        <PrinterIcon className="w-5 h-5 mr-2 text-gray-500"/> Print PDF
                    </button>
                    <button onClick={onClose} className="px-5 py-2.5 bg-sey-blue text-white font-bold rounded-lg hover:bg-blue-800 shadow-sm">Done</button>
                 </>
             )}
         </div>
      </div>
    </div>
  );
};