import { Client } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { WhatsAppMessageHandler } from './message-handler';
import { logger } from '../utils/logger';

export class WhatsAppService {
  private client: Client;
  private messageHandler: WhatsAppMessageHandler;
  private isReady: boolean = false;

  constructor() {
    this.client = new Client({
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      },
      session: undefined // Para permitir nova sessão a cada restart
    });

    this.messageHandler = new WhatsAppMessageHandler();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('qr', (qr) => {
      logger.info('QR Code gerado. Escaneie com seu WhatsApp:');
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      logger.info('Cliente WhatsApp está pronto!');
      this.isReady = true;
    });

    this.client.on('authenticated', () => {
      logger.info('WhatsApp autenticado com sucesso!');
    });

    this.client.on('auth_failure', (msg) => {
      logger.error('Falha na autenticação WhatsApp:', msg);
    });

    this.client.on('disconnected', (reason) => {
      logger.warn('WhatsApp desconectado:', reason);
      this.isReady = false;
    });

    this.client.on('message', async (message) => {
      try {
        await this.messageHandler.handleMessage(message, this.client);
      } catch (error) {
        logger.error('Erro ao processar mensagem:', error);
      }
    });
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Iniciializando cliente WhatsApp...');
      await this.client.initialize();
    } catch (error) {
      logger.error('Erro ao inicializar WhatsApp:', error);
      throw error;
    }
  }

  async destroy(): Promise<void> {
    try {
      await this.client.destroy();
      this.isReady = false;
      logger.info('Cliente WhatsApp finalizado.');
    } catch (error) {
      logger.error('Erro ao finalizar WhatsApp:', error);
    }
  }

  getClient(): Client {
    return this.client;
  }

  isClientReady(): boolean {
    return this.isReady;
  }
}