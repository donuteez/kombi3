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
  const supabaseUrl = 'https://firaelvdprxtyzkdfyvx.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpcmFlbHZkcHJ4dHl6a2RmeXZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNjE2NzMsImV4cCI6MjA2MjgzNzY3M30.bj0TJjI7VUTUnomC6rQTu-r-RPQ-Q2AZC5-XMIFcUYw';
  
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