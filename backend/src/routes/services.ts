import express from 'express';
import { ServiceService } from '../services/database.service';

const router = express.Router();
const serviceService = new ServiceService();

// GET /api/services - Listar todos os serviços ativos
router.get('/', async (req, res) => {
  try {
    const services = await serviceService.getAllActiveServices();
    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar serviços'
    });
  }
});

// GET /api/services/:id - Buscar serviço por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const service = await serviceService.getServiceById(parseInt(id));
    
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Serviço não encontrado'
      });
    }
    
    return res.json({
      success: true,
      data: service
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar serviço'
    });
  }
});

// POST /api/services - Criar novo serviço
router.post('/', async (req, res) => {
  try {
    const { name, description, duration_minutes, price } = req.body;
    
    if (!name || !duration_minutes || !price) {
      return res.status(400).json({
        success: false,
        error: 'Nome, duração e preço são obrigatórios'
      });
    }
    
    const service = await serviceService.createService({
      name,
      description: description || '',
      duration_minutes: parseInt(duration_minutes),
      price: parseFloat(price),
      is_active: true
    });
    
    return res.status(201).json({
      success: true,
      data: service
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro ao criar serviço'
    });
  }
});

// PUT /api/services/:id - Atualizar serviço
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, duration_minutes, price, is_active } = req.body;
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (duration_minutes !== undefined) updateData.duration_minutes = parseInt(duration_minutes);
    if (price !== undefined) updateData.price = parseFloat(price);
    if (is_active !== undefined) updateData.is_active = is_active;
    
    const service = await serviceService.updateService(parseInt(id), updateData);
    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar serviço'
    });
  }
});

export default router;