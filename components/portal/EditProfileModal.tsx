import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { XMarkIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { User } from '../../types';

interface EditProfileModalProps {
    user: User | null;
    onClose: () => void;
    onUpdate: (data: any) => Promise<void>;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onUpdate }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { register, handleSubmit, formState: { isSubmitting } } = useForm({
        defaultValues: {
            name: user?.name || '',
            phone: user?.phone || '',
            company: user?.company || '',
            address: user?.address || ''
        }
    });

    const onSubmit = async (data: any) => {
        if (newPassword) {
            if (newPassword !== confirmPassword) {
                return;
            }
            data.password = newPassword;
        }
        await onUpdate(data);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Edit Profile</h3>
                    <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-gray-400" /></button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input {...register("name")} className="w-full border p-2.5 rounded-lg text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input {...register("phone")} className="w-full border p-2.5 rounded-lg text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company / Business Name</label>
                        <input {...register("company")} className="w-full border p-2.5 rounded-lg text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <textarea {...register("address")} rows={2} className="w-full border p-2.5 rounded-lg text-sm" />
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                        <h4 className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                            <LockClosedIcon className="w-3 h-3 mr-1" /> Security
                        </h4>
                        <div className="space-y-3">
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full border p-2.5 rounded-lg text-sm"
                                placeholder="New Password"
                            />
                            {newPassword && (
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full border p-2.5 rounded-lg text-sm"
                                    placeholder="Confirm Password"
                                />
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm text-white bg-sey-blue rounded-lg">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
