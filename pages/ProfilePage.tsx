import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/authService';
import { userService } from '../services/userService';
import { toast } from 'react-hot-toast';
import { Header } from '../components/Header';
import {
    UserCircleIcon,
    MapPinIcon,
    BuildingOfficeIcon,
    GlobeAltIcon,
    IdentificationIcon,
    PhoneIcon,
    EnvelopeIcon,
    ChevronLeftIcon
} from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        address: user?.address || '',
        company: user?.company || '',
        nationality: user?.nationality || '',
        vatNumber: user?.vatNumber || ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                address: user.address || '',
                company: user.company || '',
                nationality: user.nationality || '',
                vatNumber: user.vatNumber || ''
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSaving(true);
        try {
            await userService.updateUserProfile(user.id, formData);
            await refreshUser();
            toast.success("Profile updated successfully!");
        } catch (error: any) {
            toast.error(error.message || "Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-1 py-12 px-6">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-8 flex items-center text-gray-500 hover:text-sey-blue transition-colors group"
                    >
                        <ChevronLeftIcon className="w-5 h-5 mr-1 transform group-hover:-translate-x-1 transition-transform" />
                        Back to Bookings
                    </button>

                    <div className="mb-10">
                        <h1 className="text-3xl font-bold text-gray-900">Account Profile</h1>
                        <p className="mt-2 text-gray-600 font-medium">Manage your personal information and invoicing details.</p>
                    </div>

                    <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl overflow-hidden border border-gray-100">
                        <div className="p-8 md:p-10">
                            <form onSubmit={handleSubmit} className="space-y-10">
                                {/* Basic Info */}
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center mb-8">
                                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mr-4 text-sey-blue border border-blue-100">
                                            <UserCircleIcon className="w-6 h-6" />
                                        </div>
                                        Personal Particulars
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Display Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sey-blue/20 focus:border-sey-blue outline-none transition-all placeholder:text-gray-400 font-medium"
                                                placeholder="Full Name"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Account Email</label>
                                            <div className="flex items-center w-full p-3.5 bg-gray-100/50 border border-gray-100 rounded-xl text-gray-500 font-medium italic">
                                                <EnvelopeIcon className="w-5 h-5 mr-3 text-gray-400" />
                                                {user?.email}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Primary Phone</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <PhoneIcon className="w-5 h-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className="w-full pl-11 p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sey-blue/20 focus:border-sey-blue outline-none transition-all placeholder:text-gray-400 font-medium"
                                                    placeholder="+248 ..."
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Nationality</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    name="nationality"
                                                    value={formData.nationality}
                                                    onChange={handleChange}
                                                    className="w-full pl-11 p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sey-blue/20 focus:border-sey-blue outline-none transition-all placeholder:text-gray-400 font-medium"
                                                    placeholder="e.g. Seychellois"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100 w-full"></div>

                                {/* Location/Address */}
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center mb-8">
                                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mr-4 text-sey-blue border border-blue-100">
                                            <MapPinIcon className="w-6 h-6" />
                                        </div>
                                        Preferred Address
                                    </h2>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Billing/Secondary Address</label>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sey-blue/20 focus:border-sey-blue outline-none transition-all placeholder:text-gray-400 font-medium resize-none"
                                            placeholder="Enter your full business or residence address..."
                                        />
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100 w-full"></div>

                                {/* Business Info */}
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center mb-8">
                                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mr-4 text-sey-blue border border-blue-100">
                                            <BuildingOfficeIcon className="w-6 h-6" />
                                        </div>
                                        Company Details
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Legal Company Name</label>
                                            <input
                                                type="text"
                                                name="company"
                                                value={formData.company}
                                                onChange={handleChange}
                                                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sey-blue/20 focus:border-sey-blue outline-none transition-all placeholder:text-gray-400 font-medium"
                                                placeholder="Business Name (Optional)"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">VAT / Tax ID</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <IdentificationIcon className="w-5 h-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    name="vatNumber"
                                                    value={formData.vatNumber}
                                                    onChange={handleChange}
                                                    className="w-full pl-11 p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sey-blue/20 focus:border-sey-blue outline-none transition-all placeholder:text-gray-400 font-medium"
                                                    placeholder="Tax Reference"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end pt-6">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="bg-sey-blue hover:bg-blue-800 text-white font-bold py-4 px-12 rounded-full shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center min-w-[200px]"
                                    >
                                        {isSaving ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Updating...
                                            </>
                                        ) : 'Save Account Settings'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
