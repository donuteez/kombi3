import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { useToast } from '../hooks/useToast';
import { TireMeasurements, BrakeMeasurements, TirePressure } from '../types';
import { getTechnicianName, saveTechnicianName } from '../utils/storage';

interface RepairFormProps {
  onComplete: () => void;
}

export const RepairForm: React.FC<RepairFormProps> = ({ onComplete }) => {
  const { supabase } = useSupabase();
  const { showToast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [diagnosticFile, setDiagnosticFile] = useState<File | null>(null);
  
  // Form state
  const [form, setForm] = useState({
    technician_name: '',
    ro_number: '',
    customer_name: '',
    vehicle_mileage: '',
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
      front_in: '',
      front_out: '',
      rear_in: '',
      rear_out: ''
    }
  });

  // Load saved technician name on mount
  useEffect(() => {
    const savedTechName = getTechnicianName();
    if (savedTechName) {
      setForm(prev => ({
        ...prev,
        technician_name: savedTechName
      }));
    }
  }, []);
  
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
      
      // Save technician name
      saveTechnicianName(form.technician_name.trim());
      
      // Format the data
      const formattedData = {
        technician_name: form.technician_name.trim(),
        ro_number: form.ro_number.trim(),
        customer_name: form.customer_name.trim(),
        vehicle_mileage: form.vehicle_mileage ? parseInt(form.vehicle_mileage) : null,
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
          front_in: form.tire_pressure.front_in ? parseInt(form.tire_pressure.front_in) : 0,
          front_out: form.tire_pressure.front_out ? parseInt(form.tire_pressure.front_out) : 0,
          rear_in: form.tire_pressure.rear_in ? parseInt(form.tire_pressure.rear_in) : 0,
          rear_out: form.tire_pressure.rear_out ? parseInt(form.tire_pressure.rear_out) : 0
        } as TirePressure
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
      
      // Save repair sheet data
      const { data, error } = await supabase
        .from('repair_sheets')
        .insert([{ 
          ...formattedData,
          ...fileData
        }])
        .select();
      
      if (error) {
        throw new Error(`Form submission failed: ${error.message}`);
      }
      
      showToast({
        id: Date.now().toString(),
        title: 'Success!',
        description: 'Repair sheet has been saved',
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
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">New Repair Sheet</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Technician, RO Number, and Vehicle Mileage */}
          <div className="grid md:grid-cols-3 gap-6">
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
                RO Number <span className="text-red-500">*</span>
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
                Vehicle Mileage
              </label>
              <input
                type="number"
                name="vehicle_mileage"
                value={form.vehicle_mileage}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name (Last, First)
            </label>
            <input
              type="text"
              name="customer_name"
              value={form.customer_name}
              onChange={handleChange}
              placeholder="Doe, John"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Customer Concern */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Concern
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
          <div className="grid md:grid-cols-2 gap-6">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shop Recommendations
              </label>
              <textarea
                name="shop_recommendations"
                value={form.shop_recommendations}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Tire Tread Measurements */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Tire Tread Measurements</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Left Front (LF)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="tire_tread.lf"
                    value={form.tire_tread.lf}
                    onChange={handleChange}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-600">/32</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Right Front (RF)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="tire_tread.rf"
                    value={form.tire_tread.rf}
                    onChange={handleChange}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-600">/32</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Left Rear (LR)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="tire_tread.lr"
                    value={form.tire_tread.lr}
                    onChange={handleChange}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-600">/32</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Right Rear (RR)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="tire_tread.rr"
                    value={form.tire_tread.rr}
                    onChange={handleChange}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-600">/32</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Brake Pad Measurements */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Brake Pad Measurements</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Left Front (LF)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="brake_pads.lf"
                    value={form.brake_pads.lf}
                    onChange={handleChange}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-600">MM</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Right Front (RF)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="brake_pads.rf"
                    value={form.brake_pads.rf}
                    onChange={handleChange}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-600">MM</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Left Rear (LR)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="brake_pads.lr"
                    value={form.brake_pads.lr}
                    onChange={handleChange}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-600">MM</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Right Rear (RR)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="brake_pads.rr"
                    value={form.brake_pads.rr}
                    onChange={handleChange}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-600">MM</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tire Pressure Readings */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Tire Pressure Readings (PSI)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Front In</label>
                <input
                  type="number"
                  name="tire_pressure.front_in"
                  value={form.tire_pressure.front_in}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Front Out</label>
                <input
                  type="number"
                  name="tire_pressure.front_out"
                  value={form.tire_pressure.front_out}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rear In</label>
                <input
                  type="number"
                  name="tire_pressure.rear_in"
                  value={form.tire_pressure.rear_in}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rear Out</label>
                <input
                  type="number"
                  name="tire_pressure.rear_out"
                  value={form.tire_pressure.rear_out}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          {/* Diagnostic File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diagnostic Text File
            </label>
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
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 bg-blue-600 text-white rounded-md ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
              } transition-colors`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Repair Sheet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};