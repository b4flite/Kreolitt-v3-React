import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../services/bookingService';
import { financeService } from '../services/financeService';
import { Booking, BookingStatus } from '../types';
import { toast } from 'react-hot-toast';
import {
    CalendarIcon, MapPinIcon, TruckIcon, ListBulletIcon,
    Squares2X2Icon, CalendarDaysIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon,
    ClockIcon, CheckCircleIcon, XCircleIcon, StopIcon, TicketIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatCurrency } from '../lib/utils';
import { BookingFormModal } from '../components/BookingFormModal';
import { BookingDetailPanel } from '../components/bookings/BookingDetailPanel';
import { BookingConfirmationModal } from '../components/bookings/BookingConfirmationModal';

// --- STAMP STYLE STATUS BADGE ---
const RenderStatusStamp = ({ status }: { status: BookingStatus }) => {
    const styles = {
        [BookingStatus.CONFIRMED]: 'border-island-green text-island-green bg-island-green/10',
        [BookingStatus.PENDING]: 'border-island-gold text-island-gold bg-island-gold/10',
        [BookingStatus.CANCELLED]: 'border-island-terra text-island-terra bg-island-terra/10',
        [BookingStatus.COMPLETED]: 'border-sey-blue text-sey-blue bg-sey-blue/10',
    };

    return (
        <div className={`px-2 py-1 rounded-lg border-2 border-dashed text-[10px] font-black uppercase tracking-widest transform -rotate-2 ${styles[status]}`}>
            {status}
        </div>
    );
};

// --- TICKET CARD COMPONENT ---
const TicketCard: React.FC<{ booking: Booking; onClick: () => void }> = ({ booking, onClick }) => (
    <div onClick={onClick} className="bg-white rounded-2xl border border-island-sand p-4 cursor-pointer hover:shadow-md transition-all">
        <div className="flex justify-between items-start mb-3">
            <div>
                <h4 className="font-bold text-island-navy">{booking.clientName}</h4>
                <span className="text-[10px] text-island-muted">{bookingService.formatBookingRef(booking.id)}</span>
            </div>
            <div className="bg-island-sand px-2 py-0.5 rounded text-xs font-bold">
                {formatCurrency(booking.amount, booking.currency)}
            </div>
        </div>
        <div className="text-xs text-island-muted mb-3">
            {booking.pickupLocation} &rarr; {booking.dropoffLocation}
        </div>
        <div className="flex justify-between items-center border-t border-dashed pt-3">
            <span className="text-[10px]">{formatDate(booking.pickupTime)}</span>
            <RenderStatusStamp status={booking.status} />
        </div>
    </div>
);

// --- KANBAN BOARD VIEW ---
const BoardView: React.FC<{ bookings: Booking[], onSelect: (b: Booking) => void }> = ({ bookings, onSelect }) => {
    const columns = [
        { id: BookingStatus.PENDING, label: 'Pending', icon: ClockIcon, color: 'text-island-gold' },
        { id: BookingStatus.CONFIRMED, label: 'Confirmed', icon: CheckCircleIcon, color: 'text-island-green' },
        { id: BookingStatus.COMPLETED, label: 'Completed', icon: StopIcon, color: 'text-sey-blue' },
        { id: BookingStatus.CANCELLED, label: 'Cancelled', icon: XCircleIcon, color: 'text-island-terra' },
    ];

    const getColumnBookings = (status: BookingStatus) => bookings.filter(b => b.status === status);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 h-full overflow-x-auto pb-4 items-start">
            {columns.map(col => {
                const colBookings = getColumnBookings(col.id as BookingStatus);
                const Icon = col.icon;
                return (
                    <div key={col.id} className="flex flex-col h-full min-w-[280px]">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg bg-white shadow-sm ${col.color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h3 className="font-display font-bold text-island-navy tracking-wide">{col.label}</h3>
                            </div>
                            <span className="bg-island-sand px-2.5 py-0.5 rounded-full text-xs font-bold text-island-muted shadow-inner">
                                {colBookings.length}
                            </span>
                        </div>

                        <div className="flex-1 space-y-4">
                            {colBookings.map(booking => (
                                <TicketCard key={booking.id} booking={booking} onClick={() => onSelect(booking)} />
                            ))}
                            {colBookings.length === 0 && (
                                <div className="text-center py-12 rounded-2xl border-2 border-dashed border-island-sand text-island-muted/50 text-sm font-medium">
                                    No {col.label.toLowerCase()} items
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// --- LIST VIEW (Refined) ---
const ListView: React.FC<{ bookings: Booking[], onSelect: (b: Booking) => void }> = ({ bookings, onSelect }) => (
    <div className="bg-white border border-island-sand rounded-2xl divide-y">
        {bookings.map(b => (
            <div key={b.id} onClick={() => onSelect(b)} className="p-4 flex justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                <div>
                    <div className="font-bold text-island-navy">{b.clientName}</div>
                    <div className="text-xs text-island-muted">{b.pickupLocation} &rarr; {b.dropoffLocation}</div>
                </div>
                <div className="text-right">
                    <div className="font-bold text-island-navy">{formatCurrency(b.amount, b.currency)}</div>
                    <div className="text-[10px] text-island-muted uppercase font-black">{formatDate(b.pickupTime)}</div>
                </div>
            </div>
        ))}
        {bookings?.length === 0 && <div className="text-center py-12 text-island-muted italic">No bookings found.</div>}
    </div>
);

type ViewMode = 'list' | 'board' | 'calendar';

const BookingsList: React.FC = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<ViewMode>('board');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [confirmingBooking, setConfirmingBooking] = useState<Booking | null>(null);
    const [page, setPage] = useState(1);
    const pageSize = 50;
    const [isCreating, setIsCreating] = useState(false);

    // Data Fetching
    const { data: result, isLoading } = useQuery({
        queryKey: ['bookings', page],
        queryFn: () => bookingService.getBookings(page, pageSize),
        placeholderData: (prev) => prev
    });
    const bookings = result?.data || [];
    const totalCount = result?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // New query for selected booking invoice
    const { data: selectedInvoice } = useQuery({
        queryKey: ['invoice', selectedBooking?.id],
        queryFn: () => financeService.getInvoiceByBookingId(selectedBooking!.id),
        enabled: !!selectedBooking
    });

    // Mutations (Same as before)
    const statusMutation = useMutation({
        mutationFn: ({ id, status, price }: { id: string; status: BookingStatus; price?: number }) => bookingService.updateStatus(id, status, price),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            toast.success(`Status updated to ${variables.status}`);
            if (selectedBooking && selectedBooking.id === variables.id) {
                setSelectedBooking({ ...selectedBooking, status: variables.status, amount: variables.price ?? selectedBooking.amount });
            }
            setConfirmingBooking(null);
        }
    });

    const updateDetailsMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Booking> }) => bookingService.updateBookingDetails(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            toast.success("Booking details saved");
            if (selectedBooking && selectedBooking.id === variables.id) {
                setSelectedBooking({ ...selectedBooking, ...variables.data });
            }
        }
    });

    const deleteBookingMutation = useMutation({
        mutationFn: bookingService.deleteBooking,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            toast.success("Booking deleted");
            setSelectedBooking(null);
        },
        onError: (err: any) => toast.error("Failed to delete: " + err.message)
    });

    const generateInvoiceMutation = useMutation({
        mutationFn: (b: Booking) => financeService.createInvoiceFromBooking(b),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            toast.success("Invoice generated successfully");
            navigate('/finances', { state: { openInvoiceId: data.id } });
        },
        onError: () => toast.error("Failed to generate invoice")
    });

    if (isLoading) return <div className="text-center py-20 text-island-muted animate-pulse font-display">Loading itineraries...</div>;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-island-navy tracking-tight">Itinerary Board</h1>
                    <div className="text-sm text-island-muted mt-1 font-medium"><span className="text-island-navy font-bold">{totalCount}</span> active bookings managed</div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="flex bg-white rounded-xl shadow-sm p-1 border border-island-sand w-full sm:w-auto">
                        <button onClick={() => setViewMode('list')} className={`flex-1 sm:flex-none p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-sey-blue text-white shadow-md' : 'text-island-muted hover:bg-island-sand'}`} title="List View"><ListBulletIcon className="w-5 h-5 mx-auto" /></button>
                        <button onClick={() => setViewMode('board')} className={`flex-1 sm:flex-none p-2 rounded-lg transition-all ${viewMode === 'board' ? 'bg-sey-blue text-white shadow-md' : 'text-island-muted hover:bg-island-sand'}`} title="Board View"><Squares2X2Icon className="w-5 h-5 mx-auto" /></button>
                        <button onClick={() => setViewMode('calendar')} className={`flex-1 sm:flex-none p-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-sey-blue text-white shadow-md' : 'text-island-muted hover:bg-island-sand'}`} title="Calendar View"><CalendarDaysIcon className="w-5 h-5 mx-auto" /></button>
                    </div>
                    <button onClick={() => setIsCreating(true)} className="w-full sm:w-auto flex items-center justify-center bg-island-navy text-white px-6 py-2.5 rounded-xl hover:bg-black transition-all shadow-lg shadow-island-navy/20 font-bold font-display"><PlusIcon className="w-5 h-5 mr-2" />New Booking</button>
                </div>
            </div>

            <div className="min-h-[500px]">
                {viewMode === 'list' ? <ListView bookings={bookings} onSelect={setSelectedBooking} /> :
                    viewMode === 'board' ? <BoardView bookings={bookings} onSelect={setSelectedBooking} /> :
                        <div className="text-center py-20 bg-white rounded-3xl border border-island-sand shadow-sm text-island-muted font-display">Calendar View Coming Soon</div>}
            </div>

            {viewMode === 'list' && totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 bg-white p-3 rounded-2xl border border-island-sand shadow-sm">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center px-4 py-2 text-sm font-medium text-island-navy bg-white border border-island-sand rounded-xl hover:bg-island-sand disabled:opacity-50">
                        <ChevronLeftIcon className="w-4 h-4 mr-2" /> Previous
                    </button>
                    <span className="text-sm text-island-muted font-medium">Page <span className="font-bold text-island-navy">{page}</span> of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex items-center px-4 py-2 text-sm font-medium text-island-navy bg-white border border-island-sand rounded-xl hover:bg-island-sand disabled:opacity-50">
                        Next <ChevronRightIcon className="w-4 h-4 ml-2" />
                    </button>
                </div>
            )}

            {confirmingBooking && (
                <BookingConfirmationModal
                    booking={confirmingBooking}
                    isProcessing={statusMutation.isPending}
                    onCancel={() => setConfirmingBooking(null)}
                    onConfirm={(price) => statusMutation.mutate({ id: confirmingBooking.id, status: BookingStatus.CONFIRMED, price })}
                />
            )}

            {isCreating && (
                <BookingFormModal onClose={() => setIsCreating(false)} />
            )}

            {selectedBooking && (
                <BookingDetailPanel
                    booking={selectedBooking}
                    invoice={selectedInvoice}
                    onClose={() => setSelectedBooking(null)}
                    onDelete={(id) => deleteBookingMutation.mutate(id)}
                    onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
                    onInitiateConfirmation={setConfirmingBooking}
                    onGenerateInvoice={(b) => generateInvoiceMutation.mutate(b)}
                    onSaveEdit={(id, data) => updateDetailsMutation.mutate({ id, data })}
                />
            )}
        </div>
    );
};

export default BookingsList;