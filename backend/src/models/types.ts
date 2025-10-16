export interface Client {
  id: number;
  whatsapp_number: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: number;
  client_id: number;
  service_id: number;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationState {
  id: number;
  whatsapp_number: string;
  current_step: string;
  data: string; // JSON string
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithDetails extends Appointment {
  client_name: string;
  client_whatsapp: string;
  service_name: string;
  service_duration: number;
  service_price: number;
}