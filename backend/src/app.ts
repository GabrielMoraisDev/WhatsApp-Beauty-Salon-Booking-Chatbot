import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { database } from './database/database';
import { WhatsAppService } from './whatsapp/whatsapp.service';
import { logger } from './utils/logger';

// Importar rotas
import clientsRouter from './routes/clients';
import servicesRouter from './routes/services';
import appointmentsRouter from './routes/appointments';

// Carregar variáveis de ambiente
dotenv.config();

class App {
  private app: express.Application;
  private whatsappService: WhatsAppService;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000');
    this.whatsappService = new WhatsAppService();
    
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddlewares(): void {
    // Segurança
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3001',
      credentials: true
    }));
    
    // Parser de JSON
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Log de requests
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Rota de health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        whatsapp: this.whatsappService.isClientReady()
      });
    });

    // API Routes
    this.app.use('/api/clients', clientsRouter);
    this.app.use('/api/services', servicesRouter);
    this.app.use('/api/appointments', appointmentsRouter);

    // Rota para informações do salão
    this.app.get('/api/salon-info', (req, res) => {
      res.json({
        success: true,
        data: {
          name: process.env.SALON_NAME || 'Salão de Beleza',
          phone: process.env.SALON_PHONE || '',
          businessHours: {
            start: process.env.BUSINESS_START_HOUR || '8',
            end: process.env.BUSINESS_END_HOUR || '18',
            days: process.env.BUSINESS_DAYS?.split(',') || ['1','2','3','4','5','6']
          }
        }
      });
    });

    // Rota para estatísticas
    this.app.get('/api/stats', async (req, res) => {
      try {
        const totalClients = await database.get('SELECT COUNT(*) as count FROM clients');
        const totalAppointments = await database.get('SELECT COUNT(*) as count FROM appointments');
        const todayAppointments = await database.get(
          'SELECT COUNT(*) as count FROM appointments WHERE appointment_date = DATE("now")'
        );
        const pendingAppointments = await database.get(
          'SELECT COUNT(*) as count FROM appointments WHERE status = "pending"'
        );

        res.json({
          success: true,
          data: {
            totalClients: totalClients.count,
            totalAppointments: totalAppointments.count,
            todayAppointments: todayAppointments.count,
            pendingAppointments: pendingAppointments.count
          }
        });
      } catch (error) {
        logger.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
          success: false,
          error: 'Erro ao buscar estatísticas'
        });
      }
    });

    // 404 Handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Rota não encontrada'
      });
    });
  }

  private setupErrorHandling(): void {
    // Error handler
    this.app.use((err: any, req: any, res: any, next: any) => {
      logger.error('Erro não tratado:', err);
      res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno do servidor'
      });
    });
  }

  async initialize(): Promise<void> {
    try {
      // Inicializar banco de dados
      logger.info('Inicializando banco de dados...');
      await database.init();
      logger.info('Banco de dados inicializado com sucesso!');

      // Inicializar WhatsApp
      logger.info('Inicializando WhatsApp...');
      await this.whatsappService.initialize();

      // Iniciar servidor
      this.app.listen(this.port, () => {
        logger.info(`Servidor rodando na porta ${this.port}`);
        logger.info(`Health check: http://localhost:${this.port}/health`);
        logger.info(`API Base URL: http://localhost:${this.port}/api`);
      });

    } catch (error) {
      logger.error('Erro ao inicializar aplicação:', error);
      process.exit(1);
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Finalizando aplicação...');
    
    try {
      // Finalizar WhatsApp
      await this.whatsappService.destroy();
      
      // Fechar banco de dados
      await database.close();
      
      logger.info('Aplicação finalizada com sucesso!');
      process.exit(0);
    } catch (error) {
      logger.error('Erro ao finalizar aplicação:', error);
      process.exit(1);
    }
  }
}

// Instanciar e inicializar aplicação
const app = new App();

// Handlers para finalização graceful
process.on('SIGINT', () => app.shutdown());
process.on('SIGTERM', () => app.shutdown());

// Inicializar aplicação
app.initialize().catch((error) => {
  logger.error('Erro fatal ao inicializar aplicação:', error);
  process.exit(1);
});