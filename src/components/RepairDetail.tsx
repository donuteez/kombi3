import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { RepairSheet } from '../types';
import { useToast } from '../hooks/useToast';
import { FileViewer } from './FileViewer';
import { Copy } from 'lucide-react';

interface RepairDetailProps {
  repairId: string;
  onBack: () => void;
}

export const RepairDetail: React.FC<RepairDetailProps> = ({ repairId, onBack }) => {
  const { supabase } = useSupabase();
  const { showToast } = useToast();
  const [repair, setRepair] = useState<RepairSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [editForm, setEditForm] = useState<RepairSheet | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newDiagnosticFile, setNewDiagnosticFile] = useState<File | null>(null);
  
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
        setEditForm(data);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'text/plain') {
        setNewDiagnosticFile(file);
      } else {
        showToast({
          id: Date.now().toString(),
          title: 'Invalid file type',
          description: 'Please upload a text (.txt) file',
          type: 'error'
        });
        e.target.value = '';
      }
    }
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast({
        id: Date.now().toString(),
        title: 'Copied!',
        description: `${label} copied to clipboard`,
        type: 'success'
      });
    } catch (error) {
      showToast({
        id: Date.now().toString(),
        title: 'Error',
        description: 'Failed to copy text',
        type: 'error'
      });
    }
  };

  // Handle brake pad unit toggle in edit mode
  const handleBrakePadUnitToggle = () => {
    if (!editForm) return;
    setEditForm(prev => ({
      ...prev!,
      brake_pad_unit: prev!.brake_pad_unit === 'MM' ? '%' : 'MM'
    }));
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editForm) return;
    
    const { name, value } = e.target;
    
    // Handle nested properties
    if (name.includes('.')) {
      const [category, field] = name.split('.');
      setEditForm({
        ...editForm,
        [category]: {
          ...editForm[category as keyof typeof editForm],
          [field]: value === '' ? 0 : Number(value)
        }
      });
    } else {
      setEditForm({
        ...editForm,
        [name]: value
      });
    }
  };
  
  const handleSave = async () => {
    if (!editForm) return;
    
    setIsSaving(true);
    try {
      let fileData = {};
      
      // Handle file upload if a new file was selected
      if (newDiagnosticFile) {
        const filename = `${Date.now()}_${newDiagnosticFile.name}`;
        
        // Delete old file if it exists
        if (repair?.diagnostic_file_id) {
          const { error: deleteError } = await supabase.storage
            .from('diagnostic-files')
            .remove([repair.diagnostic_file_id]);
            
          if (deleteError) {
            console.error('Failed to delete old file:', deleteError);
          }
        }
        
        // Upload new file
        const { data: fileUploadData, error: fileUploadError } = await supabase.storage
          .from('diagnostic-files')
          .upload(filename, newDiagnosticFile);
          
        if (fileUploadError) {
          throw new Error(`File upload failed: ${fileUploadError.message}`);
        }
        
        fileData = {
          diagnostic_file_id: fileUploadData.path,
          diagnostic_file_name: newDiagnosticFile.name
        };
      }

      const { error } = await supabase
        .from('repair_sheets')
        .update({
          ...editForm,
          ...fileData
        })
        .eq('id', repairId);
        
      if (error) throw error;
      
      setRepair({ ...editForm, ...fileData });
      setIsEditing(false);
      setNewDiagnosticFile(null);
      
      showToast({
        id: Date.now().toString(),
        title: 'Success',
        description: 'Repair sheet updated successfully',
        type: 'success'
      });
    } catch (error) {
      showToast({
        id: Date.now().toString(),
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update repair sheet',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this repair sheet? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      // Delete diagnostic file if it exists
      if (repair?.diagnostic_file_id) {
        const { error: deleteFileError } = await supabase.storage
          .from('diagnostic-files')
          .remove([repair.diagnostic_file_id]);

        if (deleteFileError) {
          console.error('Failed to delete diagnostic file:', deleteFileError);
        }
      }

      // Delete repair sheet
      const { error } = await supabase
        .from('repair_sheets')
        .delete()
        .eq('id', repairId);

      if (error) throw error;

      showToast({
        id: Date.now().toString(),
        title: 'Success',
        description: 'Repair sheet deleted successfully',
        type: 'success'
      });

      onBack();
    } catch (error) {
      showToast({
        id: Date.now().toString(),
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete repair sheet',
        type: 'error'
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleCancel = () => {
    setEditForm(repair);
    setIsEditing(false);
    setNewDiagnosticFile(null);
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
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <div className="animate-spin h-8 w-8 text-blue-600 mx-auto border-4 border-blue-200 rounded-full border-t-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading repair details...</p>
        </div>
      </div>
    );
  }
  
  if (!repair || !editForm) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
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
      {/* Page Title with Back Link */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-gray-900">Repair Sheet</h1>
          <button
            onClick={onBack}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            ← Back to List
          </button>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Edit
          </button>
        ) : (
          <div className="space-x-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isSaving || isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              disabled={isDeleting || isSaving}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isSaving || isDeleting}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {showFileViewer && fileContent && (
        <FileViewer 
          fileName={repair.diagnostic_file_name || 'diagnostic.txt'} 
          content={fileContent}
          onClose={() => setShowFileViewer(false)}
        />
      )}
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">RO Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="ro_number"
                    value={editForm.ro_number}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-lg font-semibold">{repair.ro_number}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <p className="mt-1">{formatDate(repair.created_at)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer</label>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      name="customer_first_name"
                      value={editForm.customer_first_name || ''}
                      onChange={handleInputChange}
                      placeholder="First name"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      name="customer_last_name"
                      value={editForm.customer_last_name || ''}
                      onChange={handleInputChange}
                      placeholder="Last name"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <p className="mt-1">{getCustomerDisplayName(repair)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vehicle Mileage</label>
                {isEditing ? (
                  <input
                    type="number"
                    name="vehicle_mileage"
                    value={editForm.vehicle_mileage || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1">{repair.vehicle_mileage?.toLocaleString() || '—'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Notes Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Notes & Recommendations</h3>
            
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Customer Concern</label>
                {!isEditing && repair.customer_concern && (
                  <button
                    onClick={() => handleCopy(repair.customer_concern, 'Customer concern')}
                    className="p-1 text-gray-500 hover:text-blue-600"
                    title="Copy to clipboard"
                  >
                    <Copy size={16} />
                  </button>
                )}
              </div>
              {isEditing ? (
                <textarea
                  name="customer_concern"
                  value={editForm.customer_concern || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              ) : (
                <p className="mt-1 whitespace-pre-wrap">{repair.customer_concern || '—'}</p>
              )}
            </div>
            
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Recommendations</label>
                {!isEditing && repair.recommendations && (
                  <button
                    onClick={() => handleCopy(repair.recommendations, 'Recommendations')}
                    className="p-1 text-gray-500 hover:text-blue-600"
                    title="Copy to clipboard"
                  >
                    <Copy size={16} />
                  </button>
                )}
              </div>
              {isEditing ? (
                <textarea
                  name="recommendations"
                  value={editForm.recommendations || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              ) : (
                <p className="mt-1 whitespace-pre-wrap">{repair.recommendations || '—'}</p>
              )}
            </div>
            
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Shop Recommendations</label>
                {!isEditing && repair.shop_recommendations && (
                  <button
                    onClick={() => handleCopy(repair.shop_recommendations, 'Shop recommendations')}
                    className="p-1 text-gray-500 hover:text-blue-600"
                    title="Copy to clipboard"
                  >
                    <Copy size={16} />
                  </button>
                )}
              </div>
              {isEditing ? (
                <textarea
                  name="shop_recommendations"
                  value={editForm.shop_recommendations || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              ) : (
                <p className="mt-1 whitespace-pre-wrap">{repair.shop_recommendations || '—'}</p>
              )}
            </div>
          </div>
          
          {/* Measurements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tire Tread */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Tire Tread (32nds inch)</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Left Front</p>
                    {isEditing ? (
                      <input
                        type="number"
                        name="tire_tread.lf"
                        value={editForm.tire_tread.lf}
                        onChange={handleInputChange}
                        className="mt-1 block w-20 mx-auto rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-lg font-semibold">{repair.tire_tread.lf}</p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Right Front</p>
                    {isEditing ? (
                      <input
                        type="number"
                        name="tire_tread.rf"
                        value={editForm.tire_tread.rf}
                        onChange={handleInputChange}
                        className="mt-1 block w-20 mx-auto rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-lg font-semibold">{repair.tire_tread.rf}</p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Left Rear</p>
                    {isEditing ? (
                      <input
                        type="number"
                        name="tire_tread.lr"
                        value={editForm.tire_tread.lr}
                        onChange={handleInputChange}
                        className="mt-1 block w-20 mx-auto rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-lg font-semibold">{repair.tire_tread.lr}</p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Right Rear</p>
                    {isEditing ? (
                      <input
                        type="number"
                        name="tire_tread.rr"
                        value={editForm.tire_tread.rr}
                        onChange={handleInputChange}
                        className="mt-1 block w-20 mx-auto rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-lg font-semibold">{repair.tire_tread.rr}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Brake Pads */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Brake Pads ({isEditing ? editForm.brake_pad_unit : repair.brake_pad_unit})
                </h3>
                {isEditing && (
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${editForm.brake_pad_unit === 'MM' ? 'text-blue-600' : 'text-gray-500'}`}>MM</span>
                    <button
                      type="button"
                      onClick={handleBrakePadUnitToggle}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        editForm.brake_pad_unit === '%' ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          editForm.brake_pad_unit === '%' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-sm font-medium ${editForm.brake_pad_unit === '%' ? 'text-blue-600' : 'text-gray-500'}`}>%</span>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Left Front</p>
                    {isEditing ? (
                      <input
                        type="number"
                        name="brake_pads.lf"
                        value={editForm.brake_pads.lf}
                        onChange={handleInputChange}
                        className="mt-1 block w-20 mx-auto rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-lg font-semibold">{repair.brake_pads.lf} {repair.brake_pad_unit}</p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Right Front</p>
                    {isEditing ? (
                      <input
                        type="number"
                        name="brake_pads.rf"
                        value={editForm.brake_pads.rf}
                        onChange={handleInputChange}
                        className="mt-1 block w-20 mx-auto rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-lg font-semibold">{repair.brake_pads.rf} {repair.brake_pad_unit}</p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Left Rear</p>
                    {isEditing ? (
                      <input
                        type="number"
                        name="brake_pads.lr"
                        value={editForm.brake_pads.lr}
                        onChange={handleInputChange}
                        className="mt-1 block w-20 mx-auto rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-lg font-semibold">{repair.brake_pads.lr} {repair.brake_pad_unit}</p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Right Rear</p>
                    {isEditing ? (
                      <input
                        type="number"
                        name="brake_pads.rr"
                        value={editForm.brake_pads.rr}
                        onChange={handleInputChange}
                        className="mt-1 block w-20 mx-auto rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="mt-1 text-lg font-semibold">{repair.brake_pads.rr} {repair.brake_pad_unit}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tire Pressure */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Tire Pressure (PSI)</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">TIRE PRESSURE IN:</span>
                    </div>
                    <div className="grid grid-cols-[auto,1fr,auto] gap-2 items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">FRONT</span>
                      {isEditing ? (
                        <input
                          type="number"
                          name="tire_pressure.front_in"
                          value={editForm.tire_pressure.front_in}
                          onChange={handleInputChange}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold">{repair.tire_pressure.front_in}</p>
                      )}
                      <span className="text-sm text-gray-600">PSI</span>
                    </div>
                    <div className="grid grid-cols-[auto,1fr,auto] gap-2 items-center">
                      <span className="text-sm font-medium text-gray-700">REAR</span>
                      {isEditing ? (
                        <input
                          type="number"
                          name="tire_pressure.rear_in"
                          value={editForm.tire_pressure.rear_in}
                          onChange={handleInputChange}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold">{repair.tire_pressure.rear_in}</p>
                      )}
                      <span className="text-sm text-gray-600">PSI</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">TIRE PRESSURE OUT:</span>
                    </div>
                    <div className="grid grid-cols-[auto,1fr,auto] gap-2 items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">FRONT</span>
                      {isEditing ? (
                        <input
                          type="number"
                          name="tire_pressure.front_out"
                          value={editForm.tire_pressure.front_out}
                          onChange={handleInputChange}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold">{repair.tire_pressure.front_out}</p>
                      )}
                      <span className="text-sm text-gray-600">PSI</span>
                    </div>
                    <div className="grid grid-cols-[auto,1fr,auto] gap-2 items-center">
                      <span className="text-sm font-medium text-gray-700">REAR</span>
                      {isEditing ? (
                        <input
                          type="number"
                          name="tire_pressure.rear_out"
                          value={editForm.tire_pressure.rear_out}
                          onChange={handleInputChange}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-lg font-semibold">{repair.tire_pressure.rear_out}</p>
                      )}
                      <span className="text-sm text-gray-600">PSI</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Diagnostic File */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-blue-900">Diagnostic File</h3>
                {repair.diagnostic_file_name && !isEditing && (
                  <p className="text-sm text-blue-700 mt-1">
                    {repair.diagnostic_file_name}
                  </p>
                )}
              </div>
              {isEditing ? (
                <div>
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {newDiagnosticFile && (
                    <p className="mt-1 text-sm text-blue-600">
                      Selected: {newDiagnosticFile.name}
                    </p>
                  )}
                </div>
              ) : repair.diagnostic_file_id ? (
                <button
                  onClick={handleViewDiagnostic}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {loading ? 'Loading...' : 'View Diagnostic File'}
                </button>
              ) : (
                <p className="text-sm text-gray-500">No diagnostic file attached</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};