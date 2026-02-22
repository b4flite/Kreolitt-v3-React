import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authService';
import { toast } from 'react-hot-toast';
import { Logo } from '../components/Logo';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { LoadingScreen } from '../components/LoadingScreen';

const UpdatePasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { updatePassword, user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated (Security Guard)
  // Logic: Supabase processes the hash fragment first, then updates auth state.
  // We wait for isLoading to settle. If no user then, redirect to login.
  useEffect(() => {
    if (!isLoading && !user) {
        toast.error("Session expired or invalid. Please request a new reset link.");
        navigate('/login');
    }
  }, [isLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(password);
      toast.success("Password updated successfully! Redirecting...");
      setTimeout(() => {
          navigate('/dashboard'); 
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
      return <LoadingScreen />;
  }

  if (!user) return null; // Prevent flash of content before redirect

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <Logo className="h-12 mx-auto mb-6" />
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
             <LockClosedIcon className="h-6 w-6 text-sey-blue" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Set New Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Please enter a new secure password for <span className="font-bold">{user.email}</span>.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">New Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-sey-blue focus:border-sey-blue focus:z-10 sm:text-sm"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-sey-blue focus:border-sey-blue focus:z-10 sm:text-sm"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-sey-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sey-blue transition-all ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePasswordPage;