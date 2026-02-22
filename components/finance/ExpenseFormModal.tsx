import React from 'react';
import { useForm } from 'react-hook-form';
import { TrashIcon } from '@heroicons/react/24/outline';
import { Expense, ExpenseCategory, Booking } from '../../types';
import { bookingService } from '../../services/bookingService';

interface ExpenseFormModalProps {
  expense?: Expense | null;
  bookingOptions?: Booking[];
  isProcessing?: boolean;
  onSave: (data: Expense & { addToInvoice?: boolean }) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({ 
  expense, 
  bookingOptions, 
  isProcessing = false,
  onSave, 
  onDelete, 
  onClose 
}) => {
  const { register, handleSubmit, watch } = useForm<Expense & { addToInvoice?: boolean }>({
    defaultValues: expense ? {
      ...expense,
      date: expense.date.split('T')[0] // Format for input date
    } : {
      vatIncluded: false,
      amount: 0
    }
  });

  const watchBookingId = watch("bookingId");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl w-full max-w-lg relative p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold mb-6 text-gray-900">{expense ? 'Edit Expense' : 'Log New Expense'}</h3>
        <form onSubmit={handleSubmit(onSave)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Date</label>
                    <input type="date" {...register("date", {required: true})} className="w-full border border-gray-300 p-2.5 rounded-lg text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                    <select {...register("category")} className="w-full border border-gray-300 p-2.5 rounded-lg bg-white text-sm">
                    {Object.values(ExpenseCategory).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Amount (SCR)</label>
                <input type="number" step="0.01" {...register("amount", {required: true})} placeholder="0.00" className="w-full border border-gray-300 p-2.5 rounded-lg text-lg font-bold text-gray-900" />
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between border border-gray-100">
                <span className="text-sm font-medium text-gray-700">Price includes VAT?</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" {...register("vatIncluded")} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sey-blue"></div>
                </label>
            </div>
            
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
               <textarea {...register("description", {required: true})} placeholder="Enter details..." className="w-full border border-gray-300 p-2.5 rounded-lg text-sm" rows={2} />
            </div>

            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Link to Booking (Optional)</label>
               <select {...register("bookingId")} className="w-full border border-gray-300 p-2.5 rounded-lg bg-white text-sm">
                  <option value="">-- No Booking Linked --</option>
                  {bookingOptions?.map(b => (
                     <option key={b.id} value={b.id}>
                        {bookingService.formatBookingRef(b.id)} - {b.clientName}
                     </option>
                  ))}
               </select>
            </div>

            {!expense && watchBookingId && (
               <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                  <div className="flex items-center h-5">
                     <input id="billable" type="checkbox" {...register("addToInvoice")} className="w-4 h-4 text-sey-blue border-gray-300 rounded focus:ring-sey-blue" />
                  </div>
                  <div>
                      <label htmlFor="billable" className="text-sm font-bold text-blue-900">Billable to Client?</label>
                      <p className="text-xs text-blue-700 mt-1">If checked, this amount will be added as a line item to the client's invoice.</p>
                  </div>
               </div>
            )}
            
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                {expense && onDelete && (
                    <button 
                        type="button" 
                        onClick={() => {
                            if(window.confirm('Delete this expense?')) {
                                onDelete(expense.id);
                            }
                        }}
                        disabled={isProcessing}
                        className="mr-auto text-red-600 hover:text-red-800 text-sm font-medium flex items-center disabled:opacity-50"
                    >
                        <TrashIcon className="w-4 h-4 mr-1" /> Delete
                    </button>
                )}
                <button type="button" onClick={onClose} disabled={isProcessing} className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isProcessing} className="px-5 py-2.5 bg-sey-blue text-white font-bold rounded-lg hover:bg-blue-800 shadow-sm disabled:opacity-50 flex items-center">
                    {isProcessing ? (
                         <>
                             <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                             Saving...
                         </>
                    ) : 'Save Expense'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};