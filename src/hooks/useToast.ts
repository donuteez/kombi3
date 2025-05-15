import { useEffect, useCallback } from 'react';
import { Toast } from '../types';

type ToastCallback = (toast: Toast) => void;

// Create an event emitter for toasts
const toastCallbacks: ToastCallback[] = [];

export const useToast = () => {
  const showToast = useCallback((toast: Toast) => {
    // Notify all subscribers
    toastCallbacks.forEach(callback => callback(toast));
  }, []); // Empty dependency array since toastCallbacks is defined outside the hook
  
  return { showToast };
};

export const useToastSubscription = (callback: ToastCallback) => {
  useEffect(() => {
    // Add the callback to the list of subscribers
    toastCallbacks.push(callback);
    
    // Clean up on unmount
    return () => {
      const index = toastCallbacks.indexOf(callback);
      if (index > -1) {
        toastCallbacks.splice(index, 1);
      }
    };
  }, [callback]);
};