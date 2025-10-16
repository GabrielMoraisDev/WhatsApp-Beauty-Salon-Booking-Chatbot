import express from 'express';
import { AppointmentService, ClientService } from '../services/database.service';

const router = express.Router();
const appointmentService = new AppointmentService();
const clientService = new ClientService();

// GET /api/appointments - Listar todos os agendamentos
router.get('/', async (req, res) => {
  try {
    const appointments = await appointmentService.getAllAppointments();
    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar agendamentos'
    });
  }
});

// GET /api/appointments/date/:date - Listar agendamentos por data
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const appointments = await appointmentService.getAppointmentsByDate(date);
    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar agendamentos'
    });
  }
});

// GET /api/appointments/client/:whatsapp - Listar agendamentos por cliente
router.get('/client/:whatsapp', async (req, res) => {
  try {
    const { whatsapp } = req.params;
    const client = await clientService.getClientByWhatsApp(whatsapp);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }
    
    const appointments = await appointmentService.getAppointmentsByClient(client.id);
    return res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar agendamentos'
    });
  }
});

// POST /api/appointments - Criar novo agendamento
router.post('/', async (req, res) => {
  try {
    const { client_id, service_id, appointment_date, appointment_time, notes } = req.body;
    
    if (!client_id || !service_id || !appointment_date || !appointment_time) {
      return res.status(400).json({
        success: false,
        error: 'Cliente, serviço, data e horário são obrigatórios'
      });
    }
    
    // Verificar disponibilidade
    const isAvailable = await appointmentService.isTimeSlotAvailable(
      appointment_date, 
      appointment_time, 
      service_id
    );
    
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        error: 'Horário não disponível'
      });
    }
    
    const appointment = await appointmentService.createAppointment({
      client_id: parseInt(client_id),
      service_id: parseInt(service_id),
      appointment_date,
      appointment_time,
      status: 'confirmed',
      notes: notes || ''
    });
    
    return res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro ao criar agendamento'
    });
  }
});

// PUT /api/appointments/:id/status - Atualizar status do agendamento
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status inválido'
      });
    }
    
    const appointment = await appointmentService.updateAppointmentStatus(parseInt(id), status);
    return res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar agendamento'
    });
  }
});

// GET /api/appointments/availability/:date/:time/:serviceId - Verificar disponibilidade
router.get('/availability/:date/:time/:serviceId', async (req, res) => {
  try {
    const { date, time, serviceId } = req.params;
    const isAvailable = await appointmentService.isTimeSlotAvailable(
      date, 
      time, 
      parseInt(serviceId)
    );
    
    res.json({
      success: true,
      data: { available: isAvailable }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar disponibilidade'
    });
  }
});

export default router;