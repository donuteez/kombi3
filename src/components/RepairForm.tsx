import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { useToast } from '../hooks/useToast';
import { Upload } from 'lucide-react';
import { uploadFile } from '../utils/storage';

interface TireTread {
  lf: number;
  rf: number;
  lr: number;
  rr: number;
}

interface BrakePads {
  lf: number;
  rf: number;
  lr: number;
  rr: number;
}

interface TirePressure {
  front_in: number;
  front_out: number;
  rear_in: number;
  rear_out: number;
}

interface RepairSheet {
  technician_name: string;
  ro_number: string;
  vehicle_mileage?: number;
  customer_concern?: string;
  recommendations?: string;
  shop_recommendations?: string;
  tire_tread: TireTread;
  brake_pads: BrakePads;
  tire_pressure: TirePressure;
  diagnostic_file_id?: string;
  diagnostic_file_name?: string;
  customer_name?: string;
}

export default function RepairForm() {
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<RepairSheet>({
    technician_name: '',
    ro_number: '',
    vehicle_mileage: undefined,
    customer_concern: '',
    recommendations: '',
    shop_recommendations: '',
    tire_tread: { lf: 0, rf: 0, lr: 0, rr: 0 },
    brake_pads: { lf: 0, rf: 0, lr: 0, rr: 0 },
    tire_pressure: { front_in: 0, front_out: 0, rear_in: 0, rear_out: 0 },
    customer_name: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMeasurementChange = (category: 'tire_tread' | 'brake_pads' | 'tire_pressure', field: string, value: string) => {
    const numValue = value === '' ? 0 : Number(value);
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: numValue
      }
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let fileId = '';
      let fileName = '';

      if (selectedFile) {
        const { fileId: uploadedFileId, fileName: uploadedFileName } = await uploadFile(selectedFile);
        fileId = uploadedFileId;
        fileName = uploadedFileName;
      }

      const { error } = await supabase
        .from('repair_sheets')
        .insert([{
          ...formData,
          diagnostic_file_id: fileId || null,
          diagnostic_file_name: fileName || null
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Repair sheet created successfully",
      });

      navigate('/');
    } catch (error) {
      console.error('Error creating repair sheet:', error);
      toast({
        title: "Error",
        description: "Failed to create repair sheet",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="technician_name" className="block text-sm font-medium text-gray-700">
              Technician Name
            </label>
            <input
              type="text"
              id="technician_name"
              name="technician_name"
              required
              value={formData.technician_name}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="ro_number" className="block text-sm font-medium text-gray-700">
              RO Number
            </label>
            <input
              type="text"
              id="ro_number"
              name="ro_number"
              required
              value={formData.ro_number}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700">
              Customer Name
            </label>
            <input
              type="text"
              id="customer_name"
              name="customer_name"
              value={formData.customer_name || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="vehicle_mileage" className="block text-sm font-medium text-gray-700">
              Vehicle Mileage
            </label>
            <input
              type="number"
              id="vehicle_mileage"
              name="vehicle_mileage"
              value={formData.vehicle_mileage || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Measurements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tire Tread */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Tire Tread</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="tire_tread_lf" className="block text-sm font-medium text-gray-700">Left Front</label>
                <input
                  type="number"
                  id="tire_tread_lf"
                  value={formData.tire_tread.lf}
                  onChange={(e) => handleMeasurementChange('tire_tread', 'lf', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="tire_tread_rf" className="block text-sm font-medium text-gray-700">Right Front</label>
                <input
                  type="number"
                  id="tire_tread_rf"
                  value={formData.tire_tread.rf}
                  onChange={(e) => handleMeasurementChange('tire_tread', 'rf', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="tire_tread_lr" className="block text-sm font-medium text-gray-700">Left Rear</label>
                <input
                  type="number"
                  id="tire_tread_lr"
                  value={formData.tire_tread.lr}
                  onChange={(e) => handleMeasurementChange('tire_tread', 'lr', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="tire_tread_rr" className="block text-sm font-medium text-gray-700">Right Rear</label>
                <input
                  type="number"
                  id="tire_tread_rr"
                  value={formData.tire_tread.rr}
                  onChange={(e) => handleMeasurementChange('tire_tread', 'rr', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Brake Pads */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Brake Pads</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="brake_pads_lf" className="block text-sm font-medium text-gray-700">Left Front</label>
                <input
                  type="number"
                  id="brake_pads_lf"
                  value={formData.brake_pads.lf}
                  onChange={(e) => handleMeasurementChange('brake_pads', 'lf', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="brake_pads_rf" className="block text-sm font-medium text-gray-700">Right Front</label>
                <input
                  type="number"
                  id="brake_pads_rf"
                  value={formData.brake_pads.rf}
                  onChange={(e) => handleMeasurementChange('brake_pads', 'rf', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="brake_pads_lr" className="block text-sm font-medium text-gray-700">Left Rear</label>
                <input
                  type="number"
                  id="brake_pads_lr"
                  value={formData.brake_pads.lr}
                  onChange={(e) => handleMeasurementChange('brake_pads', 'lr', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="brake_pads_rr" className="block text-sm font-medium text-gray-700">Right Rear</label>
                <input
                  type="number"
                  id="brake_pads_rr"
                  value={formData.brake_pads.rr}
                  onChange={(e) => handleMeasurementChange('brake_pads', 'rr', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Tire Pressure */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Tire Pressure</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="tire_pressure_front_in" className="block text-sm font-medium text-gray-700">Front In</label>
                <input
                  type="number"
                  id="tire_pressure_front_in"
                  value={formData.tire_pressure.front_in}
                  onChange={(e) => handleMeasurementChange('tire_pressure', 'front_in', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="tire_pressure_front_out" className="block text-sm font-medium text-gray-700">Front Out</label>
                <input
                  type="number"
                  id="tire_pressure_front_out"
                  value={formData.tire_pressure.front_out}
                  onChange={(e) => handleMeasurementChange('tire_pressure', 'front_out', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="tire_pressure_rear_in" className="block text-sm font-medium text-gray-700">Rear In</label>
                <input
                  type="number"
                  id="tire_pressure_rear_in"
                  value={formData.tire_pressure.rear_in}
                  onChange={(e) => handleMeasurementChange('tire_pressure', 'rear_in', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="tire_pressure_rear_out" className="block text-sm font-medium text-gray-700">Rear Out</label>
                <input
                  type="number"
                  id="tire_pressure_rear_out"
                  value={formData.tire_pressure.rear_out}
                  onChange={(e) => handleMeasurementChange('tire_pressure', 'rear_out', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Text Areas */}
        <div className="space-y-6">
          <div>
            <label htmlFor="customer_concern" className="block text-sm font-medium text-gray-700">
              Customer Concern
            </label>
            <textarea
              id="customer_concern"
              name="customer_concern"
              rows={4}
              value={formData.customer_concern || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="recommendations" className="block text-sm font-medium text-gray-700">
              Recommendations
            </label>
            <textarea
              id="recommendations"
              name="recommendations"
              rows={4}
              value={formData.recommendations || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="shop_recommendations" className="block text-sm font-medium text-gray-700">
              Shop Recommendations
            </label>
            <textarea
              id="shop_recommendations"
              name="shop_recommendations"
              rows={4}
              value={formData.shop_recommendations || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Diagnostic File
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                PDF, PNG, JPG up to 10MB
              </p>
              {selectedFile && (
                <p className="text-sm text-gray-500">
                  Selected file: {selectedFile.name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Creating...' : 'Create Repair Sheet'}
        </button>
      </div>
    </form>
  );
}