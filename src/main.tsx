import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import App from './App.tsx';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

// Initialize theme before React renders
const initializeTheme = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored || (prefersDark ? 'dark' : 'light');
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};

initializeTheme();

// Setup React Query with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh for 5 min
      gcTime: 24 * 60 * 60 * 1000, // 24 hours - cache kept for 24 hours (increased for persistence)
      refetchOnWindowFocus: false, // Don't refetch on window focus
      retry: 1, // Retry failed requests once
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
  },
});

// Setup React Query persistence to localStorage
const persister = createAsyncStoragePersister({
  storage: window.localStorage,
  key: 'REACT_QUERY_OFFLINE_CACHE',
  serialize: JSON.stringify,
  deserialize: JSON.parse,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours - cache persists for 24 hours
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            // Persist all queries except those that shouldn't be cached
            // You can add conditions here to exclude certain queries
            return true;
          },
        },
      }}>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  </StrictMode>
);
