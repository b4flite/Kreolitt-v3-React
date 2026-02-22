import React, { useState } from 'react';
import { Booking } from '../../types';

interface BookingConfirmationModalProps {
  booking: Booking;
  isProcessing: boolean;
  onConfirm: (price: number) => void;
  onCancel: () => void;
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({ 
  booking, 
  isProcessing, 
  onConfirm, 
  onCancel 
}) => {
  const [confirmPrice, setConfirmPrice] = useState<number>(booking.amount);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Booking</h3>
        <p className="text-sm text-gray-500 mb-4">
          You are about to confirm the booking for <span className="font-bold">{booking.clientName}</span>. 
          Please verify or update the final agreed price below.
        </p>
        
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Final Price (SCR)</label>
          <input 
            type="number" 
            value={confirmPrice} 
            onChange={(e) => setConfirmPrice(Number(e.target.value))}
            className="w-full text-2xl font-bold border border-gray-300 rounded-lg p-2 focus:ring-sey-blue focus:border-sey-blue text-center"
          />
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={onCancel} 
            className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirm(confirmPrice)}
            disabled={isProcessing}
            className="flex-1 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-sm flex justify-center items-center"
          >
             {isProcessing ? "Confirming..." : "Confirm Now"}
          </button>
        </div>
      </div>
    </div>
  );
};