import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './services/authService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Audit Fix: Save egress by not refetching every time tab is focused
      retry: 1,
      // Audit Fix: Set reasonable cache times to prevent UI flickering and excessive DB reads
      staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes (increased from 1m)
      gcTime: 30 * 60 * 1000,   // Unused data is kept in memory longer
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);