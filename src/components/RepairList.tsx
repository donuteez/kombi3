import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { RepairSheet } from '../types';
import { useToast } from '../hooks/useToast';

interface RepairListProps {
  onViewDetail: (id: string) => void;
}

export const RepairList: React.FC<RepairListProps> = ({ onViewDetail }) => {
  const { supabase } = useSupabase();
  const { showToast } = useToast();
  const [repairs, setRepairs] = useState<RepairSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchRepairs = async () => {
      try {
        const { data, error } = await supabase
          .from('repair_sheets')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          throw new Error(`Failed to fetch repairs: ${error.message}`);
        }
        
        setRepairs(data || []);
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
    
    fetchRepairs();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('repair_sheets_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'repair_sheets' 
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setRepairs(prev => [payload.new as RepairSheet, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setRepairs(prev => prev.map(repair => 
            repair.id === payload.new.id ? payload.new as RepairSheet : repair
          ));
        } else if (payload.eventType === 'DELETE') {
          setRepairs(prev => prev.filter(repair => repair.id !== payload.old.id));
        }
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, showToast]);
  
  const filteredRepairs = repairs.filter(repair => {
    const searchLower = searchTerm.toLowerCase();
    return (
      repair.technician_name.toLowerCase().includes(searchLower) ||
      repair.ro_number.toLowerCase().includes(searchLower) ||
      (repair.customer_name && repair.customer_name.toLowerCase().includes(searchLower)) ||
      (repair.customer_concern && repair.customer_concern.toLowerCase().includes(searchLower))
    );
  });
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Repair History</h2>
          <div className="w-full md:w-auto">
            <input
              type="text"
              placeholder="Search by customer, tech name, RO number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-gray-600">Loading repair sheets...</p>
          </div>
        ) : filteredRepairs.length === 0 ? (
          <div className="text-center py-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600">
              {searchTerm ? 'No matching repair sheets found' : 'No repair sheets yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RO Number</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technician</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mileage</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Has Diagnostic</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRepairs.map((repair) => (
                  <tr key={repair.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap">{repair.customer_name || '—'}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{repair.ro_number}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{repair.technician_name}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{formatDate(repair.created_at)}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{repair.vehicle_mileage || '—'}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {repair.diagnostic_file_id ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          No
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => onViewDetail(repair.id)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};