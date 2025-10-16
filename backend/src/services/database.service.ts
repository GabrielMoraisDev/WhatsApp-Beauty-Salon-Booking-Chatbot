import { database } from '../database/database';
import { Client, Service, Appointment, ConversationState, AppointmentWithDetails } from '../models/types';

export class ClientService {
  async createClient(whatsappNumber: string, name: string): Promise<Client> {
    const result = await database.run(
      'INSERT INTO clients (whatsapp_number, name) VALUES (?, ?)',
      [whatsappNumber, name]
    );
    
    const client = await database.get(
      'SELECT * FROM clients WHERE id = ?',
      [result.lastID]
    );
    
    return client;
  }

  async getClientByWhatsApp(whatsappNumber: string): Promise<Client | null> {
    const client = await database.get(
      'SELECT * FROM clients WHERE whatsapp_number = ?',
      [whatsappNumber]
    );
    
    return client || null;
  }

  async updateClient(id: number, name: string): Promise<Client> {
    await database.run(
      'UPDATE clients SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, id]
    );
    
    const client = await database.get('SELECT * FROM clients WHERE id = ?', [id]);
    return client;
  }

  async getAllClients(): Promise<Client[]> {
    const clients = await database.all('SELECT * FROM clients ORDER BY name');
    return clients;
  }
}

export class ServiceService {
  async getAllActiveServices(): Promise<Service[]> {
    const services = await database.all(
      'SELECT * FROM services WHERE is_active = 1 ORDER BY name'
    );
    return services;
  }

  async getServiceById(id: number): Promise<Service | null> {
    const service = await database.get('SELECT * FROM services WHERE id = ?', [id]);
    return service || null;
  }

  async createService(service: Omit<Service, 'id' | 'created_at' | 'updated_at'>): Promise<Service> {
    const result = await database.run(
      `INSERT INTO services (name, description, duration_minutes, price, is_active) 
       VALUES (?, ?, ?, ?, ?)`,
      [service.name, service.description, service.duration_minutes, service.price, service.is_active]
    );
    
    const newService = await database.get('SELECT * FROM services WHERE id = ?', [result.lastID]);
    return newService;
  }

  async updateService(id: number, service: Partial<Omit<Service, 'id' | 'created_at' | 'updated_at'>>): Promise<Service> {
    const fields = [];
    const values = [];
    
    if (service.name !== undefined) {
      fields.push('name = ?');
      values.push(service.name);
    }
    if (service.description !== undefined) {
      fields.push('description = ?');
      values.push(service.description);
    }
    if (service.duration_minutes !== undefined) {
      fields.push('duration_minutes = ?');
      values.push(service.duration_minutes);
    }
    if (service.price !== undefined) {
      fields.push('price = ?');
      values.push(service.price);
    }
    if (service.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(service.is_active);
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    await database.run(
      `UPDATE services SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    const updatedService = await database.get('SELECT * FROM services WHERE id = ?', [id]);
    return updatedService;
  }
}

export class AppointmentService {
  async createAppointment(appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Promise<Appointment> {
    const result = await database.run(
      `INSERT INTO appointments (client_id, service_id, appointment_date, appointment_time, status, notes) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [appointment.client_id, appointment.service_id, appointment.appointment_date, 
       appointment.appointment_time, appointment.status, appointment.notes]
    );
    
    const newAppointment = await database.get('SELECT * FROM appointments WHERE id = ?', [result.lastID]);
    return newAppointment;
  }

  async getAppointmentsByDate(date: string): Promise<AppointmentWithDetails[]> {
    const appointments = await database.all(`
      SELECT 
        a.*,
        c.name as client_name,
        c.whatsapp_number as client_whatsapp,
        s.name as service_name,
        s.duration_minutes as service_duration,
        s.price as service_price
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      JOIN services s ON a.service_id = s.id
      WHERE a.appointment_date = ?
      ORDER BY a.appointment_time
    `, [date]);
    
    return appointments;
  }

  async getAppointmentsByClient(clientId: number): Promise<AppointmentWithDetails[]> {
    const appointments = await database.all(`
      SELECT 
        a.*,
        c.name as client_name,
        c.whatsapp_number as client_whatsapp,
        s.name as service_name,
        s.duration_minutes as service_duration,
        s.price as service_price
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      JOIN services s ON a.service_id = s.id
      WHERE a.client_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `, [clientId]);
    
    return appointments;
  }

  async getAllAppointments(): Promise<AppointmentWithDetails[]> {
    const appointments = await database.all(`
      SELECT 
        a.*,
        c.name as client_name,
        c.whatsapp_number as client_whatsapp,
        s.name as service_name,
        s.duration_minutes as service_duration,
        s.price as service_price
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      JOIN services s ON a.service_id = s.id
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `);
    
    return appointments;
  }

  async updateAppointmentStatus(id: number, status: string): Promise<Appointment> {
    await database.run(
      'UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
    
    const appointment = await database.get('SELECT * FROM appointments WHERE id = ?', [id]);
    return appointment;
  }

  async isTimeSlotAvailable(date: string, time: string, serviceId: number): Promise<boolean> {
    const service = await database.get('SELECT duration_minutes FROM services WHERE id = ?', [serviceId]);
    
    if (!service) return false;
    
    // Verificar se já existe agendamento no mesmo horário
    const existingAppointment = await database.get(`
      SELECT a.id, s.duration_minutes 
      FROM appointments a 
      JOIN services s ON a.service_id = s.id 
      WHERE a.appointment_date = ? 
        AND a.appointment_time = ? 
        AND a.status NOT IN ('cancelled')
    `, [date, time]);
    
    return !existingAppointment;
  }
}

export class ConversationService {
  async saveConversationState(whatsappNumber: string, step: string, data: any): Promise<void> {
    const dataJson = JSON.stringify(data);
    
    await database.run(`
      INSERT INTO conversation_states (whatsapp_number, current_step, data) 
      VALUES (?, ?, ?)
      ON CONFLICT(whatsapp_number) 
      DO UPDATE SET 
        current_step = excluded.current_step,
        data = excluded.data,
        updated_at = CURRENT_TIMESTAMP
    `, [whatsappNumber, step, dataJson]);
  }

  async getConversationState(whatsappNumber: string): Promise<ConversationState | null> {
    const state = await database.get(
      'SELECT * FROM conversation_states WHERE whatsapp_number = ?',
      [whatsappNumber]
    );
    
    return state || null;
  }

  async clearConversationState(whatsappNumber: string): Promise<void> {
    await database.run(
      'DELETE FROM conversation_states WHERE whatsapp_number = ?',
      [whatsappNumber]
    );
  }
}