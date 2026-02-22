import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeService } from '../services/financeService';
import { bookingService } from '../services/bookingService';
import { settingsService } from '../services/settingsService';
import { Expense, Invoice, SEYCHELLES_VAT_RATE_DEFAULT, BookingStatus } from '../types';
import { toast } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import {
  CurrencyDollarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, BanknotesIcon,
  PlusIcon, TrashIcon, DocumentTextIcon, PencilSquareIcon, FunnelIcon, ChevronLeftIcon, ChevronRightIcon
} from '@heroicons/react/24/outline';
import { StatCard } from '../components/StatCard';
import { formatCurrency, formatDate } from '../lib/utils';
import { InvoiceFormModal } from '../components/finance/InvoiceFormModal';
import { ExpenseFormModal } from '../components/finance/ExpenseFormModal';
import { TaxSummary } from '../components/finance/TaxSummary';

const FinancePage: React.FC = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'invoices' | 'expenses' | 'tax'>('invoices');

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [invPage, setInvPage] = useState(1);
  const invPageSize = 10;
  const [expPage, setExpPage] = useState(1);
  const expPageSize = 50;

  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsService.getSettings });
  const currentVatRate = settings?.vatRate ?? SEYCHELLES_VAT_RATE_DEFAULT;

  const { data: invoiceResult, isLoading: loadingInvoices } = useQuery({
    queryKey: ['invoices', invPage],
    queryFn: () => financeService.getInvoices(invPage, invPageSize),
    placeholderData: (prev) => prev
  });
  const invoices = invoiceResult?.data || [];
  const totalInvoices = invoiceResult?.count || 0;
  const totalInvPages = Math.ceil(totalInvoices / invPageSize);

  const { data: expenseResult, isLoading: loadingExpenses } = useQuery({
    queryKey: ['expenses', expPage],
    queryFn: () => financeService.getAllExpenses(expPage, expPageSize)
  });
  const expenses = expenseResult?.data || [];
  const totalExpensesCount = expenseResult?.count || 0;
  const totalExpPages = Math.ceil(totalExpensesCount / expPageSize);

  const { data: stats } = useQuery({
    queryKey: ['financeStats'],
    queryFn: () => financeService.getStats()
  });

  const { data: bookingOptions } = useQuery({
    queryKey: ['bookingOptions'],
    queryFn: () => bookingService.getBookingOptions()
  });

  useEffect(() => {
    if (location.state?.openInvoiceId && invoices) {
      const target = invoices.find(i => i.id === location.state.openInvoiceId);
      if (target) {
        handleOpenInvoice(target);
        setActiveTab('invoices');
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, invoices]);

  const handleOpenInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setShowInvoiceModal(true);
  };

  const addExpenseMutation = useMutation({
    mutationFn: (payload: any) => financeService.addExpense(payload, currentVatRate, { addToInvoice: payload.addToInvoice }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financeStats'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success("Expense recorded");
      setShowExpenseModal(false);
    }
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Expense> }) => financeService.updateExpense(id, updates, currentVatRate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financeStats'] });
      toast.success("Expense updated");
      setShowExpenseModal(false);
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: financeService.deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financeStats'] });
      toast.success("Expense deleted");
    }
  });

  const createInvoiceMutation = useMutation({
    mutationFn: financeService.createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['financeStats'] });
      toast.success("Invoice created");
      setShowInvoiceModal(false);
    }
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Invoice> }) => financeService.updateInvoice(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['financeStats'] });
      toast.success("Invoice saved");
      setSelectedInvoice(data);
    }
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: financeService.deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success("Invoice deleted");
      setShowInvoiceModal(false);
    }
  });

  const toggleInvoiceStatusMutation = useMutation({
    mutationFn: financeService.toggleInvoiceStatus,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      if (selectedInvoice) setSelectedInvoice(data);
    }
  });

  const filteredInvoices = invoices?.filter(inv => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'PAID') return inv.paid;
    if (filterStatus === 'UNPAID') return !inv.paid;
    return true;
  });

  if (loadingInvoices || loadingExpenses) return <div className="text-center py-20 text-gray-400">Loading financials...</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Financial Overview</h1>
          <p className="text-gray-500 mt-1 text-sm">Aggregated stats in SCR (Base Currency).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 print:hidden">
        <StatCard title="Total Revenue" value={formatCurrency(stats?.totalRevenue)} color="#003D88" icon={CurrencyDollarIcon} onClick={() => setActiveTab('invoices')} />
        <StatCard title="Total Expenses" value={formatCurrency(stats?.totalExpenses)} color="#D62828" icon={ArrowTrendingDownIcon} onClick={() => setActiveTab('expenses')} />
        <StatCard title="Net Profit (Est)" value={formatCurrency(stats?.netProfit)} subValue="After Tax" color="#007A3D" icon={ArrowTrendingUpIcon} />
        <StatCard title="VAT Net Payable" value={formatCurrency(stats?.vatPayable)} color={stats?.vatPayable > 0 ? "#D62828" : "#007A3D"} icon={BanknotesIcon} onClick={() => setActiveTab('tax')} />
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden min-h-[600px] flex flex-col print:border-none print:shadow-none">
        <div className="border-b border-gray-100 px-6 pt-2 bg-gray-50/30 print:hidden">
          <nav className="-mb-px flex space-x-8">
            {['invoices', 'expenses', 'tax'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors capitalize ${activeTab === tab ? 'border-sey-blue text-sey-blue' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'invoices' && (
          <div className="p-6 flex-1">
            <div className="flex justify-between items-center mb-6 gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="text-sm border-gray-300 rounded-lg px-3 py-1.5 font-medium text-gray-700"
              >
                <option value="ALL">All Invoices</option>
                <option value="PAID">Paid Only</option>
                <option value="UNPAID">Unpaid Only</option>
              </select>
              <button onClick={() => { setSelectedInvoice(null); setShowInvoiceModal(true); }} className="bg-sey-blue hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all flex items-center">
                <PlusIcon className="w-5 h-5 mr-2" /> Create Invoice
              </button>
            </div>
            <div className="overflow-x-auto min-h-[400px]">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-500">Client</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-500">Total</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-500">Status</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredInvoices?.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3">{formatDate(inv.date)}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-900 block">{inv.clientName}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(inv.total, inv.currency)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${inv.paid ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                          {inv.paid ? 'PAID' : 'DUE'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleOpenInvoice(inv)} className="text-gray-400 hover:text-sey-blue p-2 rounded-full hover:bg-blue-50 transition-colors">
                          <DocumentTextIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div className="p-6 flex-1">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Expense Record</h3>
              <button onClick={() => { setExpenseToEdit(null); setShowExpenseModal(true); }} className="bg-sey-blue hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all flex items-center">
                <PlusIcon className="w-5 h-5 mr-2" /> Log Expense
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-500">Category</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-500">Description</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-500">Amount</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {expenses?.map(exp => (
                    <tr key={exp.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(exp.date)}</td>
                      <td className="px-4 py-3">
                        <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-bold border border-gray-200">{exp.category}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{exp.description}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{formatCurrency(exp.amount, exp.currency)}</td>
                      <td className="px-4 py-3 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setExpenseToEdit(exp); setShowExpenseModal(true); }} className="text-gray-400 hover:text-sey-blue p-1 rounded-full hover:bg-blue-50">
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (window.confirm('Delete expense?')) deleteExpenseMutation.mutate(exp.id); }} className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalExpPages > 1 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setExpPage(p => Math.max(1, p - 1))}
                  disabled={expPage === 1}
                  className="flex items-center px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeftIcon className="w-4 h-4 mr-1" /> Previous
                </button>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Page {expPage} of {totalExpPages}</span>
                <button
                  onClick={() => setExpPage(p => Math.min(totalExpPages, p + 1))}
                  disabled={expPage === totalExpPages}
                  className="flex items-center px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Next <ChevronRightIcon className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tax' && <TaxSummary stats={stats} currentVatRate={currentVatRate} />}
      </div>

      {showExpenseModal && (
        <ExpenseFormModal
          expense={expenseToEdit}
          bookingOptions={bookingOptions}
          isProcessing={addExpenseMutation.isPending || updateExpenseMutation.isPending}
          onSave={(data) => {
            const payload = { ...data, amount: Number(data.amount) };
            if (expenseToEdit) updateExpenseMutation.mutate({ id: expenseToEdit.id, updates: payload });
            else addExpenseMutation.mutate(payload);
          }}
          onDelete={(id) => deleteExpenseMutation.mutate(id)}
          onClose={() => { setShowExpenseModal(false); setExpenseToEdit(null); }}
        />
      )}

      {showInvoiceModal && (
        <InvoiceFormModal
          invoice={selectedInvoice}
          bookingOptions={bookingOptions}
          currentVatRate={currentVatRate}
          settings={settings}
          isProcessing={createInvoiceMutation.isPending || updateInvoiceMutation.isPending}
          onSave={(data) => {
            if (!selectedInvoice) createInvoiceMutation.mutate(data as any);
            else updateInvoiceMutation.mutate({ id: selectedInvoice.id, data });
          }}
          onDelete={(id) => deleteInvoiceMutation.mutate(id)}
          onToggleStatus={(id) => toggleInvoiceStatusMutation.mutate(id)}
          onUpdateBookingStatus={() => { }}
          onClose={() => { setShowInvoiceModal(false); setSelectedInvoice(null); }}
        />
      )}
    </div>
  );
};

export default FinancePage;