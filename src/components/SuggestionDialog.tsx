import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { useToast } from '../hooks/useToast';

interface SuggestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuggestionDialog: React.FC<SuggestionDialogProps> = ({ isOpen, onClose }) => {
  const { supabase } = useSupabase();
  const { showToast } = useToast();
  const [suggestion, setSuggestion] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!suggestion.trim()) {
      showToast({
        id: Date.now().toString(),
        title: 'Error',
        description: 'Please enter a suggestion',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-suggestion`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestion: suggestion.trim(),
          userEmail: userEmail.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send suggestion');
      }

      showToast({
        id: Date.now().toString(),
        title: 'Success!',
        description: 'Your suggestion has been sent. Thank you for your feedback!',
        type: 'success'
      });

      // Reset form and close dialog
      setSuggestion('');
      setUserEmail('');
      onClose();

    } catch (error) {
      showToast({
        id: Date.now().toString(),
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send suggestion',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSuggestion('');
      setUserEmail('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
          aria-hidden="true"
        />
        
        {/* Center the modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-blue-900 px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-white">
              Share Your Suggestion
            </h3>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-white hover:text-gray-200 focus:outline-none disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4">
              <label htmlFor="suggestion" className="block text-sm font-medium text-gray-700 mb-2">
                What would you like to see improved or added?
              </label>
              <textarea
                id="suggestion"
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="I wish this page would..."
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Your email (optional)
              </label>
              <input
                type="email"
                id="userEmail"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="your.email@example.com"
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave your email if you'd like a response to your suggestion
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !suggestion.trim()}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} className="mr-2" />
                    Send Suggestion
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};