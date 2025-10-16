import express from 'express';
import { ClientService } from '../services/database.service';

const router = express.Router();
const clientService = new ClientService();

// GET /api/clients - Listar todos os clientes
router.get('/', async (req, res) => {
  try {
    const clients = await clientService.getAllClients();
    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar clientes'
    });
  }
});

// GET /api/clients/:whatsapp - Buscar cliente por WhatsApp
router.get('/:whatsapp', async (req, res) => {
  try {
    const { whatsapp } = req.params;
    const client = await clientService.getClientByWhatsApp(whatsapp);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }
    
    return res.json({
      success: true,
      data: client
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar cliente'
    });
  }
});

// POST /api/clients - Criar novo cliente
router.post('/', async (req, res) => {
  try {
    const { whatsapp_number, name } = req.body;
    
    if (!whatsapp_number || !name) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp e nome são obrigatórios'
      });
    }
    
    const client = await clientService.createClient(whatsapp_number, name);
    return res.status(201).json({
      success: true,
      data: client
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro ao criar cliente'
    });
  }
});

// PUT /api/clients/:id - Atualizar cliente
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Nome é obrigatório'
      });
    }
    
    const client = await clientService.updateClient(parseInt(id), name);
    return res.json({
      success: true,
      data: client
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar cliente'
    });
  }
});

export default router;