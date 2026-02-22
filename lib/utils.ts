import { CurrencyCode } from '../types';

// Secure UUID Generation
export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Secure fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] % 16) | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Consistent Currency Formatting
export const formatCurrency = (amount: number | undefined | null, currency: CurrencyCode = 'SCR') => {
  if (amount === undefined || amount === null) {
      return currency === 'SCR' ? 'SCR 0.00' : `${currency} 0.00`;
  }

  const locales: Record<CurrencyCode, string> = {
    SCR: 'en-SC',
    EUR: 'de-DE',
    USD: 'en-US'
  };

  return new Intl.NumberFormat(locales[currency] || 'en-SC', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
};

// Consistent Date Formatting
export const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateTime = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Class name helper (simple version)
export const classNames = (...classes: string[]) => {
  return classes.filter(Boolean).join(' ');
};