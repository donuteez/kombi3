import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { RepairSheet } from '../types';
import { useToast } from '../hooks/useToast';
import { FileViewer } from './FileViewer';

interface RepairDetailProps {
  repairId: string;
  onBack: () => void;
}

export const RepairDetail: React.FC<RepairDetailProps> = ({ repairId, onBack }) => {
  const { supabase } = useSupabase();
  const { showToast } = useToast();
  const [repair, setRepair] = useState<RepairSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  
  useEffect(() => {
    const fetchRepairDetail = async () => {
      try {
        const { data, error } = await supabase
          .from('repair_sheets')
          .select('*')
          .eq('id', repairId)
          .single();
          
        if (error) {
          throw new Error(`Failed to fetch repair details: ${error.message}`);
        }
        
        setRepair(data);
      } catch (error) {
        showToast({
          id: Date.now().toString(),
          title: 'Error',
          description: error instanceof Error ? error.message : 'An unknown error occurred',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchRepairDetail();
  }, [repairId, supabase, showToast]);
  
  const handleViewDiagnostic = async () => {
    if (!repair?.diagnostic_file_id) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase.storage
        .from('diagnostic-files')
        .download(repair.diagnostic_file_id);
        
      if (error) {
        throw new Error(`Failed to download file: ${error.message}`);
      }
      
      const text = await data.text();
      setFileContent(text);
      setShowFileViewer(true);
    } catch (error) {
      showToast({
        id: Date.now().toString(),
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-600">Loading repair details...</p>
        </div>
      </div>
    );
  }
  
  if (!repair) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">Repair not found</h3>
          <p className="mt-2 text-gray-600">The repair sheet you're looking for doesn't exist or has been removed.</p>
          <div className="mt-6">
            <button
              onClick={onBack}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to List
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {showFileViewer && fileContent && (
        <FileViewer 
          fileName={repair.diagnostic_file_name || 'diagnostic.txt'} 
          content={fileContent}
          onClose={() => setShowFileViewer(false)}
        />
      )}
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <button
            onClick={onBack}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            ← Back to List
          </button>
          <div className="mt-2">
            <h2 className="text-xl font-bold text-gray-800">
              RO#: {repair.ro_number}
            </h2>
            <div className="mt-1 flex items-center text-sm text-gray-600">
              <span>{repair.customer_name || '—'}</span>
              <span className="mx-2">•</span>
              <span>Tech: {repair.technician_name}</span>
              {repair.vehicle_mileage && (
                <>
                  <span className="mx-2">•</span>
                  <span>Mileage: {repair.vehicle_mileage.toLocaleString()}</span>
                </>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {formatDate(repair.created_at)}
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Notes & Recommendations</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Customer Concern</p>
                  <p className="mt-1 whitespace-pre-wrap">{repair.customer_concern || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Recommendations</p>
                  <p className="mt-1 whitespace-pre-wrap">{repair.recommendations || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Shop Recommendations</p>
                  <p className="mt-1 whitespace-pre-wrap">{repair.shop_recommendations || '—'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Tire Tread (32nds inch)</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Left Front</p>
                    <p className="mt-1 text-lg font-semibold">{repair.tire_tread.lf}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Right Front</p>
                    <p className="mt-1 text-lg font-semibold">{repair.tire_tread.rf}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Left Rear</p>
                    <p className="mt-1 text-lg font-semibold">{repair.tire_tread.lr}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Right Rear</p>
                    <p className="mt-1 text-lg font-semibold">{repair.tire_tread.rr}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Brake Pads (MM)</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Left Front</p>
                    <p className="mt-1 text-lg font-semibold">{repair.brake_pads.lf}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Right Front</p>
                    <p className="mt-1 text-lg font-semibold">{repair.brake_pads.rf}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Left Rear</p>
                    <p className="mt-1 text-lg font-semibold">{repair.brake_pads.lr}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Right Rear</p>
                    <p className="mt-1 text-lg font-semibold">{repair.brake_pads.rr}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Tire Pressure (PSI)</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Front In</p>
                    <p className="mt-1 text-lg font-semibold">{repair.tire_pressure.front_in}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Front Out</p>
                    <p className="mt-1 text-lg font-semibold">{repair.tire_pressure.front_out}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Rear In</p>
                    <p className="mt-1 text-lg font-semibold">{repair.tire_pressure.rear_in}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Rear Out</p>
                    <p className="mt-1 text-lg font-semibold">{repair.tire_pressure.rear_out}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {repair.diagnostic_file_id && (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-blue-900">Diagnostic File</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    {repair.diagnostic_file_name}
                  </p>
                </div>
                <button
                  onClick={handleViewDiagnostic}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {loading ? 'Loading...' : 'View Diagnostic File'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};