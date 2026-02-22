export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CLIENT = 'CLIENT',
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  company?: string;
  nationality?: string;
  vatNumber?: string;
  role: UserRole;
  createdAt: string;
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ServiceType {
  TRANSFER = 'TRANSFER',
  TOUR = 'TOUR',
  CHARTER = 'CHARTER',
}

export type CurrencyCode = 'SCR' | 'EUR' | 'USD';

export interface BookingHistoryEntry {
  timestamp: string;
  action: 'CREATED' | 'UPDATED' | 'STATUS_CHANGE' | 'REVERTED';
  details: string;
  user: string;
  previousState?: Partial<Booking>;
}

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  email?: string;
  phone?: string;
  serviceType: ServiceType;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  pax: number;
  status: BookingStatus;
  amount: number;
  currency: CurrencyCode; // Added multi-currency support
  notes?: string;
  history?: BookingHistoryEntry[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  bookingId?: string;
  clientName: string;
  date: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  paid: boolean;
  currency: CurrencyCode;
  items: InvoiceItem[];
}

export enum ExpenseCategory {
  FUEL = 'FUEL',
  MAINTENANCE = 'MAINTENANCE',
  SALARY = 'SALARY',
  MARKETING = 'MARKETING',
  OFFICE = 'OFFICE',
  LICENSES = 'LICENSES',
  OTHER = 'OTHER'
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: CurrencyCode; // Expenses are usually in local SCR but can be foreign
  vatIncluded: boolean;
  vatAmount: number;
  reference?: string;
  bookingId?: string;
}

export interface BookingInput {
  clientName: string;
  email: string;
  phone?: string;
  serviceType: ServiceType;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  pax: number;
  amount?: number;
  currency?: CurrencyCode; // Added for creation
  notes?: string;
  status?: BookingStatus;
}

export interface BusinessSettings {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  about: string;
  vatRate: number;
  eurRate: number; // Added: 1 EUR = X SCR
  usdRate: number; // Added: 1 USD = X SCR
  defaultTransferPrice: number; // Audit Fix: Dynamic Pricing
  defaultTourPrice: number;     // Audit Fix: Dynamic Pricing
  showVatBreakdown: boolean;
  autoCreateInvoice: boolean;
  enableEmailNotifications: boolean;
  paymentInstructions?: string;
  heroImageUrl?: string;
  logoUrl?: string;
  loginHeroImageUrl?: string;
  loginTitle?: string;
  loginMessage?: string;
}

export interface Advert {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price?: string;
  active: boolean;
}

export interface GalleryImage {
  id: string;
  imageUrl: string;
  caption?: string;
}

export interface ServiceContent {
  id: string;
  title: string;
  description: string;
  icon: string;
  price?: string;      // Added price field
  showPrice?: boolean; // Added display toggle
}

export const SEYCHELLES_VAT_RATE_DEFAULT = 0.15;
export const SEYCHELLES_BUSINESS_TAX_THRESHOLD = 1000000;
export const SEYCHELLES_BUSINESS_TAX_RATE = 0.25;
export const DEFAULT_HERO_IMAGE_URL = "";