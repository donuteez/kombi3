import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { useToast } from '../hooks/useToast';
import { TireMeasurements, BrakeMeasurements, TirePressure } from '../types';
import { getTechnicianName, saveTechnicianName } from '../utils/storage';

interface RepairFormProps {
  onComplete: () => void;
  editId?: string;
}

export const RepairForm: React.FC<RepairFormProps> = ({ onComplete, editId }) => {
  const { supabase } = useSupabase();
  const { showToast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticFile, setDiagnosticFile] = useState<File | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);
  
  // Form state
  const [form, setForm] = useState({
    technician_name: '',
    ro_number: '',
    customer_first_name: '',
    customer_last_name: '',
    vehicle_mileage_in: '',
    vehicle_mileage_out: '',
    customer_concern: '',
    recommendations: '',
    shop_recommendations: '',
    tire_tread: {
      lf: '',
      rf: '',
      lr: '',
      rr: ''
    },
    brake_pads: {
      lf: '',
      rf: '',
      lr: '',
      rr: ''
    },
    tire_pressure: {
      front_left_in: '',
      front_right_in: '',
      front_out: '',
      rear_left_in: '',
      rear_right_in: '',
      rear_out: ''
    },
    front_brake_pad_unit: 'MM' as 'MM' | '%',
    rear_brake_pad_unit: 'MM' as 'MM' | '%'
  });

  // Load repair data if in edit mode
  useEffect(() => {
    const loadRepairData = async () => {
      if (!editId) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('repair_sheets')
          .select('*')
          .eq('id', editId)
          .single();
          
        if (error) throw error;
        
        if (data) {
          // Handle backward compatibility for tire pressure
          const tirePressure = data.tire_pressure;
          let frontLeftIn = tirePressure.front_left_in;
          let frontRightIn = tirePressure.front_right_in;
          let rearLeftIn = tirePressure.rear_left_in;
          let rearRightIn = tirePressure.rear_right_in;
          
          // If the old front_in field exists and new fields don't, use front_in for both
          if (tirePressure.front_in !== undefined && (frontLeftIn === undefined || frontRightIn === undefined)) {
            frontLeftIn = tirePressure.front_in;
            frontRightIn = tirePressure.front_in;
          }
          
          // If the old rear_in field exists and new fields don't, use rear_in for both
          if (tirePressure.rear_in !== undefined && (rearLeftIn === undefined || rearRightIn === undefined)) {
            rearLeftIn = tirePressure.rear_in;
            rearRightIn = tirePressure.rear_in;
          }
          
          setForm({
            technician_name: data.technician_name,
            ro_number: data.ro_number,
            customer_first_name: data.customer_first_name || '',
            customer_last_name: data.customer_last_name || '',
            vehicle_mileage_in: data.vehicle_mileage_in?.toString() || '',
            vehicle_mileage_out: data.vehicle_mileage_out?.toString() || '',
            customer_concern: data.customer_concern || '',
            recommendations: data.recommendations || '',
            shop_recommendations: data.shop_recommendations || '',
            tire_tread: {
              lf: data.tire_tread.lf.toString(),
              rf: data.tire_tread.rf.toString(),
              lr: data.tire_tread.lr.toString(),
              rr: data.tire_tread.rr.toString()
            },
            brake_pads: {
              lf: data.brake_pads.lf.toString(),
              rf: data.brake_pads.rf.toString(),
              lr: data.brake_pads.lr.toString(),
              rr: data.brake_pads.rr.toString()
            },
            tire_pressure: {
              front_left_in: frontLeftIn?.toString() || '',
              front_right_in: frontRightIn?.toString() || '',
              front_out: data.tire_pressure.front_out?.toString() || '',
              rear_left_in: rearLeftIn?.toString() || '',
              rear_right_in: rearRightIn?.toString() || '',
              rear_out: data.tire_pressure.rear_out?.toString() || ''
            },
            front_brake_pad_unit: data.front_brake_pad_unit || data.brake_pad_unit || 'MM',
            rear_brake_pad_unit: data.rear_brake_pad_unit || data.brake_pad_unit || 'MM'
          });
          
          if (data.diagnostic_file_name) {
            setExistingFileName(data.diagnostic_file_name);
          }
        }
      } catch (error) {
        showToast({
          id: Date.now().toString(),
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load repair data',
          type: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadRepairData();
  }, [editId, supabase, showToast]);

  // Load saved technician name on mount (only for new repairs)
  useEffect(() => {
    if (!editId) {
      const savedTechName = getTechnicianName();
      if (savedTechName) {
        setForm(prev => ({
          ...prev,
          technician_name: savedTechName
        }));
      }
    }
  }, [editId]);
  
  // Handle text/number input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle nested properties (tire measurements, brake measurements, tire pressure)
    if (name.includes('.')) {
      const [category, field] = name.split('.');
      setForm({
        ...form,
        [category]: {
          ...form[category as keyof typeof form],
          [field]: value
        }
      });
    } else {
      setForm({
        ...form,
        [name]: value
      });
    }
  };
  
  // Handle file input changes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Only accept text files
      if (file.type === 'text/plain') {
        setDiagnosticFile(file);
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form
      if (!form.technician_name.trim() || !form.ro_number.trim()) {
        throw new Error('Technician name and RO number are required');
      }
      
      // Save technician name (only for new repairs)
      if (!editId) {
        saveTechnicianName(form.technician_name.trim());
      }
      
      // Format the data
      const formattedData = {
        technician_name: form.technician_name.trim(),
        ro_number: form.ro_number.trim(),
        customer_first_name: form.customer_first_name.trim() || null,
        customer_last_name: form.customer_last_name.trim() || null,
        vehicle_mileage_in: form.vehicle_mileage_in ? parseInt(form.vehicle_mileage_in) : null,
        vehicle_mileage_out: form.vehicle_mileage_out ? parseInt(form.vehicle_mileage_out) : null,
        customer_concern: form.customer_concern.trim(),
        recommendations: form.recommendations.trim(),
        shop_recommendations: form.shop_recommendations.trim(),
        tire_tread: {
          lf: form.tire_tread.lf ? parseInt(form.tire_tread.lf) : 0,
          rf: form.tire_tread.rf ? parseInt(form.tire_tread.rf) : 0,
          lr: form.tire_tread.lr ? parseInt(form.tire_tread.lr) : 0,
          rr: form.tire_tread.rr ? parseInt(form.tire_tread.rr) : 0
        } as TireMeasurements,
        brake_pads: {
          lf: form.brake_pads.lf ? parseInt(form.brake_pads.lf) : 0,
          rf: form.brake_pads.rf ? parseInt(form.brake_pads.rf) : 0,
          lr: form.brake_pads.lr ? parseInt(form.brake_pads.lr) : 0,
          rr: form.brake_pads.rr ? parseInt(form.brake_pads.rr) : 0
        } as BrakeMeasurements,
        tire_pressure: {
          front_left_in: form.tire_pressure.front_left_in ? parseInt(form.tire_pressure.front_left_in) : 0,
          front_right_in: form.tire_pressure.front_right_in ? parseInt(form.tire_pressure.front_right_in) : 0,
          front_out: form.tire_pressure.front_out ? parseInt(form.tire_pressure.front_out) : 0,
          rear_left_in: form.tire_pressure.rear_left_in ? parseInt(form.tire_pressure.rear_left_in) : 0,
          rear_right_in: form.tire_pressure.rear_right_in ? parseInt(form.tire_pressure.rear_right_in) : 0,
          rear_out: form.tire_pressure.rear_out ? parseInt(form.tire_pressure.rear_out) : 0
        } as TirePressure,
        front_brake_pad_unit: form.front_brake_pad_unit,
        rear_brake_pad_unit: form.rear_brake_pad_unit,
        brake_pad_unit: form.front_brake_pad_unit // Keep for backward compatibility
      };
      
      // Upload diagnostic file if provided
      let fileData = null;
      if (diagnosticFile) {
        const filename = `${Date.now()}_${diagnosticFile.name}`;
        const { data: fileUploadData, error: fileUploadError } = await supabase.storage
          .from('diagnostic-files')
          .upload(filename, diagnosticFile);
          
        if (fileUploadError) {
          throw new Error(`File upload failed: ${fileUploadError.message}`);
        }
        
        fileData = {
          diagnostic_file_id: fileUploadData.path,
          diagnostic_file_name: diagnosticFile.name
        };
      }
      
      let result;
      if (editId) {
        // Update existing repair sheet
        result = await supabase
          .from('repair_sheets')
          .update({ 
            ...formattedData,
            ...(fileData && fileData) // Only include file data if a new file was uploaded
          })
          .eq('id', editId)
          .select();
      } else {
        // Create new repair sheet
        result = await supabase
          .from('repair_sheets')
          .insert([{ 
            ...formattedData,
            ...fileData
          }])
          .select();
      }
      
      if (result.error) {
        throw new Error(`Form submission failed: ${result.error.message}`);
      }
      
      showToast({
        id: Date.now().toString(),
        title: 'Success!',
        description: editId ? 'Repair sheet has been updated' : 'Repair sheet has been saved',
        type: 'success'
      });
      
      // Reset form and redirect
      onComplete();
      
    } catch (error) {
      showToast({
        id: Date.now().toString(),
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
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
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {editId ? 'Edit Repair Sheet' : 'New Repair Sheet'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Technician, RO Number, and Vehicle Mileage */}
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technician Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="technician_name"
                value={form.technician_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RO # <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="ro_number"
                value={form.ro_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Mileage In
              </label>
              <input
                type="number"
                name="vehicle_mileage_in"
                value={form.vehicle_mileage_in}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Mileage Out
              </label>
              <input
                type="number"
                name="vehicle_mileage_out"
                value={form.vehicle_mileage_out}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Customer Name Fields */}
          <div className="flex gap-4">
            <div className="w-1/4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer First Name
              </label>
              <input
                type="text"
                name="customer_first_name"
                value={form.customer_first_name}
                onChange={handleChange}
                placeholder="John"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-3/8">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Last Name
              </label>
              <input
                type="text"
                name="customer_last_name"
                value={form.customer_last_name}
                onChange={handleChange}
                placeholder="Smith"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Customer Concern */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Technician Notes Addressing Customer Concern
            </label>
            <textarea
              name="customer_concern"
              value={form.customer_concern}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Recommendations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recommendations
            </label>
            <textarea
              name="recommendations"
              value={form.recommendations}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Kombi Haus Recommendations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kombi Haus Recommendations
            </label>
            <textarea
              name="shop_recommendations"
              value={form.shop_recommendations}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Measurements Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Tire Tread Measurements */}
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Tire Tread</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Left Front</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        name="tire_tread.lf"
                        value={form.tire_tread.lf}
                        onChange={handleChange}
                        className="w-16 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-600">/32</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Left Rear</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        name="tire_tread.lr"
                        value={form.tire_tread.lr}
                        onChange={handleChange}
                        className="w-16 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-600">/32</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Right Front</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        name="tire_tread.rf"
                        value={form.tire_tread.rf}
                        onChange={handleChange}
                        className="w-16 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-600">/32</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Right Rear</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        name="tire_tread.rr"
                        value={form.tire_tread.rr}
                        onChange={handleChange}
                        className="w-16 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-600">/32</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Brake Pad Measurements */}
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Brake Pads</h3>
              
              {/* Front Brake Pads */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-medium text-gray-700">Front Wheels</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${form.front_brake_pad_unit === 'MM' ? 'text-blue-600' : 'text-gray-500'}`}>MM</span>
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, front_brake_pad_unit: prev.front_brake_pad_unit === 'MM' ? '%' : 'MM' }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        form.front_brake_pad_unit === '%' ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          form.front_brake_pad_unit === '%' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-sm font-medium ${form.front_brake_pad_unit === '%' ? 'text-blue-600' : 'text-gray-500'}`}>%</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Left Front</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        name="brake_pads.lf"
                        value={form.brake_pads.lf}
                        onChange={handleChange}
                        className="w-16 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-600">{form.front_brake_pad_unit}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Right Front</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        name="brake_pads.rf"
                        value={form.brake_pads.rf}
                        onChange={handleChange}
                        className="w-16 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-600">{form.front_brake_pad_unit}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rear Brake Pads */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-medium text-gray-700">Rear Wheels</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${form.rear_brake_pad_unit === 'MM' ? 'text-blue-600' : 'text-gray-500'}`}>MM</span>
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, rear_brake_pad_unit: prev.rear_brake_pad_unit === 'MM' ? '%' : 'MM' }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        form.rear_brake_pad_unit === '%' ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          form.rear_brake_pad_unit === '%' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-sm font-medium ${form.rear_brake_pad_unit === '%' ? 'text-blue-600' : 'text-gray-500'}`}>%</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Left Rear</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        name="brake_pads.lr"
                        value={form.brake_pads.lr}
                        onChange={handleChange}
                        className="w-16 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-600">{form.rear_brake_pad_unit}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Right Rear</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        name="brake_pads.rr"
                        value={form.brake_pads.rr}
                        onChange={handleChange}
                        className="w-16 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-600">{form.rear_brake_pad_unit}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tire Pressure Readings */}
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Tire Pressure</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">TIRE PRESSURE IN:</span>
                  </div>
                  
                  {/* Front Row - Left and Right side by side */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-medium text-gray-600">FRONT</div>
                      <div className="text-xs text-gray-600">PSI</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <span className="text-xs text-gray-600 mr-1">LEFT</span>
                        <input
                          type="number"
                          name="tire_pressure.front_left_in"
                          value={form.tire_pressure.front_left_in}
                          onChange={handleChange}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-600 mr-1">RIGHT</span>
                        <input
                          type="number"
                          name="tire_pressure.front_right_in"
                          value={form.tire_pressure.front_right_in}
                          onChange={handleChange}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rear Row - Left and Right side by side */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-medium text-gray-600">REAR</div>
                      <div className="text-xs text-gray-600">PSI</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <span className="text-xs text-gray-600 mr-1">LEFT</span>
                        <input
                          type="number"
                          name="tire_pressure.rear_left_in"
                          value={form.tire_pressure.rear_left_in}
                          onChange={handleChange}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-600 mr-1">RIGHT</span>
                        <input
                          type="number"
                          name="tire_pressure.rear_right_in"
                          value={form.tire_pressure.rear_right_in}
                          onChange={handleChange}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">TIRE PRESSURE OUT:</span>
                  </div>
                  <div className="grid grid-cols-[auto,1fr,auto] gap-2 items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">FRONT</span>
                    <input
                      type="number"
                      name="tire_pressure.front_out"
                      value={form.tire_pressure.front_out}
                      onChange={handleChange}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">PSI</span>
                  </div>
                  <div className="grid grid-cols-[auto,1fr,auto] gap-2 items-center">
                    <span className="text-sm font-medium text-gray-700">REAR</span>
                    <input
                      type="number"
                      name="tire_pressure.rear_out"
                      value={form.tire_pressure.rear_out}
                      onChange={handleChange}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">PSI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnostic File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diagnostic Text File
            </label>
            {existingFileName && !diagnosticFile && (
              <p className="mb-2 text-sm text-gray-600">
                Current file: {existingFileName}
              </p>
            )}
            <input
              type="file"
              accept=".txt"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {diagnosticFile && (
              <p className="mt-1 text-sm text-gray-500">
                Selected file: {diagnosticFile.name}
              </p>
            )}
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => onComplete()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 bg-blue-600 text-white rounded-md ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
              } transition-colors`}
            >
              {isSubmitting ? 'Submitting...' : editId ? 'Update Repair Sheet' : 'Submit Repair Sheet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};