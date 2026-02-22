import React from 'react';
import { ReceiptPercentIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../lib/utils';

interface TaxSummaryProps {
  stats: any;
  currentVatRate: number;
}

export const TaxSummary: React.FC<TaxSummaryProps> = ({ stats, currentVatRate }) => {
  if (!stats) return null;

  return (
    <div className="p-6 bg-gray-50/50 flex-1">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                 <h4 className="font-bold flex items-center mb-4 text-gray-900"><ReceiptPercentIcon className="w-5 h-5 mr-2 text-sey-yellow" /> VAT Return Summary</h4>
                 <div className="space-y-4 text-sm">
                     <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                         <span className="text-gray-600">Output Tax (Collected)</span>
                         <span className="font-bold text-red-600">+ {formatCurrency(stats.totalOutputTax)}</span>
                     </div>
                     <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                         <span className="text-gray-600">Input Tax (Deductible)</span>
                         <span className="font-bold text-green-600">- {formatCurrency(stats.totalInputTax)}</span>
                     </div>
                     <div className="border-t pt-4 flex justify-between text-lg font-extrabold">
                         <span>Net Payable to SRC</span>
                         <span className={stats.vatPayable > 0 ? 'text-sey-red' : 'text-sey-green'}>
                             {formatCurrency(stats.vatPayable)}
                         </span>
                     </div>
                     <div className="text-xs text-gray-400 mt-2 text-center">
                        * Calculated based on standard rate of {(currentVatRate*100).toFixed(1)}%
                     </div>
                 </div>
             </div>
         </div>
     </div>
  );
};