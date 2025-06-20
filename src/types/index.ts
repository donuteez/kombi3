export interface RepairSheet {
  id: string;
  created_at: string;
  technician_name: string;
  ro_number: string;
  customer_first_name?: string;
  customer_last_name?: string;
  vehicle_mileage_in?: number;
  vehicle_mileage_out?: number;
  customer_concern?: string;
  recommendations?: string;
  shop_recommendations?: string;
  tire_tread: TireMeasurements;
  brake_pads: BrakeMeasurements;
  tire_pressure: TirePressure;
  diagnostic_file_id?: string;
  diagnostic_file_name?: string;
  brake_pad_unit: 'MM' | '%'; // Keep for backward compatibility
  front_brake_pad_unit: 'MM' | '%';
  rear_brake_pad_unit: 'MM' | '%';
}

export interface TireMeasurements {
  lf: number; // Left Front (in 32nds of an inch)
  rf: number; // Right Front 
  lr: number; // Left Rear
  rr: number; // Right Rear
}

export interface BrakeMeasurements {
  lf: number; // Left Front (in mm or %)
  rf: number; // Right Front
  lr: number; // Left Rear
  rr: number; // Right Rear
}

export interface TirePressure {
  front_left_in: number; // Front left tire pressure coming in (PSI)
  front_right_in: number; // Front right tire pressure coming in (PSI)
  front_out: number; // Front tires pressure going out (PSI)
  rear_left_in: number; // Rear left tire pressure coming in (PSI)
  rear_right_in: number; // Rear right tire pressure coming in (PSI)
  rear_out: number; // Rear tires pressure going out (PSI)
}

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
}