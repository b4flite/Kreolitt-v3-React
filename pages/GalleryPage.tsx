import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { settingsService } from '../services/settingsService';
import { GalleryImage } from '../types';
import { toast } from 'react-hot-toast';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { ImageUpload } from '../components/ImageUpload';

const GalleryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: gallery, isLoading } = useQuery({ queryKey: ['gallery'], queryFn: settingsService.getGallery });
  
  const addGalleryMutation = useMutation({
    mutationFn: settingsService.addGalleryImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      toast.success("Image added to gallery");
    }
  });

  const deleteGalleryMutation = useMutation({
    mutationFn: settingsService.deleteGalleryImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      toast.success("Image removed");
    }
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm<GalleryImage>();
  const currentImage = watch('imageUrl');

  const onSubmit = (data: GalleryImage) => {
    if(!data.imageUrl) {
      toast.error("Image is required");
      return;
    }
    addGalleryMutation.mutate(data);
    reset();
    setValue('imageUrl', '');
  };

  if (isLoading) return <div>Loading gallery...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Photo Gallery</h1>
      <p className="text-gray-500 mb-6">Curate the images displayed in the "Moments in Paradise" section of the home page.</p>

      <div className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium border-b pb-4 mb-4">Add Gallery Image</h3>
          <div className="flex flex-col md:flex-row gap-6">
             <div className="flex-1">
                <ImageUpload 
                  label="Upload Photo" 
                  value={currentImage} 
                  onChange={(val) => setValue('imageUrl', val)} 
                />
             </div>
             <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                  <input {...register("caption")} placeholder="Beautiful beach..." className="w-full border p-2 rounded focus:ring-sey-blue focus:border-sey-blue" />
                </div>
                <div className="pt-2">
                  <button type="submit" className="w-full bg-sey-blue text-white px-4 py-2 rounded hover:bg-blue-800 flex justify-center items-center transition">
                    <PlusIcon className="w-5 h-5 mr-2" /> Add to Gallery
                  </button>
                </div>
             </div>
          </div>
        </form>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gallery?.map(img => (
            <div key={img.id} className="relative group">
              <img src={img.imageUrl} alt={img.caption} className="w-full h-40 object-cover rounded-lg shadow" />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                 <button onClick={() => deleteGalleryMutation.mutate(img.id)} className="opacity-0 group-hover:opacity-100 bg-white text-red-600 p-2 rounded-full shadow hover:bg-gray-100 transform scale-75 hover:scale-100 transition">
                    <TrashIcon className="w-5 h-5" />
                 </button>
              </div>
              {img.caption && <p className="mt-1 text-xs text-center text-gray-500">{img.caption}</p>}
            </div>
          ))}
          {(!gallery || gallery.length === 0) && (
              <p className="text-gray-500 italic col-span-4 text-center py-8">No images in gallery.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleryPage;