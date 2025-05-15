import React, { useState } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { useToast } from '../hooks/useToast';
import { TireMeasurements, BrakeMeasurements, TirePressure } from '../types';

interface RepairFormProps {
  onComplete: () => void;
}

interface FormState {
  technician_name: string;
  ro_number: string;
  customer_name: string;
  vehicle_mileage: string;
  customer_concern: string;
  recommendations: string;
  shop_recommendations: string;
  tire_tread: {
    lf: number;
    lr: number;
    rf: number;
    rr: number;
  };
  brake_pads: {
    lf: number;
    lr: number;
    rf: number;
    rr: number;
  };
  tire_pressure: {
    front_in: number;
    front_out: number;
    rear_in: number;
    rear_out: number;
  };
  diagnostic_file?: File | null;
}

export const RepairForm: React.FC<RepairFormProps> = ({ onComplete }) => {
  const { supabase } = useSupabase();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState<FormState>({
    technician_name: '',
    ro_number: '',
    customer_name: '',
    vehicle_mileage: '',
    customer_concern: '',
    recommendations: '',
    shop_recommendations: '',
    tire_tread: {
      lf: 0,
      lr: 0,
      rf: 0,
      rr: 0,
    },
    brake_pads: {
      lf: 0,
      lr: 0,
      rf: 0,
      rr: 0,
    },
    tire_pressure: {
      front_in: 0,
      front_out: 0,
      rear_in: 0,
      rear_out: 0,
    },
    diagnostic_file: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form
      if (!form.technician_name.trim() || !form.ro_number.trim()) {
        throw new Error('Technician name and RO number are required');
      }
      
      // Format the data
      const formattedData = {
        technician_name: form.technician_name.trim(),
        ro_number: form.ro_number.trim(),
        customer_name: form.customer_name.trim(),
        vehicle_mileage: form.vehicle_mileage ? parseInt(form.vehicle_mileage) : null,
        customer_concern: form.customer_concern.trim(),
        recommendations: form.recommendations.trim(),
        shop_recommendations: form.shop_recommendations.trim(),
        tire_tread: form.tire_tread,
        brake_pads: form.brake_pads,
        tire_pressure: form.tire_pressure
      };
      
      // Upload diagnostic file if provided
      let fileData = null;
      if (form.diagnostic_file) {
        const filename = `${Date.now()}_${form.diagnostic_file.name}`;
        const { data: fileUploadData, error: fileUploadError } = await supabase.storage
          .from('diagnostic-files')
          .upload(filename, form.diagnostic_file);
          
        if (fileUploadError) {
          throw new Error(`File upload failed: ${fileUploadError.message}`);
        }
        
        fileData = {
          diagnostic_file_id: fileUploadData.path,
          diagnostic_file_name: form.diagnostic_file.name
        };
      }
      
      // Save repair sheet data
      const { error } = await supabase
        .from('repair_sheets')
        .insert([{ 
          ...formattedData,
          ...fileData
        }]);
      
      if (error) {
        throw new Error(`Form submission failed: ${error.message}`);
      }
      
      showToast({
        id: Date.now().toString(),
        title: 'Success!',
        description: 'Repair sheet has been saved',
        type: 'success'
      });
      
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setForm(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof typeof prev],
          [field]: Number(value)
        }
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'text/plain') {
        setForm(prev => ({
          ...prev,
          diagnostic_file: file
        }));
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">New Repair Sheet</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-6">
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
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                name="customer_name"
                value={form.customer_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {/* Measurements Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Tire Tread Measurements */}
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Tire Tread Measurements</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
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
                </div>
                <div className="space-y-4">
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
            </div>
            
            {/* Brake Pad Measurements */}
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Brake Pad Measurements</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
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
                </div>
                <div className="space-y-4">
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
            </div>

            {/* Tire Pressure Readings */}
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Tire Pressure Readings</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">TIRE PRESSURE IN: FRONT</span>
                    <div className="flex items-center">
                      <input
                        type="number"
                        name="tire_pressure.front_in"
                        value={form.tire_pressure.front_in}
                        onChange={handleChange}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-600">PSI</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700 ml-16">REAR</span>
                    <div className="flex items-center">
                      <input
                        type="number"
                        name="tire_pressure.rear_in"
                        value={form.tire_pressure.rear_in}
                        onChange={handleChange}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-600">PSI</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">TIRE PRESSURE OUT: FRONT</span>
                    <div className="flex items-center">
                      <input
                        type="number"
                        name="tire_pressure.front_out"
                        value={form.tire_pressure.front_out}
                        onChange={handleChange}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-600">PSI</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 ml-16">REAR</span>
                    <div className="flex items-center">
                      <input
                        type="number"
                        name="tire_pressure.rear_out"
                        value={form.tire_pressure.rear_out}
                        onChange={handleChange}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-600">PSI</span>
                    </div>
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
            <input
              type="file"
              accept=".txt"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {form.diagnostic_file && (
              <p className="mt-1 text-sm text-gray-500">
                Selected file: {form.diagnostic_file.name}
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

export default RepairForm;