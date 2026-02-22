import React, { useState } from 'react';
import { settingsService } from '../services/settingsService';
import { useAuth } from '../services/authService';
import { ServiceType, BookingInput } from '../types';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../components/Header';
import { Link } from 'react-router-dom';
import {
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { Logo } from '../components/Logo';

// Modular Components
import {
  Hero,
  ServicesSection,
  AdvertsSection,
  GallerySection,
  BookingForm
} from '../components/home';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [externalBookingValues, setExternalBookingValues] = useState<Partial<BookingInput> | undefined>();

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getSettings,
    staleTime: 60 * 60 * 1000 // 1 hour stale time for settings
  });
  const { data: adverts } = useQuery({
    queryKey: ['adverts'],
    queryFn: settingsService.getAdverts,
    staleTime: 30 * 60 * 1000 // 30 minutes for adverts
  });
  const { data: gallery } = useQuery({
    queryKey: ['gallery'],
    queryFn: settingsService.getGallery,
    staleTime: 60 * 60 * 1000 // 1 hour for gallery
  });
  const { data: services } = useQuery({
    queryKey: ['services-content'],
    queryFn: settingsService.getServices,
    staleTime: 60 * 60 * 1000 // 1 hour for static services list
  });

  const scrollToBooking = () => {
    const el = document.getElementById('booking-form');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBookAdvert = (ad: any) => {
    setExternalBookingValues({
      serviceType: ServiceType.TOUR,
      notes: `Booking Request for Special Offer: ${ad.title}\nPrice: ${ad.price || 'As advertised'}`
    });
    toast.success(`Selected: ${ad.title}`);
    scrollToBooking();
  };

  const handleServiceClick = (service: any) => {
    const title = service.title.toLowerCase();
    let serviceType = ServiceType.TRANSFER;

    if (title.includes('tour')) {
      serviceType = ServiceType.TOUR;
    } else if (title.includes('charter')) {
      serviceType = ServiceType.CHARTER;
    }

    setExternalBookingValues({ serviceType });
    scrollToBooking();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header transparent={!!settings?.heroImageUrl} />

      <Hero
        settings={settings}
        onBookClick={scrollToBooking}
      />

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

      <ServicesSection
        services={services}
        onServiceClick={handleServiceClick}
      />

      <AdvertsSection
        adverts={adverts}
        onBookAdvert={handleBookAdvert}
      />

      <GallerySection
        gallery={gallery}
      />

      <BookingForm
        user={user}
        businessName={settings?.name || "Kreol Island Tours"}
        externalValues={externalBookingValues}
        onResetExternal={() => setExternalBookingValues(undefined)}
      />

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
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
            <p className="font-mono text-[10px] opacity-60 tracking-wider">v3.0.0 (Synchronized) | Precision Crafted by JBVservices</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;