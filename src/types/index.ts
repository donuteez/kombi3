export interface RepairSheet {
  id: string;
  created_at: string;
  technician_name: string;
  ro_number: string;
  customer_name?: string;
  vehicle_mileage?: number;
  customer_concern?: string;
  recommendations?: string;
  shop_recommendations?: string;
  tire_tread: TireMeasurements;
  brake_pads: BrakeMeasurements;
  tire_pressure: TirePressure;
  diagnostic_file_id?: string;
  diagnostic_file_name?: string;
}

export interface TireMeasurements {
  lf: number; // Left Front (in 32nds of an inch)
  rf: number; // Right Front 
  lr: number; // Left Rear
  rr: number; // Right Rear
}

export interface BrakeMeasurements {
  lf: number; // Left Front (in mm)
  rf: number; // Right Front
  lr: number; // Left Rear
  rr: number; // Right Rear
}

export interface TirePressure {
  front_in: number; // Front tires pressure coming in (PSI)
  front_out: number; // Front tires pressure going out (PSI)
  rear_in: number; // Rear tires pressure coming in (PSI)
  rear_out: number; // Rear tires pressure going out (PSI)
}

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
}