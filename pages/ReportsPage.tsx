import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services/reportService';
import { bookingService } from '../services/bookingService';
import { formatCurrency, formatDateTime, formatDate } from '../lib/utils';
import { BookingStatus } from '../types';
import { 
  PrinterIcon, 
  CalendarDaysIcon, 
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { StatCard } from '../components/StatCard';

type ReportType = 'manifest' | 'financial';

const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('manifest');
  
  // Date State (Defaults: Manifest = Next 7 days, Financial = This Month)
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const firstDayMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(nextWeek);

  // Switch defaults when tab changes
  const handleTabChange = (type: ReportType) => {
      setReportType(type);
      if (type === 'manifest') {
          setStartDate(today);
          setEndDate(nextWeek);
      } else {
          setStartDate(firstDayMonth);
          setEndDate(today);
      }
  };

  // Queries
  const { data: manifest, isLoading: loadingManifest } = useQuery({
      queryKey: ['report-manifest', startDate, endDate],
      queryFn: () => reportService.getManifest(startDate, endDate),
      enabled: reportType === 'manifest'
  });

  const { data: financials, isLoading: loadingFinancials } = useQuery({
      queryKey: ['report-financials', startDate, endDate],
      queryFn: () => reportService.getFinancialReport(startDate, endDate),
      enabled: reportType === 'financial'
  });

  const handlePrint = () => {
      window.print();
  };

  return (
    <div className="min-h-screen">
      
      {/* Header - Hidden on Print */}
      <div className="print:hidden mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Reports</h1>
                <p className="text-gray-500 mt-1">Generate operational run sheets and financial summaries.</p>
            </div>
            <div className="flex bg-white rounded-lg shadow-sm p-1 border border-gray-200">
                <button 
                    onClick={() => handleTabChange('manifest')}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition ${reportType === 'manifest' ? 'bg-sey-blue text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <CalendarDaysIcon className="w-4 h-4 mr-2" /> Run Sheet
                </button>
                <button 
                    onClick={() => handleTabChange('financial')}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition ${reportType === 'financial' ? 'bg-sey-blue text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <CurrencyDollarIcon className="w-4 h-4 mr-2" /> Financials
                </button>
            </div>
        </div>

        {/* Controls */}
        <div className="mt-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-auto">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Start Date</label>
                <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    className="w-full md:w-40 border-gray-300 rounded-lg shadow-sm focus:ring-sey-blue focus:border-sey-blue text-sm"
                />
            </div>
            <div className="w-full md:w-auto">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">End Date</label>
                <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    className="w-full md:w-40 border-gray-300 rounded-lg shadow-sm focus:ring-sey-blue focus:border-sey-blue text-sm"
                />
            </div>
            <div className="flex-1"></div>
            <button 
                onClick={handlePrint}
                className="w-full md:w-auto flex items-center justify-center bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition shadow-md font-medium"
            >
                <PrinterIcon className="w-5 h-5 mr-2" /> Print Report
            </button>
        </div>
      </div>

      {/* --- REPORT CONTENT --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 print:border-none print:shadow-none min-h-[500px] overflow-hidden">
          
          {/* Print Header */}
          <div className="hidden print:block p-8 pb-4 text-center">
              <h1 className="text-3xl font-bold uppercase tracking-wider mb-1">Kreol Island Tours</h1>
              <h2 className="text-xl text-gray-600 mb-4 font-semibold">{reportType === 'manifest' ? 'Operational Run Sheet' : 'Financial Report'}</h2>
              <div className="text-sm text-gray-500 border-b border-gray-300 pb-4 mb-4 flex justify-between">
                  <span>Period: {formatDate(startDate)} &mdash; {formatDate(endDate)}</span>
                  <span>Generated: {new Date().toLocaleString()}</span>
              </div>
          </div>

          {/* MANIFEST VIEW */}
          {reportType === 'manifest' && (
              <div className="p-0 print:p-4">
                  {loadingManifest ? (
                      <div className="p-12 text-center text-gray-400">Loading run sheet data...</div>
                  ) : (
                      <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 border-collapse">
                                <thead className="bg-gray-50 print:bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black print:border-b print:border-gray-300">Date & Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black print:border-b print:border-gray-300">Ref</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black print:border-b print:border-gray-300">Client & Pax</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black print:border-b print:border-gray-300">Service Route</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black print:border-b print:border-gray-300">Notes</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black print:border-b print:border-gray-300">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 print:divide-gray-300">
                                    {manifest?.map((booking) => (
                                        <tr key={booking.id} className="hover:bg-gray-50 break-inside-avoid print:break-inside-avoid">
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                {formatDateTime(booking.pickupTime)}
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap text-xs font-mono text-gray-500">
                                                {bookingService.formatBookingRef(booking.id)}
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900">{booking.clientName}</div>
                                                <div className="text-xs text-gray-500">{booking.pax} Passengers</div>
                                            </td>
                                            <td className="px-6 py-3 text-sm text-gray-600">
                                                <span className="font-bold text-xs uppercase bg-gray-100 px-1 rounded mr-2 print:border print:border-gray-300">{booking.serviceType}</span>
                                                <br className="hidden print:inline" />
                                                {booking.pickupLocation} <span className="text-gray-400">&rarr;</span> {booking.dropoffLocation}
                                            </td>
                                            <td className="px-6 py-3 text-sm text-gray-500 italic max-w-xs truncate print:whitespace-normal">
                                                {booking.notes || "-"}
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap text-center">
                                                <span className={`px-2 py-1 text-xs font-bold rounded-full border print:border-gray-400 ${
                                                    booking.status === BookingStatus.CONFIRMED ? 'bg-green-100 text-green-800' :
                                                    booking.status === BookingStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
                                                    booking.status === BookingStatus.COMPLETED ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!manifest || manifest.length === 0) && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                                No bookings found for this period.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                      </>
                  )}
              </div>
          )}

          {/* FINANCIAL VIEW */}
          {reportType === 'financial' && (
              <div className="p-6">
                  {loadingFinancials ? (
                      <div className="p-12 text-center text-gray-400">Calculating financials...</div>
                  ) : financials && (
                      <div className="space-y-8">
                          {/* Summary Cards - Grid refined for print */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:grid-cols-2 print:gap-4">
                              <StatCard title="Total Revenue" value={formatCurrency(financials.summary.totalRevenue)} color="#003D88" />
                              <StatCard title="Paid Revenue" value={formatCurrency(financials.summary.totalPaidRevenue)} color="#059669" />
                              <StatCard title="Expenses" value={formatCurrency(financials.summary.totalExpenses)} color="#D62828" />
                              <StatCard title="Net Profit" value={formatCurrency(financials.summary.netProfit)} color="#007A3D" />
                          </div>

                          {/* Data Tables */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block">
                              <div className="border border-gray-200 rounded-xl overflow-hidden print:mb-8 print:break-inside-avoid print:border-gray-300">
                                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 font-bold text-gray-700 print:bg-gray-100">Recent Invoices</div>
                                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                                      <thead className="bg-gray-50 print:bg-white">
                                          <tr>
                                              <th className="px-4 py-2 text-left">Date</th>
                                              <th className="px-4 py-2 text-left">Client</th>
                                              <th className="px-4 py-2 text-right">Amount</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200 bg-white">
                                          {financials.invoices.slice(0, 20).map(inv => (
                                              <tr key={inv.id} className="break-inside-avoid">
                                                  <td className="px-4 py-2">{formatDate(inv.date)}</td>
                                                  <td className="px-4 py-2 truncate max-w-[150px]">{inv.clientName}</td>
                                                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(inv.total)}</td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              </div>

                              <div className="border border-gray-200 rounded-xl overflow-hidden print:break-inside-avoid print:border-gray-300">
                                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 font-bold text-gray-700 print:bg-gray-100">Expenses Breakdown</div>
                                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                                      <thead className="bg-gray-50 print:bg-white">
                                          <tr>
                                              <th className="px-4 py-2 text-left">Date</th>
                                              <th className="px-4 py-2 text-left">Category</th>
                                              <th className="px-4 py-2 text-right">Amount</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200 bg-white">
                                          {financials.expenses.slice(0, 20).map(exp => (
                                              <tr key={exp.id} className="break-inside-avoid">
                                                  <td className="px-4 py-2">{formatDate(exp.date)}</td>
                                                  <td className="px-4 py-2"><span className="bg-gray-100 text-xs px-2 py-1 rounded print:border print:border-gray-300">{exp.category}</span></td>
                                                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(exp.amount)}</td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          )}
      </div>
    </div>
  );
};

export default ReportsPage;