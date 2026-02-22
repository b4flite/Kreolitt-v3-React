import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { settingsService } from '../services/settingsService';
import { Advert } from '../types';
import { toast } from 'react-hot-toast';
import { TrashIcon, PlusIcon, PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ImageUpload } from '../components/ImageUpload';

const AdvertsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingAdvert, setEditingAdvert] = useState<Advert | null>(null);

  const { data: adverts, isLoading } = useQuery({ 
    queryKey: ['adverts'], 
    queryFn: settingsService.getAdverts 
  });
  
  const addAdvertMutation = useMutation({
    mutationFn: settingsService.addAdvert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adverts'] });
      toast.success("Advert added");
      resetForm();
    }
  });

  const updateAdvertMutation = useMutation({
    mutationFn: settingsService.updateAdvert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adverts'] });
      toast.success("Advert updated");
      resetForm();
    }
  });

  const deleteAdvertMutation = useMutation({
    mutationFn: settingsService.deleteAdvert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adverts'] });
      toast.success("Advert deleted");
    }
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm<Advert>();
  const currentImage = watch('imageUrl');

  const resetForm = () => {
    reset({
        title: '',
        description: '',
        price: '',
        imageUrl: ''
    });
    setEditingAdvert(null);
  };

  const handleEdit = (ad: Advert) => {
    setEditingAdvert(ad);
    reset(ad);
  };

  const onSubmit = (data: Advert) => {
    if(!data.imageUrl) {
        toast.error("Image is required");
        return;
    }

    if (editingAdvert) {
        updateAdvertMutation.mutate({ ...data, id: editingAdvert.id });
    } else {
        addAdvertMutation.mutate({ ...data, active: true });
    }
  };

  if (isLoading) return <div>Loading offers...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Adverts & Offers</h1>
      <p className="text-gray-500 mb-6">Manage special offers and featured experiences displayed on the home page.</p>

      <div className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow space-y-6 border-t-4 border-sey-blue">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-lg font-medium">
                {editingAdvert ? 'Edit Advert' : 'Add New Advert'}
            </h3>
            {editingAdvert && (
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 flex items-center text-sm font-medium"
                >
                    <XMarkIcon className="w-4 h-4 mr-1" /> Cancel Edit
                </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="col-span-2 md:col-span-1 space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Title</label>
                    <input {...register("title", {required: true})} placeholder="Experience Title" className="w-full border p-2 rounded focus:ring-sey-blue focus:border-sey-blue" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Price Label</label>
                    <input {...register("price")} placeholder="e.g., SCR 1500" className="w-full border p-2 rounded focus:ring-sey-blue focus:border-sey-blue" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Description</label>
                    <textarea {...register("description", {required: true})} placeholder="What's included in this offer?" rows={4} className="w-full border p-2 rounded focus:ring-sey-blue focus:border-sey-blue" />
                </div>
             </div>
             
             <div className="col-span-2 md:col-span-1">
                <ImageUpload 
                  label="Advert Image" 
                  value={currentImage} 
                  onChange={(val) => setValue('imageUrl', val, { shouldDirty: true })} 
                />
             </div>
          </div>
          
          <button 
            type="submit" 
            disabled={addAdvertMutation.isPending || updateAdvertMutation.isPending}
            className="flex items-center bg-sey-blue text-white px-6 py-2.5 rounded-lg hover:bg-blue-800 transition shadow-md font-bold disabled:opacity-50"
          >
            {editingAdvert ? (
                <>
                    <PencilSquareIcon className="w-5 h-5 mr-2" />
                    {updateAdvertMutation.isPending ? "Updating..." : "Update Advert"}
                </>
            ) : (
                <>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    {addAdvertMutation.isPending ? "Adding..." : "Add Advert"}
                </>
            )}
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adverts?.map(ad => (
            <div key={ad.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex space-x-4 hover:shadow-md transition">
              <img src={ad.imageUrl} alt={ad.title} className="w-24 h-24 object-cover rounded-lg bg-gray-100 shadow-inner" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 truncate">{ad.title}</h4>
                <p className="text-sm text-sey-blue font-bold">{ad.price || 'Contact for price'}</p>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{ad.description}</p>
              </div>
              <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => handleEdit(ad)} 
                    className="p-2 text-gray-400 hover:text-sey-blue transition"
                    title="Edit Advert"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                        if(window.confirm('Delete this advert?')) deleteAdvertMutation.mutate(ad.id);
                    }} 
                    className="p-2 text-gray-400 hover:text-red-500 transition" 
                    title="Delete"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
              </div>
            </div>
          ))}
          {(!adverts || adverts.length === 0) && (
              <p className="text-gray-500 italic col-span-2 text-center py-12 bg-white rounded-lg border border-dashed border-gray-200">
                  No active adverts found.
              </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvertsPage;