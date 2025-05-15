import React, { createContext, useContext, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';

// The type for the Supabase context
interface SupabaseContextType {
  supabase: ReturnType<typeof createClient>;
}

// Create the context
const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

// Props for the provider component
interface SupabaseProviderProps {
  children: ReactNode;
}

// The provider component that will wrap the app
export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be provided in environment variables');
  }
  
  // Create the Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
};

// Hook to use the Supabase context
export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};