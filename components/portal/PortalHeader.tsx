import React from 'react';
import { UserIcon } from '@heroicons/react/24/outline';
import { User } from '../../types';
import { Link } from 'react-router-dom';

interface PortalHeaderProps {
    user: User | null;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({ user }) => {
    return (
        <div className="bg-white shadow rounded-lg p-6 border-t-4 border-sey-yellow flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">My Bookings</h1>
                <p className="text-gray-600">
                    Welcome back, <span className="font-bold text-sey-blue">{user?.name}</span>
                    {user?.company && <span className="text-gray-400 font-medium"> @ {user.company}</span>}.
                </p>
            </div>
            <Link
                to="/portal/profile"
                className="mt-4 md:mt-0 flex items-center text-sm font-bold text-gray-500 hover:text-sey-blue bg-gray-50 hover:bg-blue-50 px-5 py-2.5 rounded-xl transition-all border border-gray-100 hover:border-blue-100 shadow-sm"
            >
                <UserIcon className="w-4 h-4 mr-2" /> Edit Profile
            </Link>
        </div>
    );
};
