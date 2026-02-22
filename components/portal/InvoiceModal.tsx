import React from 'react';
import { Invoice, BusinessSettings } from '../../types';
import { financeService } from '../../services/financeService';
import {
    PrinterIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

interface InvoiceModalProps {
    invoice: Invoice;
    settings?: BusinessSettings;
    onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, settings, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/60" onClick={onClose}></div>
            <div className="bg-white rounded-xl w-full max-w-2xl relative shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                <div className="bg-gray-50 border-b p-5 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-sey-blue uppercase">{invoice.paid ? 'Receipt' : 'Invoice'}</h2>
                        <p className="text-xs text-gray-500 font-mono">#{invoice.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => window.print()} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"><PrinterIcon className="w-5 h-5" /></button>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><XMarkIcon className="w-5 h-5" /></button>
                    </div>
                </div>
                <div className="p-8 overflow-y-auto flex-1 bg-white">
                    <div className="flex justify-between mb-10">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Billed To</p>
                            <p className="font-bold text-gray-900">{invoice.clientName}</p>
                            {/* In legacy, clientAddress might not exist or be on User, but Invoice type should allow it */}
                            {(invoice as any).clientAddress && (
                                <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{(invoice as any).clientAddress}</p>
                            )}
                        </div>
                        <div className="text-right text-sm">
                            <p><span className="font-bold">Currency:</span> {invoice.currency}</p>
                            <p><span className="font-bold">Date:</span> {new Date(invoice.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <table className="w-full text-sm mb-8">
                        <thead className="bg-gray-50 uppercase text-[10px] font-black text-gray-500">
                            <tr className="border-b">
                                <th className="text-left py-2 px-4">Description</th>
                                <th className="text-right py-2 px-4">Total ({invoice.currency})</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items?.map((item) => (
                                <tr key={item.id} className="border-b">
                                    <td className="py-2 px-4">{item.description}</td>
                                    <td className="py-2 px-4 text-right font-bold">{item.total.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-end mb-10">
                        <div className="w-64 space-y-2">
                            {(() => {
                                const { subtotal, taxAmount } = financeService.calculateTotals(invoice.total, settings?.vatRate);
                                return (
                                    <>
                                        <div className="flex justify-between text-gray-500 text-xs">
                                            <span>Subtotal</span>
                                            <span>{invoice.currency} {subtotal.toLocaleString()}</span>
                                        </div>
                                        {settings?.showVatBreakdown && (
                                            <div className="flex justify-between text-gray-500 text-xs">
                                                <span>VAT ({((settings?.vatRate || 0.15) * 100).toFixed(1)}%)</span>
                                                <span>{invoice.currency} {taxAmount.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-xl font-extrabold text-sey-blue border-t pt-2">
                                            <span>Total</span>
                                            <span>{invoice.currency} {invoice.total.toLocaleString()}</span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {settings?.paymentInstructions && (
                        <div className="mt-8 pt-6 border-t border-dashed">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase mb-2">Payment Instructions</h4>
                            <div className="text-xs text-gray-600 whitespace-pre-wrap italic">
                                {settings.paymentInstructions}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
