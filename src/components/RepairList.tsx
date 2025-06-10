import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { RepairSheet } from '../types';
import { useToast } from '../hooks/useToast';
import { ArrowUpDown } from 'lucide-react';

interface RepairListProps {
  onViewDetail: (id: string) => void;
}

type SortField = 'customer_first_name' | 'customer_last_name' | 'ro_number' | 'technician_name' | 'created_at';
type SortDirection = 'asc' | 'desc';

export const RepairList: React.FC<RepairListProps> = ({ onViewDetail }) => {
  const { supabase } = useSupabase();
  const { showToast } = useToast();
  const [repairs, setRepairs] = useState<RepairSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  useEffect(() => {
    const fetchRepairs = async () => {
      try {
        const { data, error } = await supabase
          .from('repair_sheets')
          .select('*')
          .order(sortField, { ascending: sortDirection === 'asc' });
          
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
  }, [supabase, showToast, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getCustomerDisplayName = (repair: RepairSheet) => {
    if (repair.customer_first_name && repair.customer_last_name) {
      return `${repair.customer_first_name} ${repair.customer_last_name}`;
    } else if (repair.customer_first_name) {
      return repair.customer_first_name;
    } else if (repair.customer_last_name) {
      return repair.customer_last_name;
    }
    return '—';
  };
  
  const filteredRepairs = repairs.filter(repair => {
    const searchLower = searchTerm.toLowerCase();
    const customerName = getCustomerDisplayName(repair).toLowerCase();
    return (
      repair.technician_name.toLowerCase().includes(searchLower) ||
      repair.ro_number.toLowerCase().includes(searchLower) ||
      customerName.includes(searchLower) ||
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
      minute: '2-digit',
      timeZone: 'America/Los_Angeles'
    }).format(date);
  };

  const SortableHeader: React.FC<{
    field: SortField;
    label: string;
  }> = ({ field, label }) => (
    <th 
      className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        <ArrowUpDown 
          size={14}
          className={`${
            sortField === field ? 'text-blue-600' : 'text-gray-400'
          }`}
        />
      </div>
    </th>
  );
  
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
            <div className="animate-spin h-8 w-8 text-blue-600 mx-auto border-4 border-blue-200 rounded-full border-t-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading repair sheets...</p>
          </div>
        ) : filteredRepairs.length === 0 ? (
          <div className="text-center py-8">
            <div className="h-12 w-12 text-gray-400 mx-auto mb-4">📋</div>
            <p className="text-gray-600">
              {searchTerm ? 'No matching repair sheets found' : 'No repair sheets yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <SortableHeader field="customer_first_name" label="Customer" />
                  <SortableHeader field="ro_number" label="RO Number" />
                  <SortableHeader field="technician_name" label="Technician" />
                  <SortableHeader field="created_at" label="Date" />
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mileage</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Has Diagnostic</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRepairs.map((repair) => (
                  <tr key={repair.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap">{getCustomerDisplayName(repair)}</td>
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