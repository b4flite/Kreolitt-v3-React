import { BusinessSettings, Advert, GalleryImage, ServiceContent, DEFAULT_HERO_IMAGE_URL } from '../types';
import { supabase } from '../lib/supabaseClient';

const DEFAULT_SETTINGS: BusinessSettings = {
  name: "Kreol Island Tours",
  tagline: "Experience Seychelles",
  email: "info@kreol.sc",
  phone: "+248 123456",
  address: "Victoria, Mahe",
  about: "About us...",
  vatRate: 0.15,
  eurRate: 15.2,
  usdRate: 14.1,
  defaultTransferPrice: 1200,
  defaultTourPrice: 3000,
  showVatBreakdown: true,
  autoCreateInvoice: false,
  enableEmailNotifications: true,
  paymentInstructions: "Please make transfer to:\nBank: MCB Seychelles\nAccount: 0000000000",
  heroImageUrl: DEFAULT_HERO_IMAGE_URL,
  logoUrl: "",
  loginHeroImageUrl: DEFAULT_HERO_IMAGE_URL,
  loginTitle: "Experience the Seychelles with the comfort and reliability you deserve.",
  loginMessage: "Manage your transfers, tours, and itinerary all in one place."
};

// Helper: Client-Side Compression
const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const maxWidth = 1920; // Max width for HD
    const quality = 0.8;   // 80% quality

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Browser does not support canvas image compression"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Image compression failed"));
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const settingsService = {
  uploadImage: async (file: File): Promise<string> => {
    try {
      const compressedBlob = await compressImage(file);
      const fileExt = 'webp';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload requires auth
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, compressedBlob, {
          contentType: 'image/webp',
          cacheControl: '604800', // 7 days cache to save egress
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    }
  },

  getSettings: async (): Promise<BusinessSettings> => {
    // Audit Fix: Use standard client. RLS allows 'anon' select access.
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (!error && data) {
        return {
          name: data.name,
          tagline: data.tagline,
          email: data.email,
          phone: data.phone,
          address: data.address,
          about: data.about,
          vatRate: Number(data.vat_rate ?? DEFAULT_SETTINGS.vatRate),
          eurRate: Number(data.eur_rate ?? DEFAULT_SETTINGS.eurRate),
          usdRate: Number(data.usd_rate ?? DEFAULT_SETTINGS.usdRate),
          defaultTransferPrice: Number(data.default_transfer_price ?? DEFAULT_SETTINGS.defaultTransferPrice),
          defaultTourPrice: Number(data.default_tour_price ?? DEFAULT_SETTINGS.defaultTourPrice),
          showVatBreakdown: data.show_vat_breakdown ?? DEFAULT_SETTINGS.showVatBreakdown,
          autoCreateInvoice: data.auto_create_invoice ?? DEFAULT_SETTINGS.autoCreateInvoice,
          enableEmailNotifications: data.enable_email_notifications ?? DEFAULT_SETTINGS.enableEmailNotifications,
          paymentInstructions: data.payment_instructions || DEFAULT_SETTINGS.paymentInstructions,
          heroImageUrl: data.hero_image_url || DEFAULT_HERO_IMAGE_URL,
          logoUrl: data.logo_url,
          loginHeroImageUrl: data.login_hero_image_url || DEFAULT_HERO_IMAGE_URL,
          loginTitle: data.login_title || DEFAULT_SETTINGS.loginTitle,
          loginMessage: data.login_message || DEFAULT_SETTINGS.loginMessage
        };
      }
    } catch (e) {
      console.error("Settings fetch failed", e);
    }

    return DEFAULT_SETTINGS;
  },

  updateSettings: async (settings: BusinessSettings): Promise<BusinessSettings> => {
    const { error } = await supabase
      .from('business_settings')
      .update({
        name: settings.name,
        tagline: settings.tagline,
        email: settings.email,
        phone: settings.phone,
        address: settings.address,
        about: settings.about,
        vat_rate: Number(settings.vatRate),
        eur_rate: Number(settings.eurRate),
        usd_rate: Number(settings.usdRate),
        default_transfer_price: Number(settings.defaultTransferPrice),
        default_tour_price: Number(settings.defaultTourPrice),
        show_vat_breakdown: settings.showVatBreakdown,
        auto_create_invoice: settings.autoCreateInvoice,
        enable_email_notifications: settings.enableEmailNotifications,
        payment_instructions: settings.paymentInstructions,
        hero_image_url: settings.heroImageUrl,
        logo_url: settings.logoUrl,
        login_hero_image_url: settings.loginHeroImageUrl,
        login_title: settings.loginTitle,
        login_message: settings.loginMessage
      })
      .eq('id', 1);

    if (error) {
      console.error("Supabase settings update error:", error);
      throw error;
    }
    return settings;
  },

  // --- ADVERTS ---
  getAdverts: async (): Promise<Advert[]> => {
    const { data, error } = await supabase.from('adverts').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map((d: any) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      imageUrl: d.image_url,
      price: d.price,
      active: d.active
    }));
  },

  addAdvert: async (advert: Omit<Advert, 'id'>): Promise<Advert> => {
    const { data, error } = await supabase.from('adverts').insert({
      title: advert.title,
      description: advert.description,
      image_url: advert.imageUrl,
      price: advert.price,
      active: advert.active
    }).select().single();
    if (error) throw error;
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      imageUrl: data.image_url,
      price: data.price,
      active: data.active
    };
  },

  updateAdvert: async (advert: Advert): Promise<Advert> => {
    const { data, error } = await supabase.from('adverts').update({
      title: advert.title,
      description: advert.description,
      image_url: advert.imageUrl,
      price: advert.price,
      active: advert.active
    }).eq('id', advert.id).select().single();
    if (error) throw error;
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      imageUrl: data.image_url,
      price: data.price,
      active: data.active
    };
  },

  deleteAdvert: async (id: string): Promise<void> => {
    const { error } = await supabase.from('adverts').delete().eq('id', id);
    if (error) throw error;
  },

  // --- GALLERY ---
  getGallery: async (limit: number = 100): Promise<GalleryImage[]> => {
    const { data, error } = await supabase.from('gallery').select('*').limit(limit);
    if (error) throw error;
    return data.map((d: any) => ({
      id: d.id,
      imageUrl: d.image_url,
      caption: d.caption
    }));
  },

  addGalleryImage: async (image: Omit<GalleryImage, 'id'>): Promise<GalleryImage> => {
    const { data, error } = await supabase.from('gallery').insert({
      image_url: image.imageUrl,
      caption: image.caption
    }).select().single();
    if (error) throw error;
    return {
      id: data.id,
      imageUrl: data.image_url,
      caption: data.caption
    };
  },

  deleteGalleryImage: async (id: string): Promise<void> => {
    const { error } = await supabase.from('gallery').delete().eq('id', id);
    if (error) throw error;
  },

  // --- SERVICES CMS ---
  getServices: async (): Promise<ServiceContent[]> => {
    const { data, error } = await supabase.from('services').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return data.map((d: any) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      icon: d.icon,
      price: d.price,
      showPrice: d.show_price
    }));
  },

  addService: async (service: Omit<ServiceContent, 'id'>): Promise<ServiceContent> => {
    const { data, error } = await supabase.from('services').insert({
      title: service.title,
      description: service.description,
      icon: service.icon,
      price: service.price,
      show_price: service.showPrice
    }).select().single();
    if (error) throw error;
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      icon: data.icon,
      price: data.price,
      showPrice: data.show_price
    };
  },

  updateService: async (service: ServiceContent): Promise<ServiceContent> => {
    const { data, error } = await supabase.from('services').update({
      title: service.title,
      description: service.description,
      icon: service.icon,
      price: service.price,
      show_price: service.showPrice
    }).eq('id', service.id).select().single();
    if (error) throw error;
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      icon: data.icon,
      price: data.price,
      showPrice: data.show_price
    };
  },

  deleteService: async (id: string): Promise<void> => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
  }
};