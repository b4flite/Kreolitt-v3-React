import React, { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { settingsService } from '../services/settingsService';
import { backupService } from '../services/backupService';
import { BusinessSettings } from '../types';
import { toast } from 'react-hot-toast';
import { ImageUpload } from '../components/ImageUpload';
import { 
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon, 
  CircleStackIcon, 
  BanknotesIcon, 
  DocumentTextIcon, 
  EnvelopeIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';

const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'financial' | 'system'>('general');

  const { data: settings, isLoading } = useQuery({ 
    queryKey: ['settings'], 
    queryFn: settingsService.getSettings 
  });

  const { register, handleSubmit, setValue, watch, reset } = useForm<BusinessSettings>();

  // Use useEffect to sync form state when data is loaded from Supabase
  useEffect(() => {
    if (settings) {
        reset(settings);
    }
  }, [settings, reset]);

  const settingsMutation = useMutation({
    mutationFn: settingsService.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      // Also invalidate financeStats since exchange rates might have changed
      queryClient.invalidateQueries({ queryKey: ['financeStats'] });
      toast.success("Business information updated successfully");
    },
    onError: (error: any) => {
      console.error("Settings Update Error:", error);
      toast.error(`Save failed: ${error.message || 'Check database connection'}`);
    }
  });

  const backupMutation = useMutation({
    mutationFn: backupService.createBackup,
    onSuccess: () => toast.success("Backup downloaded successfully"),
    onError: () => toast.error("Failed to generate backup")
  });

  const restoreMutation = useMutation({
    mutationFn: backupService.restoreBackup,
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("System restored successfully from backup");
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err: any) => toast.error(`Restore failed: ${err.message}`)
  });

  const currentHeroImage = watch("heroImageUrl");
  const currentLogoImage = watch("logoUrl");
  const currentLoginHeroImage = watch("loginHeroImageUrl");
  const currentVatRate = watch("vatRate");

  const onSubmit = (data: BusinessSettings) => {
    settingsMutation.mutate(data);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (window.confirm("WARNING: Restoring will overwrite existing data. Are you sure?")) {
        restoreMutation.mutate(file);
      } else {
        e.target.value = "";
      }
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

  const tabs = [
    { id: 'general', label: 'General Info' },
    { id: 'branding', label: 'Branding & Images' },
    { id: 'financial', label: 'Finance & Operations' },
    { id: 'system', label: 'System Backup' }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>
      
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id 
                  ? 'border-sey-blue text-sey-blue' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl">
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 animate-in fade-in">
                <div className="sm:col-span-4">
                  <label className="block text-sm font-medium text-gray-700">Business Name</label>
                  <input {...register("name")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-sey-blue focus:border-sey-blue" />
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-700">Tagline</label>
                  <input {...register("tagline")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-sey-blue focus:border-sey-blue" />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Email (Main Contact)</label>
                  <input {...register("email")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-sey-blue focus:border-sey-blue" />
                  <p className="text-xs text-gray-500 mt-1">This email will receive copies of booking confirmations.</p>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input {...register("phone")} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-sey-blue focus:border-sey-blue" />
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea {...register("address")} rows={2} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-sey-blue focus:border-sey-blue" />
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-sm font-medium text-gray-700">About Us</label>
                  <textarea {...register("about")} rows={4} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-sey-blue focus:border-sey-blue" />
                </div>
            </div>
          )}

          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="col-span-2"><h3 className="text-sm font-bold text-blue-900">Main Site Images</h3></div>
                  <ImageUpload 
                    label="Business Logo" 
                    value={currentLogoImage} 
                    onChange={(val) => setValue('logoUrl', val, { shouldDirty: true })} 
                  />
                  <ImageUpload 
                    label="Home Page Hero" 
                    value={currentHeroImage} 
                    onChange={(val) => setValue('heroImageUrl', val, { shouldDirty: true })} 
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Login Page CMS</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ImageUpload 
                        label="Login Background" 
                        value={currentLoginHeroImage} 
                        onChange={(val) => setValue('loginHeroImageUrl', val, { shouldDirty: true })} 
                      />
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700">Login Quote</label>
                              <textarea 
                                {...register("loginTitle")} 
                                rows={2}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-sey-blue focus:border-sey-blue text-sm" 
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700">Login Sub-message</label>
                              <input 
                                {...register("loginMessage")} 
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-sey-blue focus:border-sey-blue text-sm" 
                              />
                          </div>
                      </div>
                  </div>
                </div>
            </div>
          )}

          {/* Financial Tab */}
          {activeTab === 'financial' && (
             <div className="space-y-6 animate-in fade-in">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <div className="flex items-start mb-6">
                     <BanknotesIcon className="w-6 h-6 text-green-600 mr-3 mt-1" />
                     <div>
                        <h3 className="text-lg font-bold text-gray-900">Tax Settings</h3>
                        <p className="text-sm text-gray-500">VAT rates affect all invoice calculations.</p>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">VAT Rate (%)</label>
                        <div className="flex items-center">
                            <input 
                                type="number" 
                                step="0.1" 
                                value={currentVatRate ? Math.round(currentVatRate * 100 * 10) / 10 : 0}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setValue("vatRate", isNaN(val) ? 0 : val / 100, { shouldDirty: true });
                                }}
                                className="block w-24 border border-gray-300 rounded-md shadow-sm p-2 font-bold text-gray-900 focus:ring-sey-blue focus:border-sey-blue text-lg" 
                            />
                            <span className="ml-2 text-gray-500 font-medium">%</span>
                        </div>
                     </div>

                     <div className="bg-white p-4 rounded border border-gray-200">
                        <label className="flex items-start space-x-3 cursor-pointer">
                           <input 
                              type="checkbox" 
                              {...register("showVatBreakdown")} 
                              className="h-5 w-5 text-sey-blue border-gray-300 rounded mt-0.5" 
                           />
                           <div>
                              <span className="text-sm font-bold text-gray-900">Show Tax Breakdown on Invoices</span>
                              <p className="text-xs text-gray-500 mt-1">If unchecked, invoices show total price only.</p>
                           </div>
                        </label>
                     </div>
                  </div>
                </div>

                {/* Exchange Rates Section */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <div className="flex items-start mb-6">
                     <ArrowsRightLeftIcon className="w-6 h-6 text-sey-blue mr-3 mt-1" />
                     <div>
                        <h3 className="text-lg font-bold text-gray-900">Multi-Currency Exchange Rates</h3>
                        <p className="text-sm text-gray-500">Define how foreign currencies convert to SCR for dashboard statistics.</p>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Euro (EUR) Rate</label>
                        <div className="flex items-center gap-3">
                           <span className="text-sm font-bold text-gray-500 whitespace-nowrap">1 EUR =</span>
                           <input 
                              type="number" 
                              step="0.01" 
                              {...register("eurRate")}
                              className="flex-1 border border-gray-300 rounded-lg p-2.5 font-bold text-sey-blue text-xl focus:ring-sey-blue focus:border-sey-blue" 
                           />
                           <span className="text-sm font-bold text-gray-500">SCR</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 italic">* Used for revenue aggregation</p>
                     </div>

                     <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">US Dollar (USD) Rate</label>
                        <div className="flex items-center gap-3">
                           <span className="text-sm font-bold text-gray-500 whitespace-nowrap">1 USD =</span>
                           <input 
                              type="number" 
                              step="0.01" 
                              {...register("usdRate")}
                              className="flex-1 border border-gray-300 rounded-lg p-2.5 font-bold text-sey-blue text-xl focus:ring-sey-blue focus:border-sey-blue" 
                           />
                           <span className="text-sm font-bold text-gray-500">SCR</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 italic">* Used for revenue aggregation</p>
                     </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <div className="flex items-start mb-6">
                     <DocumentTextIcon className="w-6 h-6 text-sey-blue mr-3 mt-1" />
                     <div>
                        <h3 className="text-lg font-bold text-gray-900">Automation & Notifications</h3>
                        <p className="text-sm text-gray-500">Streamline your workflow and communications.</p>
                     </div>
                  </div>
                  
                   <div className="space-y-4">
                       <div className="bg-white p-4 rounded border border-gray-200">
                          <label className="flex items-start space-x-3 cursor-pointer">
                              <input 
                                type="checkbox" 
                                {...register("enableEmailNotifications")} 
                                className="h-5 w-5 text-sey-blue border-gray-300 rounded mt-0.5" 
                              />
                              <div>
                                <span className="text-sm font-bold text-gray-900 flex items-center">
                                    <EnvelopeIcon className="w-4 h-4 mr-1 text-gray-400" />
                                    Enable Email Notifications
                                </span>
                                <p className="text-xs text-gray-500 mt-1">
                                    If enabled, confirmation emails will be sent to the client upon booking. 
                                    A copy will also be sent to the main business email ({watch("email") || "not set"}).
                                </p>
                              </div>
                          </label>
                       </div>

                       <div className="bg-white p-4 rounded border border-gray-200">
                          <label className="flex items-start space-x-3 cursor-pointer">
                              <input 
                                type="checkbox" 
                                {...register("autoCreateInvoice")} 
                                className="h-5 w-5 text-sey-blue border-gray-300 rounded mt-0.5" 
                              />
                              <div>
                                <span className="text-sm font-bold text-gray-900">Auto-Generate Invoice on Confirmation</span>
                                <p className="text-xs text-gray-500 mt-1">When you change a booking status to CONFIRMED, an invoice will be created automatically using the booking amount.</p>
                              </div>
                          </label>
                       </div>
                   </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Invoice Payment Instructions</label>
                  <p className="text-xs text-gray-500 mb-2">Enter bank details, SWIFT codes, or payment terms here. This will appear at the bottom of all invoices.</p>
                  <textarea 
                      {...register("paymentInstructions")} 
                      rows={4} 
                      className="block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-sey-blue focus:border-sey-blue text-sm font-mono"
                      placeholder={"Bank Name: MCB Seychelles\nAccount Number: 00000000\nSWIFT: ..."}
                  />
                </div>
             </div>
          )}
          
          {/* System Tab */}
          {activeTab === 'system' && (
             <div className="animate-in fade-in">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                    <CircleStackIcon className="w-5 h-5 mr-2 text-sey-red" />
                    Database Maintenance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <h4 className="font-semibold text-gray-900 mb-2">Export Data</h4>
                      <button 
                          type="button"
                          onClick={() => backupMutation.mutate()} 
                          disabled={backupMutation.isPending}
                          className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50"
                      >
                          <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                          {backupMutation.isPending ? "Generating..." : "Download JSON"}
                      </button>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <h4 className="font-semibold text-gray-900 mb-2">Import Data</h4>
                      <label className={`w-full flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sey-red hover:bg-red-700 cursor-pointer ${restoreMutation.isPending ? 'opacity-50 cursor-wait' : ''}`}>
                          <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                          {restoreMutation.isPending ? "Restoring..." : "Restore from File"}
                          <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleRestoreFile} disabled={restoreMutation.isPending} />
                      </label>
                    </div>
                  </div>
                </div>
             </div>
          )}

          {activeTab !== 'system' && (
             <div className="flex justify-end pt-4 border-t border-gray-100">
                <button 
                  type="submit" 
                  disabled={settingsMutation.isPending}
                  className="bg-sey-blue text-white px-8 py-2.5 rounded-md hover:bg-blue-800 transition shadow-sm font-bold disabled:opacity-70 flex items-center"
                >
                  {settingsMutation.isPending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : "Save Changes"}
                </button>
             </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;