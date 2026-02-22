import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { settingsService } from '../services/settingsService';
import { ServiceContent } from '../types';
import { toast } from 'react-hot-toast';
import { 
  PaperAirplaneIcon, 
  MapIcon, 
  StarIcon, 
  TruckIcon, 
  GlobeAltIcon, 
  LifebuoyIcon,
  TicketIcon,
  SunIcon,
  PencilSquareIcon, 
  TrashIcon, 
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Available Icons for Selection
const AVAILABLE_ICONS = [
  { name: 'PaperAirplaneIcon', icon: PaperAirplaneIcon, label: 'Plane / Transfer' },
  { name: 'MapIcon', icon: MapIcon, label: 'Map / Tour' },
  { name: 'StarIcon', icon: StarIcon, label: 'Star / VIP' },
  { name: 'TruckIcon', icon: TruckIcon, label: 'Vehicle' },
  { name: 'GlobeAltIcon', icon: GlobeAltIcon, label: 'Globe' },
  { name: 'LifebuoyIcon', icon: LifebuoyIcon, label: 'Boat / Sea' },
  { name: 'TicketIcon', icon: TicketIcon, label: 'Ticket / Booking' },
  { name: 'SunIcon', icon: SunIcon, label: 'Sun / Day' },
];

const ServicesCMSPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingService, setEditingService] = useState<ServiceContent | null>(null);

  const { data: services, isLoading } = useQuery({ 
    queryKey: ['services-content'], 
    queryFn: settingsService.getServices 
  });
  
  const addServiceMutation = useMutation({
    mutationFn: settingsService.addService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-content'] });
      toast.success("Service added");
      resetForm();
    }
  });

  const updateServiceMutation = useMutation({
    mutationFn: settingsService.updateService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-content'] });
      toast.success("Service updated");
      resetForm();
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: settingsService.deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-content'] });
      toast.success("Service deleted");
    }
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm<ServiceContent>();
  const currentIcon = watch('icon');

  const resetForm = () => {
    reset({
        title: '',
        description: '',
        icon: 'PaperAirplaneIcon',
        price: '',
        showPrice: false
    });
    setEditingService(null);
  };

  const handleEdit = (service: ServiceContent) => {
    setEditingService(service);
    reset(service);
  };

  const onSubmit = (data: ServiceContent) => {
    if (editingService) {
        updateServiceMutation.mutate({ ...data, id: editingService.id });
    } else {
        addServiceMutation.mutate(data);
    }
  };

  if (isLoading) return <div>Loading services...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Our Services Management</h1>
      <p className="text-gray-500 mb-6">Edit the service cards displayed on the "Our Services" section of the home page.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1">
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow space-y-6 border-t-4 border-sey-blue sticky top-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-lg font-medium">
                    {editingService ? 'Edit Service' : 'Add New Service'}
                </h3>
                {editingService && (
                    <button 
                      type="button" 
                      onClick={resetForm}
                      className="text-gray-400 hover:text-gray-600 flex items-center text-sm font-medium"
                    >
                        <XMarkIcon className="w-4 h-4 mr-1" /> Cancel
                    </button>
                )}
              </div>
              
              <div className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Service Title</label>
                      <input {...register("title", {required: true})} placeholder="e.g. Airport Transfers" className="w-full border p-2 rounded focus:ring-sey-blue focus:border-sey-blue" />
                  </div>
                  
                  <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Description</label>
                      <textarea {...register("description", {required: true})} placeholder="Short description..." rows={4} className="w-full border p-2 rounded focus:ring-sey-blue focus:border-sey-blue" />
                  </div>

                  <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pricing (Optional)</label>
                      <div className="flex gap-2 items-center">
                          <input {...register("price")} placeholder="e.g. From SCR 1500" className="flex-1 border p-2 rounded focus:ring-sey-blue focus:border-sey-blue text-sm" />
                          <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 px-3 py-2 rounded border border-gray-200 hover:bg-gray-100 transition">
                              <input type="checkbox" {...register("showPrice")} className="rounded text-sey-blue focus:ring-sey-blue h-4 w-4" />
                              <span className="text-xs font-bold text-gray-600">Show</span>
                          </label>
                      </div>
                  </div>
                  
                  <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select Icon</label>
                      <div className="grid grid-cols-4 gap-2">
                          {AVAILABLE_ICONS.map((item) => {
                              const Icon = item.icon;
                              const isSelected = currentIcon === item.name;
                              return (
                                  <div 
                                    key={item.name}
                                    onClick={() => setValue('icon', item.name)}
                                    className={`cursor-pointer p-2 rounded-lg flex flex-col items-center justify-center border transition-all ${isSelected ? 'bg-sey-blue text-white border-sey-blue shadow-md scale-105' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                    title={item.label}
                                  >
                                      <Icon className="w-6 h-6" />
                                  </div>
                              )
                          })}
                      </div>
                  </div>
              </div>
              
              <button 
                type="submit" 
                disabled={addServiceMutation.isPending || updateServiceMutation.isPending}
                className="w-full flex justify-center items-center bg-sey-blue text-white px-6 py-2.5 rounded-lg hover:bg-blue-800 transition shadow-md font-bold disabled:opacity-50"
              >
                {editingService ? (
                    <>
                        <PencilSquareIcon className="w-5 h-5 mr-2" />
                        {updateServiceMutation.isPending ? "Updating..." : "Update Service"}
                    </>
                ) : (
                    <>
                        <PlusIcon className="w-5 h-5 mr-2" />
                        {addServiceMutation.isPending ? "Adding..." : "Add Service"}
                    </>
                )}
              </button>
            </form>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-min">
          {services?.map((service) => {
            const IconObj = AVAILABLE_ICONS.find(i => i.name === service.icon) || AVAILABLE_ICONS[0];
            const Icon = IconObj.icon;
            
            return (
                <div key={service.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition relative">
                  {service.showPrice && service.price && (
                      <div className="absolute top-0 right-0 bg-sey-yellow text-gray-900 text-xs font-bold px-3 py-1 rounded-bl-lg shadow-sm">
                          {service.price}
                      </div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-sey-blue/10 rounded-full flex items-center justify-center text-sey-blue">
                          <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEdit(service)} 
                            className="p-1.5 text-gray-400 hover:text-sey-blue hover:bg-blue-50 rounded-lg transition"
                          >
                              <PencilSquareIcon className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => {
                                if(window.confirm('Delete this service card?')) deleteServiceMutation.mutate(service.id);
                            }} 
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          >
                              <TrashIcon className="w-5 h-5" />
                          </button>
                      </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-gray-500 text-sm flex-1">{service.description}</p>
                </div>
            );
          })}
          
          {(!services || services.length === 0) && (
              <p className="text-gray-500 italic col-span-2 text-center py-12 bg-white rounded-lg border border-dashed border-gray-200">
                  No services configured.
              </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServicesCMSPage;