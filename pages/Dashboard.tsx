import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import { financeService } from '../services/financeService';
import { BookingStatus } from '../types';
import { StatCard } from '../components/StatCard';
import { formatCurrency, formatDateTime } from '../lib/utils';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Fetch only first 5 for recent activity
  const { data: recentBookingsData } = useQuery({ 
      queryKey: ['bookings', 'recent'], 
      queryFn: () => bookingService.getBookings(1, 5) 
  });
  const recentBookings = recentBookingsData?.data;

  // Optimized stats query
  const { data: bookingStats } = useQuery({
      queryKey: ['bookingStats'],
      queryFn: bookingService.getBookingStats
  });

  const { data: financeStats } = useQuery({ queryKey: ['financeStats'], queryFn: financeService.getStats });

  const pendingCount = bookingStats?.pending || 0;
  const confirmedCount = bookingStats?.confirmed || 0;

  return (
    <div>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-display font-extrabold text-island-navy tracking-tight">Concierge Desk</h1>
          <p className="text-island-muted mt-2 font-medium">Overview of today's business performance</p>
        </div>
        <div className="hidden md:block text-xs font-bold text-island-muted/60 uppercase tracking-widest bg-white/50 backdrop-blur px-4 py-2 rounded-full border border-white/50 shadow-sm">
           Last updated: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          title="Pending Requests" 
          value={pendingCount} 
          color="#F59E0B" // Island Gold
          description="Requires immediate attention"
          onClick={() => navigate('/bookings')}
          actionText="Review List"
        />
        <StatCard 
          title="Confirmed Itineraries" 
          value={confirmedCount} 
          color="#003D88" // Sey Blue
          description="Active upcoming trips"
          onClick={() => navigate('/bookings')}
          actionText="Manage Schedule"
        />
        <StatCard 
          title="Est. Revenue" 
          value={formatCurrency(financeStats?.totalRevenue)} 
          color="#059669" // Palm Green
          description="Gross revenue for period"
          onClick={() => navigate('/finances')}
          actionText="View Financials"
        />
        <StatCard 
          title="VAT Net Position" 
          value={formatCurrency(financeStats?.vatPayable)} 
          color={financeStats?.vatPayable && financeStats.vatPayable > 0 ? "#E11D48" : "#059669"} 
          description={financeStats?.vatPayable && financeStats.vatPayable < 0 ? "Credit with SRC" : "Payable to SRC"}
          onClick={() => navigate('/finances')}
          actionText="Tax Report"
        />
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-island-sand overflow-hidden">
        <div className="flex justify-between items-center px-8 py-6 border-b border-island-sand">
          <h2 className="text-xl font-display font-bold text-island-navy">Recent Activity</h2>
          <button 
            onClick={() => navigate('/bookings')}
            className="text-sm font-bold text-sey-blue bg-sey-blue/5 hover:bg-sey-blue/10 px-4 py-2 rounded-full transition-colors"
          >
            View All Bookings
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-island-sand">
            <thead className="bg-island-sand/30">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] font-black text-island-muted uppercase tracking-widest">Client Details</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-island-muted uppercase tracking-widest">Service Type</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-island-muted uppercase tracking-widest">Pickup Date</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-island-muted uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-island-sand/50">
              {recentBookings?.map((booking) => (
                <tr 
                  key={booking.id} 
                  className="hover:bg-island-sand/20 transition-colors cursor-pointer group"
                  onClick={() => navigate('/bookings')}
                >
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="text-sm font-bold text-island-navy group-hover:text-sey-blue transition-colors font-display">{booking.clientName}</div>
                    <div className="text-xs text-island-muted/70 font-mono mt-1 tracking-wide">{bookingService.formatBookingRef(booking.id)}</div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-sm text-island-muted font-medium capitalize flex items-center">
                     <span className="w-2 h-2 rounded-full bg-island-gold mr-2"></span>
                     {booking.serviceType.toLowerCase()}
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-sm text-island-muted font-medium">
                    {new Date(booking.pickupTime).toLocaleDateString()}
                    <span className="text-xs text-island-muted/60 block mt-0.5">{new Date(booking.pickupTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-4 font-bold rounded-full border 
                      ${booking.status === BookingStatus.CONFIRMED ? 'bg-green-50 text-green-700 border-green-100' : 
                        booking.status === BookingStatus.PENDING ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!recentBookings || recentBookings.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center text-island-muted text-sm font-medium">
                    No recent activity found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;