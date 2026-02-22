import React, { useState } from 'react';
import { useAuth } from '../services/authService';
import { useNavigate, Link } from 'react-router-dom';
import { UserRole, DEFAULT_HERO_IMAGE_URL } from '../types';
import { toast } from 'react-hot-toast';
import { Logo } from '../components/Logo';
import { useQuery } from '@tanstack/react-query';
import { settingsService } from '../services/settingsService';

type AuthView = 'login' | 'signup' | 'forgot';

const LoginPage: React.FC = () => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, signup, resetPassword } = useAuth();
  const navigate = useNavigate();

  // Fetch settings for dynamic content
  const { data: settings } = useQuery({ 
    queryKey: ['settings'], 
    queryFn: settingsService.getSettings 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Forgot Password Flow
    if (view === 'forgot') {
        if (!email) {
            toast.error("Please enter your email");
            return;
        }
        setIsSubmitting(true);
        try {
            await resetPassword(email);
            toast.success("Password reset email sent! Check your inbox.");
            setView('login');
        } catch (e: any) {
            toast.error(e.message || "Failed to send reset email");
        } finally {
            setIsSubmitting(false);
        }
        return;
    }

    // Login/Signup Validation
    if(!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (view === 'signup' && !name) {
      toast.error("Please enter your name");
      return;
    }

    setIsSubmitting(true);
    try {
      if (view === 'login') {
        const user = await login(email, password);
        toast.success(`Welcome back, ${user.name}!`);
        if(user.role === UserRole.CLIENT) {
          navigate('/portal');
        } else {
          navigate('/dashboard');
        }
      } else {
        await signup(email, password, name);
        toast.success("Account created successfully! Please sign in.");
        setView('login');
      }
    } catch (e: any) {
      toast.error(e.message || (view === 'login' ? "Login failed" : "Signup failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const heroImage = settings?.loginHeroImageUrl || DEFAULT_HERO_IMAGE_URL;
  const heroTitle = settings?.loginTitle || "Experience the Seychelles with the comfort and reliability you deserve.";
  const heroMessage = settings?.loginMessage || "Manage your transfers, tours, and itinerary all in one place.";

  const getTitle = () => {
      switch(view) {
          case 'login': return 'Welcome back';
          case 'signup': return 'Create an account';
          case 'forgot': return 'Reset Password';
      }
  };

  const getSubtitle = () => {
      switch(view) {
          case 'login': return 'Please enter your details to sign in.';
          case 'signup': return 'Join us to book and manage your trips.';
          case 'forgot': return 'Enter your email to receive a reset link.';
      }
  };

  const getButtonText = () => {
      if (isSubmitting) return 'Processing...';
      switch(view) {
          case 'login': return 'Sign in';
          case 'signup': return 'Create Account';
          case 'forgot': return 'Send Reset Link';
      }
  };

  return (
    <div className="min-h-screen flex bg-white">
      
      {/* Left Column - Hero Image */}
      <div className={`hidden lg:flex lg:w-1/2 relative overflow-hidden ${!heroImage ? 'bg-blue-50' : 'bg-gray-900'}`}>
        {heroImage && (
            <>
            <img 
            src={heroImage} 
            alt="Seychelles Beach" 
            className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-sey-blue/90 via-sey-blue/40 to-transparent"></div>
            </>
        )}
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full h-full">
           <Link to="/" className="inline-block">
             <Logo lightText={!!heroImage} className="h-12" />
           </Link>
           
           <div className="max-w-md">
              <blockquote className={`text-3xl font-bold mb-6 leading-tight ${heroImage ? 'text-white' : 'text-sey-blue'}`}>
                "{heroTitle}"
              </blockquote>
              <p className={`text-lg ${heroImage ? 'text-blue-100' : 'text-gray-600'}`}>
                {heroMessage}
              </p>
           </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-gray-50 lg:bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96">
           
           {/* Mobile Logo */}
           <div className="lg:hidden mb-10 text-center">
             <Link to="/">
               <Logo className="h-10 mx-auto" />
             </Link>
           </div>
           
           <div className="mb-8">
             <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
               {getTitle()}
             </h2>
             <p className="mt-2 text-sm text-gray-600">
               {getSubtitle()}
               {view === 'login' && (
                 <>
                   <br/>
                   <span className="text-xs text-gray-400">Secure access to your booking portal.</span>
                 </>
               )}
             </p>
           </div>

           <form className="space-y-6" onSubmit={handleSubmit}>
              
              {view === 'signup' && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                  <div className="mt-1">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sey-blue focus:border-sey-blue sm:text-sm transition-colors"
                      placeholder="e.g. Jane Doe"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sey-blue focus:border-sey-blue sm:text-sm transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {view !== 'forgot' && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete={view === 'login' ? "current-password" : "new-password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sey-blue focus:border-sey-blue sm:text-sm transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              {view === 'login' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-sey-blue focus:ring-sey-blue border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <button type="button" className="font-medium text-sey-blue hover:text-blue-800" onClick={() => setView('forgot')}>
                      Forgot your password?
                    </button>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-sey-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sey-blue transition-all ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {getButtonText()}
                </button>
              </div>
           </form>

           <div className="mt-8">
             <div className="relative">
               <div className="absolute inset-0 flex items-center">
                 <div className="w-full border-t border-gray-300" />
               </div>
               <div className="relative flex justify-center text-sm">
                 <span className="px-2 bg-gray-50 lg:bg-white text-gray-500">
                    {view === 'login' && 'New to Kreol Tours?'}
                    {view === 'signup' && 'Already have an account?'}
                    {view === 'forgot' && 'Remember your password?'}
                 </span>
               </div>
             </div>

             <div className="mt-6">
                {view === 'login' && (
                    <button
                        type="button"
                        onClick={() => { setView('signup'); setEmail(''); setPassword(''); setName(''); }}
                        className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sey-blue transition-colors"
                    >
                        Sign up for free
                    </button>
                )}
                {(view === 'signup' || view === 'forgot') && (
                    <button
                        type="button"
                        onClick={() => { setView('login'); setEmail(''); setPassword(''); setName(''); }}
                        className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sey-blue transition-colors"
                    >
                        Sign in to your account
                    </button>
                )}
             </div>
           </div>
           
           <div className="mt-8 text-center">
             <Link to="/" className="text-sm text-gray-400 hover:text-gray-900 transition-colors">
               &larr; Back to Home
             </Link>
           </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;