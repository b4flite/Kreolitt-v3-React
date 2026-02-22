import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { bookingService } from '../services/bookingService';
import { financeService } from '../services/financeService';
import { settingsService } from '../services/settingsService';
import { userService } from '../services/userService';
import { useAuth } from '../services/authService';
import { Invoice } from '../types';

// Modular Components
import {
    PortalHeader,
    BookingList,
    InvoiceModal,
    EditProfileModal
} from '../components/portal';

const ClientPortal: React.FC = () => {
    const { user, refreshUser, updatePassword } = useAuth();
    const queryClient = useQueryClient();
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Self-healing: Sync legacy/guest bookings on load
    useEffect(() => {
        if (user) {
            bookingService.syncUserBookings().then(() => {
                queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            });
        }
    }, [user, queryClient]);

    const handleManualSync = async () => {
        setIsSyncing(true);
        try {
            await bookingService.syncUserBookings();
            await queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            toast.success("Account synced");
        } catch (err) {
            toast.error("Sync failed");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleProfileUpdate = async (data: any) => {
        try {
            if (data.password) {
                await updatePassword(data.password);
                toast.success("Password updated");
            }
            await userService.updateUserProfile(user!.id, data);
            await refreshUser();
            toast.success("Profile updated");
            setIsEditingProfile(false);
        } catch (err: any) {
            toast.error(`Update failed: ${err.message}`);
        }
    };

    // Fetch Bookings
    const { data: bookings, isLoading: bookingsLoading } = useQuery({
        queryKey: ['my-bookings', user?.id, user?.email],
        queryFn: () => bookingService.getClientBookings(user?.id || '', user?.email),
        enabled: !!user
    });

    // Fetch Invoices
    const { data: invoices, isLoading: invoicesLoading } = useQuery({
        queryKey: ['my-invoices'],
        queryFn: () => financeService.getClientInvoices(),
        enabled: !!user
    });

    // Fetch Business Settings for Invoice Header
    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: settingsService.getSettings,
        staleTime: 60 * 60 * 1000 // 1 hour
    });

    if (bookingsLoading || invoicesLoading) return <div className="p-8 text-center text-gray-500">Loading your trips...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <PortalHeader
                user={user}
                onEditProfile={() => setIsEditingProfile(true)}
            />

            <BookingList
                bookings={bookings || []}
                invoices={invoices || []}
                isSyncing={isSyncing}
                onManualSync={handleManualSync}
                onViewInvoice={setSelectedInvoice}
            />

            {isEditingProfile && (
                <EditProfileModal
                    user={user}
                    passwordOnly={true}
                    onClose={() => setIsEditingProfile(false)}
                    onUpdate={handleProfileUpdate}
                />
            )}

            {selectedInvoice && (
                <InvoiceModal
                    invoice={selectedInvoice}
                    settings={settings}
                    onClose={() => setSelectedInvoice(null)}
                />
            )}
        </div>
    );
};

export default ClientPortal;