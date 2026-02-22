import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { PhotoIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { settingsService } from '../services/settingsService';

interface ImageUploadProps {
  label: string;
  value?: string;
  onChange: (val: string) => void;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ label, value, onChange, className }) => {
    const [uploading, setUploading] = useState(false);
    
    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setUploading(true);
        try {
            const base64 = await settingsService.uploadImage(file);
            onChange(base64);
            toast.success("Image uploaded successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to upload image");
        } finally {
            setUploading(false);
            // Reset input value to allow re-uploading same file if needed
            e.target.value = '';
        }
    };

    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <div className="flex items-center space-x-4">
                <div className="relative h-20 w-20 flex-shrink-0 bg-gray-100 rounded-md border border-gray-300 overflow-hidden flex items-center justify-center">
                    {value ? (
                        <img src={value} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                        <PhotoIcon className="h-8 w-8 text-gray-400" />
                    )}
                </div>
                <div>
                  <label className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sey-blue ${uploading ? 'opacity-50 cursor-wait' : ''}`}>
                      <CloudArrowUpIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                      <span>{uploading ? 'Uploading...' : 'Change Image'}</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFile} disabled={uploading} />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">JPG, PNG up to 2MB</p>
                </div>
            </div>
        </div>
    );
};