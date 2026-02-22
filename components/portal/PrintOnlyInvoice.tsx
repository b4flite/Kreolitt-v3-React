import React from 'react';
import { Invoice, BusinessSettings } from '../../types';
import { financeService } from '../../services/financeService';

interface PrintOnlyInvoiceProps {
    invoice: Invoice;
    settings?: BusinessSettings;
}

/**
 * A dedicated component for professional printing.
 * Hidden on screen, shown only during print via global CSS.
 */
export const PrintOnlyInvoice: React.FC<PrintOnlyInvoiceProps> = ({ invoice, settings }) => {
    const { subtotal, taxAmount } = financeService.calculateTotals(invoice.total, settings?.vatRate);

    return (
        <div className="print-only-document bg-white text-black p-0 m-0 font-serif">
            {/* Header Section */}
            <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-10">
                <div>
                    <h1 className="text-3xl font-bold uppercase tracking-tighter text-black mb-1">
                        {settings?.name || 'KREOL ISLAND TOURS'}
                    </h1>
                    <p className="text-sm font-medium">{settings?.tagline}</p>
                    <div className="mt-4 text-[11px] leading-tight text-gray-700">
                        <p>{settings?.address}</p>
                        <p>Email: {settings?.email}</p>
                        <p>Tel: {settings?.phone}</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-4xl font-black uppercase text-gray-300 mb-2">
                        {invoice.paid ? 'Receipt' : 'Invoice'}
                    </h2>
                    <p className="text-sm font-bold">No: {invoice.id.substring(0, 8).toUpperCase()}</p>
                    <p className="text-sm">Date: {new Date(invoice.date).toLocaleDateString()}</p>
                </div>
            </div>

            {/* Billing Section */}
            <div className="flex justify-between mb-12">
                <div className="w-1/2">
                    <p className="text-[10px] font-bold uppercase text-gray-500 mb-2">Billed To</p>
                    <p className="text-lg font-bold">{invoice.clientName}</p>
                    {(invoice as any).clientAddress && (
                        <p className="text-sm mt-1 whitespace-pre-wrap leading-relaxed">{(invoice as any).clientAddress}</p>
                    )}
                </div>
                <div className="w-1/4 text-right">
                    <p className="text-[10px] font-bold uppercase text-gray-500 mb-2">Payment Status</p>
                    <p className={`text-sm font-bold uppercase ${invoice.paid ? 'text-green-700' : 'text-red-700'}`}>
                        {invoice.paid ? 'Paid' : 'Unpaid / Pending'}
                    </p>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-sm mb-12 border-collapse">
                <thead>
                    <tr className="border-b border-black text-left">
                        <th className="py-2 font-bold uppercase tracking-wider">Description</th>
                        <th className="py-2 text-right font-bold uppercase tracking-wider">Total ({invoice.currency})</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.items?.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100">
                            <td className="py-4 text-gray-800">{item.description}</td>
                            <td className="py-4 text-right font-medium">{item.total.toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals Section */}
            <div className="flex justify-end mb-16">
                <div className="w-64 space-y-3">
                    <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>{invoice.currency} {subtotal.toLocaleString()}</span>
                    </div>
                    {settings?.showVatBreakdown && (
                        <div className="flex justify-between text-gray-600">
                            <span>VAT ({((settings?.vatRate || 0.15) * 100).toFixed(1)}%)</span>
                            <span>{invoice.currency} {taxAmount.toLocaleString()}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-2xl font-bold border-t-2 border-black pt-3">
                        <span>Total</span>
                        <span>{invoice.currency} {invoice.total.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Footer / Bank Info */}
            {(settings?.bankName || settings?.paymentInstructions) && (
                <div className="mt-12 pt-8 border-t border-gray-300">
                    <div className="grid grid-cols-2 gap-12">
                        {settings?.bankName && (
                            <div>
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Bank Details</h3>
                                <div className="text-[11px] leading-relaxed">
                                    <p className="font-bold text-black uppercase">{settings.bankName}</p>
                                    <p><span className="text-gray-500">Account Holder:</span> {settings.accountHolder}</p>
                                    <p><span className="text-gray-500">Account No:</span> {settings.accountNumber}</p>
                                    <p><span className="text-gray-500">SWIFT/BIC:</span> {settings.swiftCode}</p>
                                </div>
                            </div>
                        )}
                        {settings?.paymentInstructions && (
                            <div>
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Instructions</h3>
                                <p className="text-[11px] text-gray-600 whitespace-pre-wrap italic">
                                    {settings.paymentInstructions}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Professional Legal Footer */}
            <div className="fixed bottom-0 left-0 right-0 py-8 text-center text-[9px] text-gray-400 uppercase tracking-widest">
                Thank you for choosing {settings?.name} • Seychelles Licensed Tour Operator
            </div>
        </div>
    );
};
