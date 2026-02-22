import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookingService, bookingSchema } from '../services/bookingService';
import { settingsService } from '../services/settingsService';
import { useAuth } from '../services/authService';
import { BookingInput, ServiceType, DEFAULT_HERO_IMAGE_URL } from '../types';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { Logo } from '../components/Logo';
import { Header } from '../components/Header';
import { Link } from 'react-router-dom';
import { 
  PaperAirplaneIcon, 
  MapIcon, 
  StarIcon,
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon, 
  ArrowRightIcon, 
  CheckBadgeIcon,
  TruckIcon,
  GlobeAltIcon,
  LifebuoyIcon,
  TicketIcon,
  SunIcon
} from '@heroicons/react/24/outline';

// Icon Map for Dynamic Rendering
const ICON_MAP: Record<string, React.ElementType> = {
  PaperAirplaneIcon,
  MapIcon,
  StarIcon,
  TruckIcon,
  GlobeAltIcon,
  LifebuoyIcon,
  TicketIcon,
  SunIcon
};

const HomePage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [lastBookingRef, setLastBookingRef] = useState<string>('');
  
  const { user } = useAuth();
  
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      pax: 2,
      serviceType: ServiceType.TRANSFER
    }
  });

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (user) {
      setValue('clientName', user.name);
      setValue('email', user.email);
    }
  }, [user, setValue]);

  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsService.getSettings });
  const { data: adverts } = useQuery({ queryKey: ['adverts'], queryFn: settingsService.getAdverts });
  const { data: gallery } = useQuery({ queryKey: ['gallery'], queryFn: settingsService.getGallery });
  const { data: services } = useQuery({ queryKey: ['services-content'], queryFn: settingsService.getServices });

  const onSubmit = async (data: BookingInput) => {
    setIsSubmitting(true);
    try {
      // Pass user ID and a descriptive "Creator Name" for the history log
      const creatorName = user ? 'Client Portal' : 'Website Guest';
      const newBooking = await bookingService.createBooking(data, user?.id, creatorName);
      
      const ref = bookingService.formatBookingRef(newBooking.id);
      
      // Set success state instead of just toasting
      setLastBookingRef(ref);
      setBookingSuccess(true);
      
      // We don't reset immediately, we wait for user to click "Book Another"
    } catch (error) {
      toast.error("Failed to submit booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetBooking = () => {
    setBookingSuccess(false);
    setLastBookingRef('');
    reset();
    if (user) {
      setValue('clientName', user.name);
      setValue('email', user.email);
    }
    // Scroll to top of form area
    const el = document.getElementById('booking-form');
    if(el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToBooking = () => {
    const el = document.getElementById('booking-form');
    if(el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBookAdvert = (ad: any) => {
    // Pre-fill the form with the advert details
    setValue('serviceType', ServiceType.TOUR); // Assume experiences are Tours
    setValue('notes', `Booking Request for Special Offer: ${ad.title}\nPrice: ${ad.price || 'As advertised'}`);
    
    toast.success(`Selected: ${ad.title}`);
    scrollToBooking();
  };

  const handleServiceClick = (service: any) => {
    const title = service.title.toLowerCase();
    
    // Intelligent mapping of service card title to form selection
    if (title.includes('tour')) {
        setValue('serviceType', ServiceType.TOUR);
    } else if (title.includes('charter')) {
        setValue('serviceType', ServiceType.CHARTER);
    } else {
        // Default fallthrough for 'transfer' or others
        setValue('serviceType', ServiceType.TRANSFER);
    }
    
    scrollToBooking();
  };

  // Determine colors for dynamic services (cycle through branding)
  const getServiceColor = (index: number) => {
      const colors = ['text-sey-blue', 'text-sey-green', 'text-yellow-700'];
      const borderColors = ['border-sey-blue', 'border-sey-green', 'border-sey-yellow'];
      const bgColors = ['bg-sey-blue', 'bg-sey-green', 'bg-sey-yellow'];
      const idx = index % 3;
      return { 
          text: colors[idx], 
          border: borderColors[idx], 
          bg: bgColors[idx] 
      };
  };

  const heroImage = settings?.heroImageUrl || DEFAULT_HERO_IMAGE_URL;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* Global Header */}
      <Header transparent={!!heroImage} />

      {/* Hero Section */}
      <div className={`relative h-[85vh] flex items-center justify-center overflow-hidden ${!heroImage ? 'bg-blue-50' : ''}`}>
        {/* Background Image - Priority Load */}
        {heroImage && (
            <div className="absolute inset-0 z-0">
            <img 
                src={heroImage} 
                alt="Seychelles Beach" 
                className="w-full h-full object-cover"
                // No lazy loading for Hero image to prevent LCP issues
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30"></div>
            </div>
        )}

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-16">
          <h1 className={`text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight ${heroImage ? 'text-white drop-shadow-lg' : 'text-sey-blue'}`}>
            {settings?.name || "Kreol Island Tours"}
          </h1>
          <p className={`text-xl md:text-2xl mb-10 font-medium max-w-2xl mx-auto ${heroImage ? 'text-sey-yellow drop-shadow-md' : 'text-gray-600'}`}>
            {settings?.tagline || "Experience the Seychelles like a local"}
          </p>
          <button 
            onClick={scrollToBooking}
            className="bg-sey-red hover:bg-red-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all transform hover:scale-105 shadow-xl"
          >
            Book Your Adventure
          </button>
        </div>
      </div>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 relative inline-block">
            About Us
            <div className="h-1 w-1/2 bg-sey-blue mx-auto mt-2 rounded-full"></div>
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            {settings?.about || "Welcome to paradise."}
          </p>
        </div>
      </section>

      {/* Services Cards */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
           <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">Our Services</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {services && services.length > 0 ? (
                  services.map((service, idx) => {
                      const IconComponent = ICON_MAP[service.icon] || PaperAirplaneIcon;
                      const colors = getServiceColor(idx);
                      
                      return (
                        <div 
                            key={service.id} 
                            onClick={() => handleServiceClick(service)}
                            className={`bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border-t-4 ${colors.border} group cursor-pointer transform hover:-translate-y-1 relative overflow-hidden`}
                        >
                          {service.showPrice && service.price && (
                              <div className="absolute top-0 right-0 bg-sey-yellow text-gray-900 text-xs font-bold px-3 py-1 rounded-bl-lg shadow-sm z-10">
                                  {service.price}
                              </div>
                          )}
                          <div className={`w-14 h-14 bg-opacity-10 rounded-full flex items-center justify-center mb-6 group-hover:text-white transition-colors ${colors.text} group-hover:${colors.bg}`} style={{backgroundColor: colors.text.includes('yellow') ? '#FEF3C7' : undefined}}>
                             <IconComponent className="w-8 h-8" />
                          </div>
                          <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                          <p className="text-gray-600">{service.description}</p>
                        </div>
                      );
                  })
              ) : (
                // Fallback loading state or empty
                 <div className="col-span-3 text-center py-10 text-gray-400">Loading services...</div>
              )}
           </div>
        </div>
      </section>

      {/* Featured Adverts */}
      {adverts && adverts.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">Featured Experiences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {adverts.map((ad) => (
                <div key={ad.id} className="group relative overflow-hidden rounded-2xl shadow-lg h-[400px] flex flex-col">
                  {/* Image Background - Lazy Load */}
                  <div className="absolute inset-0">
                    <img 
                      src={ad.imageUrl} 
                      alt={ad.title} 
                      loading="lazy"
                      className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10 flex flex-col justify-end h-full p-6 text-white">
                    <div className="transform translate-y-2 group-hover:translate-y-0 transition duration-300">
                      <div className="flex justify-between items-start mb-2">
                         <h3 className="text-2xl font-bold leading-tight">{ad.title}</h3>
                         {ad.price && (
                           <span className="bg-sey-yellow text-gray-900 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-2 shadow-sm">
                             {ad.price}
                           </span>
                         )}
                      </div>
                      <p className="text-sm text-gray-200 mb-6 line-clamp-3 opacity-90">{ad.description}</p>
                      
                      <button 
                        onClick={() => handleBookAdvert(ad)}
                        className="w-full bg-white text-gray-900 hover:bg-sey-blue hover:text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg"
                      >
                        Book This Experience
                        <ArrowRightIcon className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {gallery && gallery.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-6">
             <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">Moments in Paradise</h2>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {gallery.map((img, idx) => (
                  <div key={img.id} className={`relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 ${idx === 0 ? 'col-span-2 row-span-2' : ''}`}>
                     <img 
                        src={img.imageUrl} 
                        alt={img.caption} 
                        loading="lazy"
                        className="w-full h-full object-cover hover:scale-105 transition duration-500" 
                        style={{minHeight: '200px'}} 
                     />
                  </div>
                ))}
             </div>
          </div>
        </section>
      )}

      {/* Booking Form Section */}
      <section id="booking-form" className="py-20 bg-sey-blue relative">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-4xl mx-auto transition-all">
            
            {bookingSuccess ? (
              // Success State
              <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
                 <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
                    <CheckBadgeIcon className="h-16 w-16 text-green-600" />
                 </div>
                 <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Booking Confirmed!</h2>
                 <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                    Thank you for choosing {settings?.name}. Your booking request has been received and is being processed.
                 </p>
                 <div className="inline-block bg-gray-50 border border-gray-200 rounded-lg px-8 py-4 mb-10">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Booking Reference</p>
                    <p className="text-3xl font-mono font-bold text-sey-blue tracking-wider">{lastBookingRef}</p>
                 </div>
                 <div>
                    <button 
                      onClick={handleResetBooking}
                      className="bg-sey-blue hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all transform hover:scale-105"
                    >
                      Make Another Booking
                    </button>
                 </div>
              </div>
            ) : (
              // Booking Form
              <>
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-gray-800">Ready to Book?</h2>
                  <p className="text-gray-600 mt-2">Secure your transfer or tour instantly.</p>
                </div>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Client Info */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input {...register("clientName")} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sey-blue focus:border-sey-blue transition" placeholder="John Doe" />
                      {errors.clientName && <span className="text-sey-red text-xs mt-1">{errors.clientName.message}</span>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input {...register("email")} type="email" className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sey-blue focus:border-sey-blue transition" placeholder="john@example.com" />
                      {errors.email && <span className="text-sey-red text-xs mt-1">{errors.email.message}</span>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input {...register("phone")} type="tel" className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sey-blue focus:border-sey-blue transition" placeholder="+248 ..." />
                      {errors.phone && <span className="text-sey-red text-xs mt-1">{errors.phone.message}</span>}
                    </div>

                    {/* Service Details */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                      <select {...register("serviceType")} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sey-blue focus:border-sey-blue transition">
                        <option value={ServiceType.TRANSFER}>Airport Transfer</option>
                        <option value={ServiceType.TOUR}>Island Tour</option>
                        <option value={ServiceType.CHARTER}>Private Charter</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
                      <input {...register("pax", { valueAsNumber: true })} type="number" min="1" className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sey-blue focus:border-sey-blue transition" />
                      {errors.pax && <span className="text-sey-red text-xs mt-1">{errors.pax.message}</span>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date & Time</label>
                      <input {...register("pickupTime")} type="datetime-local" className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sey-blue focus:border-sey-blue transition" />
                      {errors.pickupTime && <span className="text-sey-red text-xs mt-1">{errors.pickupTime.message}</span>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                      <input {...register("pickupLocation")} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sey-blue focus:border-sey-blue transition" placeholder="Airport / Hotel" />
                      {errors.pickupLocation && <span className="text-sey-red text-xs mt-1">{errors.pickupLocation.message}</span>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dropoff Location</label>
                      <input {...register("dropoffLocation")} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sey-blue focus:border-sey-blue transition" placeholder="Hotel / Airport" />
                      {errors.dropoffLocation && <span className="text-sey-red text-xs mt-1">{errors.dropoffLocation.message}</span>}
                    </div>
                    

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                      <textarea {...register("notes")} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sey-blue focus:border-sey-blue transition" rows={3} placeholder="Flight number, special requests..." />
                    </div>

                  </div>

                  <button disabled={isSubmitting} type="submit" className="w-full bg-sey-red hover:bg-red-800 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 text-lg flex items-center justify-center">
                    {isSubmitting ? 'Processing Request...' : 'Confirm Booking'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="container mx-auto px-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
              <div>
                 {/* Footer Logo */}
                 <div className="mb-4">
                    <Logo lightText={true} className="h-10" />
                 </div>
                 <p className="text-gray-400 text-sm leading-relaxed">
                   {settings?.about ? settings.about.substring(0, 150) + "..." : "Your trusted partner for tours and transfers in Seychelles."}
                 </p>
              </div>
              <div>
                 <h3 className="text-lg font-bold mb-4 text-gray-200">Contact Us</h3>
                 <ul className="space-y-3 text-gray-400 text-sm">
                    <li className="flex items-start"><MapPinIcon className="w-5 h-5 mr-2 text-sey-yellow flex-shrink-0" /> {settings?.address}</li>
                    <li className="flex items-center"><PhoneIcon className="w-5 h-5 mr-2 text-sey-yellow" /> {settings?.phone}</li>
                    <li className="flex items-center"><EnvelopeIcon className="w-5 h-5 mr-2 text-sey-yellow" /> {settings?.email}</li>
                 </ul>
              </div>
              <div>
                 <h3 className="text-lg font-bold mb-4 text-gray-200">Quick Links</h3>
                 <ul className="space-y-2 text-gray-400 text-sm">
                    <li><Link to="/" className="hover:text-white transition">Home</Link></li>
                    <li><button onClick={scrollToBooking} className="hover:text-white transition text-left">Book Now</button></li>
                    <li><Link to="/login" className="hover:text-white transition">Manager Login</Link></li>
                 </ul>
              </div>
           </div>
           <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-xs flex flex-col items-center">
              <p className="mb-2">&copy; {new Date().getFullYear()} {settings?.name}. All rights reserved.</p>
              <p className="font-mono text-[10px] opacity-60">v2.1.3 | Developed by JBVservices</p>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;