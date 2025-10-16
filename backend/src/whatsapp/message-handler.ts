import { Message, Client } from 'whatsapp-web.js';
import { ClientService, ServiceService, AppointmentService, ConversationService } from '../services/database.service';
import { logger } from '../utils/logger';
import { format, addDays, isAfter, isBefore, startOfDay } from 'date-fns';

interface BookingData {
  step: 'initial' | 'waiting_name' | 'selecting_service' | 'selecting_date' | 'selecting_time' | 'confirming';
  name?: string;
  selectedService?: number;
  selectedDate?: string;
  selectedTime?: string;
}

export class WhatsAppMessageHandler {
  private clientService: ClientService;
  private serviceService: ServiceService;
  private appointmentService: AppointmentService;
  private conversationService: ConversationService;

  constructor() {
    this.clientService = new ClientService();
    this.serviceService = new ServiceService();
    this.appointmentService = new AppointmentService();
    this.conversationService = new ConversationService();
  }

  async handleMessage(message: Message, client: Client): Promise<void> {
    // Ignorar mensagens de grupos e próprias mensagens
    if (message.from.includes('@g.us') || message.fromMe) {
      return;
    }

    const phoneNumber = message.from.replace('@c.us', '');
    const messageText = message.body.toLowerCase().trim();

    logger.info(`Mensagem recebida de ${phoneNumber}: ${message.body}`);

    try {
      // Verificar se existe conversa em andamento
      const conversationState = await this.conversationService.getConversationState(phoneNumber);
      
      // Comando para cancelar agendamento
      if (messageText === '/cancelar' || messageText === 'cancelar' || messageText === '"cancelar"') {
        await this.conversationService.clearConversationState(phoneNumber);
        await this.sendMessage(client, message.from, 
          '❌ Agendamento cancelado. Digite "agendar" para começar novamente.');
        return;
      }

      // Iniciar agendamento apenas com comando específico
      if (messageText === '/agendar' || messageText === 'agendar' || messageText === '"agendar"') {
        await this.startBookingFlow(client, message.from, phoneNumber);
        return;
      }

      // Continuar conversa em andamento
      if (conversationState) {
        await this.continueBookingFlow(client, message.from, phoneNumber, messageText, conversationState);
        return;
      }

      // Comandos informativos (sem iniciar agendamento)
      if (messageText === '/info' || messageText === 'info' || messageText === '"info"') {
        await this.sendSalonInfo(client, message.from);
        return;
      }

      if (messageText === '/endereco' || messageText === 'endereco' || messageText === 'endereço' || messageText === '"endereco"') {
        await this.sendSalonAddress(client, message.from);
        return;
      }

      if (messageText === '/contato' || messageText === 'contato' || messageText === '"contato"') {
        await this.sendSalonContact(client, message.from);
        return;
      }

      if (messageText === '/help' || messageText === 'help' || messageText === 'ajuda' || messageText === '"help"') {
        await this.sendHelpMenu(client, message.from);
        return;
      }

      // Resposta padrão para mensagens não reconhecidas
      await this.sendMessage(client, message.from, 
        `😊 Olá! Para fazer um agendamento, digite: *agendar*\n\nOutros comandos disponíveis:\n📋 *info* - Informações do salão\n📍 *endereco* - Nosso endereço\n📞 *contato* - Formas de contato\n❓ *help* - Ajuda`);
      return;

    } catch (error) {
      logger.error('Erro ao processar mensagem:', error);
      await this.sendMessage(client, message.from, 
        '❌ Ocorreu um erro. Tente novamente ou digite "agendar" para começar.');
    }
  }

  private async sendMessage(client: Client, to: string, text: string): Promise<void> {
    try {
      await client.sendMessage(to, text);
    } catch (error) {
      logger.error('Erro ao enviar mensagem:', error);
    }
  }

  private async sendMainMenu(client: Client, to: string): Promise<void> {
    const menuText = `
🌸 *Bem-vindo(a) ao ${process.env.SALON_NAME || 'Salão de Beleza'}!* 🌸

Para agendar um serviço, digite:
📅 *"agendar"* - Fazer novo agendamento

Outras opções:
ℹ️ *"info"* - Informações do salão
📍 *"endereco"* - Nosso endereço
📞 *"contato"* - Formas de contato

_Digite a opção desejada ou "agendar" para começar_`;

    await this.sendMessage(client, to, menuText);
  }

  private async startBookingFlow(client: Client, to: string, phoneNumber: string): Promise<void> {
    // Verificar se cliente já existe
    let existingClient = await this.clientService.getClientByWhatsApp(phoneNumber);
    
    if (existingClient) {
      // Cliente existe, pular para seleção de serviço
      const services = await this.serviceService.getAllActiveServices();
      
      await this.conversationService.saveConversationState(phoneNumber, 'selecting_service', {
        step: 'selecting_service'
      });

      let serviceText = `Olá *${existingClient.name}*! 😊\n\n`;
      serviceText += `📋 *Escolha um serviço:*\n\n`;
      
      services.forEach((service, index) => {
        serviceText += `${index + 1}. *${service.name}*\n`;
        serviceText += `   R$ ${service.price.toFixed(2)} | ⏰ ${service.duration_minutes}min\n`;
        if (service.description) {
          serviceText += `   _${service.description}_\n`;
        }
        serviceText += `\n`;
      });
      
      serviceText += `Digite o *número* do serviço desejado ou /cancelar para sair.`;
      
      await this.sendMessage(client, to, serviceText);
    } else {
      // Cliente novo, pedir nome
      await this.conversationService.saveConversationState(phoneNumber, 'waiting_name', {
        step: 'waiting_name'
      });

      const welcomeText = `
🌸 *Seja bem-vindo(a) ao ${process.env.SALON_NAME || 'Salão de Beleza'}!* 🌸

Para fazer seu agendamento, preciso de algumas informações.

*Como posso te chamar?* 
Digite seu nome completo:`;

      await this.sendMessage(client, to, welcomeText);
    }
  }

  private async continueBookingFlow(
    client: Client, 
    to: string, 
    phoneNumber: string, 
    messageText: string, 
    conversationState: any
  ): Promise<void> {
    const currentData: BookingData = conversationState.data ? JSON.parse(conversationState.data) : {};
    
    switch (conversationState.current_step) {
      case 'waiting_name':
        await this.handleNameInput(client, to, phoneNumber, messageText);
        break;
      
      case 'selecting_service':
        await this.handleServiceSelection(client, to, phoneNumber, messageText, currentData);
        break;
      
      case 'selecting_date':
        await this.handleDateSelection(client, to, phoneNumber, messageText, currentData);
        break;
      
      case 'selecting_time':
        await this.handleTimeSelection(client, to, phoneNumber, messageText, currentData);
        break;
      
      case 'confirming':
        await this.handleConfirmation(client, to, phoneNumber, messageText, currentData);
        break;
    }
  }

  private async handleNameInput(client: Client, to: string, phoneNumber: string, name: string): Promise<void> {
    if (name.length < 2) {
      await this.sendMessage(client, to, '❌ Por favor, digite um nome válido:');
      return;
    }

    // Criar cliente
    await this.clientService.createClient(phoneNumber, name);
    
    // Mostrar serviços
    const services = await this.serviceService.getAllActiveServices();
    
    await this.conversationService.saveConversationState(phoneNumber, 'selecting_service', {
      step: 'selecting_service'
    });

    let serviceText = `Obrigado *${name}*! 😊\n\n`;
    serviceText += `📋 *Escolha um serviço:*\n\n`;
    
    services.forEach((service, index) => {
      serviceText += `${index + 1}. *${service.name}*\n`;
      serviceText += `   R$ ${service.price.toFixed(2)} | ⏰ ${service.duration_minutes}min\n`;
      if (service.description) {
        serviceText += `   _${service.description}_\n`;
      }
      serviceText += `\n`;
    });
    
    serviceText += `Digite o *número* do serviço desejado ou /cancelar para sair.`;
    
    await this.sendMessage(client, to, serviceText);
  }

  private async handleServiceSelection(
    client: Client, 
    to: string, 
    phoneNumber: string, 
    messageText: string, 
    currentData: BookingData
  ): Promise<void> {
    const serviceIndex = parseInt(messageText) - 1;
    const services = await this.serviceService.getAllActiveServices();
    
    if (isNaN(serviceIndex) || serviceIndex < 0 || serviceIndex >= services.length) {
      await this.sendMessage(client, to, '❌ Número inválido. Digite um número da lista de serviços:');
      return;
    }

    const selectedService = services[serviceIndex];
    
    await this.conversationService.saveConversationState(phoneNumber, 'selecting_date', {
      ...currentData,
      step: 'selecting_date',
      selectedService: selectedService.id
    });

    const dateText = `
✅ *${selectedService.name}* selecionado!
💰 Valor: R$ ${selectedService.price.toFixed(2)}
⏰ Duração: ${selectedService.duration_minutes} minutos

📅 *Escolha uma data:*

${this.getAvailableDatesText()}

Digite a data no formato *DD/MM/AAAA* ou /cancelar para sair.`;

    await this.sendMessage(client, to, dateText);
  }

  private async handleDateSelection(
    client: Client, 
    to: string, 
    phoneNumber: string, 
    messageText: string, 
    currentData: BookingData
  ): Promise<void> {
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = messageText.match(dateRegex);
    
    if (!match) {
      await this.sendMessage(client, to, '❌ Formato de data inválido. Use DD/MM/AAAA (exemplo: 25/12/2024):');
      return;
    }

    const [, day, month, year] = match;
    const selectedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    // Validar se a data é futura
    const today = startOfDay(new Date());
    const appointmentDate = new Date(selectedDate);
    
    if (isBefore(appointmentDate, today)) {
      await this.sendMessage(client, to, '❌ Não é possível agendar para datas passadas. Escolha uma data futura:');
      return;
    }

    await this.conversationService.saveConversationState(phoneNumber, 'selecting_time', {
      ...currentData,
      step: 'selecting_time',
      selectedDate: selectedDate
    });

    const timeText = `
📅 Data selecionada: *${day}/${month}/${year}*

⏰ *Escolha um horário disponível:*

${await this.getAvailableTimesText(selectedDate)}

Digite o horário desejado (exemplo: 14:00) ou /cancelar para sair.`;

    await this.sendMessage(client, to, timeText);
  }

  private async handleTimeSelection(
    client: Client, 
    to: string, 
    phoneNumber: string, 
    messageText: string, 
    currentData: BookingData
  ): Promise<void> {
    const timeRegex = /^(\d{1,2}):(\d{2})$/;
    const match = messageText.match(timeRegex);
    
    if (!match) {
      await this.sendMessage(client, to, '❌ Formato de horário inválido. Use HH:MM (exemplo: 14:00):');
      return;
    }

    const selectedTime = match[0];
    
    // Verificar se o horário está disponível
    if (!currentData.selectedService) {
      await this.sendMessage(client, to, '❌ Erro interno. Reinicie o agendamento com /agendar');
      return;
    }

    const isAvailable = await this.appointmentService.isTimeSlotAvailable(
      currentData.selectedDate!, 
      selectedTime, 
      currentData.selectedService
    );

    if (!isAvailable) {
      await this.sendMessage(client, to, '❌ Este horário não está disponível. Escolha outro horário:');
      return;
    }

    await this.conversationService.saveConversationState(phoneNumber, 'confirming', {
      ...currentData,
      step: 'confirming',
      selectedTime: selectedTime
    });

    // Buscar dados do serviço e cliente para confirmação
    const service = await this.serviceService.getServiceById(currentData.selectedService);
    const client_data = await this.clientService.getClientByWhatsApp(phoneNumber);
    
    const confirmationText = `
✅ *Confirme seu agendamento:*

👤 *Nome:* ${client_data?.name}
💅 *Serviço:* ${service?.name}
💰 *Valor:* R$ ${service?.price.toFixed(2)}
📅 *Data:* ${currentData.selectedDate?.split('-').reverse().join('/')}
⏰ *Horário:* ${selectedTime}
⏱️ *Duração:* ${service?.duration_minutes} minutos

Digite *CONFIRMAR* para finalizar ou *CANCELAR* para sair.`;

    await this.sendMessage(client, to, confirmationText);
  }

  private async handleConfirmation(
    client: Client, 
    to: string, 
    phoneNumber: string, 
    messageText: string, 
    currentData: BookingData
  ): Promise<void> {
    if (messageText === 'confirmar') {
      // Criar agendamento
      const client_data = await this.clientService.getClientByWhatsApp(phoneNumber);
      
      if (!client_data || !currentData.selectedService || !currentData.selectedDate || !currentData.selectedTime) {
        await this.sendMessage(client, to, '❌ Erro nos dados. Reinicie com /agendar');
        return;
      }

      await this.appointmentService.createAppointment({
        client_id: client_data.id,
        service_id: currentData.selectedService,
        appointment_date: currentData.selectedDate,
        appointment_time: currentData.selectedTime,
        status: 'confirmed'
      });

      await this.conversationService.clearConversationState(phoneNumber);

      const service = await this.serviceService.getServiceById(currentData.selectedService);
      
      const successText = `
🎉 *Agendamento confirmado com sucesso!*

📋 *Resumo do seu agendamento:*
👤 ${client_data.name}
💅 ${service?.name}
📅 ${currentData.selectedDate.split('-').reverse().join('/')}
⏰ ${currentData.selectedTime}
💰 R$ ${service?.price.toFixed(2)}

📍 *${process.env.SALON_NAME || 'Salão de Beleza'}*
📞 Entre em contato se precisar reagendar ou cancelar.

_Aguardamos você! 💄✨_`;

      await this.sendMessage(client, to, successText);

    } else if (messageText === 'cancelar') {
      await this.conversationService.clearConversationState(phoneNumber);
      await this.sendMessage(client, to, '❌ Agendamento cancelado. Digite /agendar para tentar novamente.');
    } else {
      await this.sendMessage(client, to, 'Digite *CONFIRMAR* para finalizar ou *CANCELAR* para sair.');
    }
  }

  private getAvailableDatesText(): string {
    let datesText = '';
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) { // Próximos 14 dias
      const date = addDays(today, i);
      const dayOfWeek = date.getDay();
      
      // Verificar dias de funcionamento (configurável)
      const businessDays = process.env.BUSINESS_DAYS?.split(',').map(d => parseInt(d)) || [1,2,3,4,5,6];
      
      if (businessDays.includes(dayOfWeek)) {
        const formattedDate = format(date, 'dd/MM/yyyy');
        const weekDay = format(date, 'EEEE', { locale: undefined }); // Você pode adicionar locale pt-BR
        datesText += `📅 ${formattedDate} (${weekDay})\n`;
      }
    }
    
    return datesText;
  }

  private async getAvailableTimesText(date: string): Promise<string> {
    const startHour = parseInt(process.env.BUSINESS_START_HOUR || '8');
    const endHour = parseInt(process.env.BUSINESS_END_HOUR || '18');
    
    let timesText = '';
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 60) { // Intervalos de 1 hora
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        timesText += `⏰ ${time}\n`;
      }
    }
    
    timesText += '\n_Os horários mostrados são exemplos. A disponibilidade real será verificada._';
    
    return timesText;
  }

  // Métodos informativos (não iniciam agendamento)
  private async sendSalonInfo(client: Client, to: string): Promise<void> {
    const infoText = `
ℹ️ *Informações do ${process.env.SALON_NAME || 'Salão de Beleza'}*

🕐 *Horário de Funcionamento:*
Segunda a Sábado: ${process.env.BUSINESS_START_HOUR || '8'}h às ${process.env.BUSINESS_END_HOUR || '18'}h

💅 *Nossos Serviços:*
• Cortes femininos e masculinos
• Escova e hidratação
• Manicure e pedicure
• Design de sobrancelha
• Coloração e luzes

Para agendar, digite: */agendar*`;

    await this.sendMessage(client, to, infoText);
  }

  private async sendSalonAddress(client: Client, to: string): Promise<void> {
    const addressText = `
📍 *Nosso Endereço:*

${process.env.SALON_NAME || 'Salão de Beleza'}
Rua das Flores, 123 - Centro
CEP: 14000-000
Ribeirão Preto - SP

🚗 *Como Chegar:*
Próximo ao Shopping Center
Estacionamento gratuito disponível

Para agendar, digite: */agendar*`;

    await this.sendMessage(client, to, addressText);
  }

  private async sendSalonContact(client: Client, to: string): Promise<void> {
    const contactText = `
📞 *Formas de Contato:*

📱 WhatsApp: ${process.env.SALON_PHONE || '(16) 99999-9999'}
📞 Telefone: (16) 3333-4444
📧 Email: contato@salao.com.br
🌐 Instagram: @seusalao

🕐 *Atendimento:*
Segunda a Sábado: ${process.env.BUSINESS_START_HOUR || '8'}h às ${process.env.BUSINESS_END_HOUR || '18'}h

Para agendar pelo WhatsApp, digite: */agendar*`;

    await this.sendMessage(client, to, contactText);
  }

  private async sendHelpMenu(client: Client, to: string): Promise<void> {
    const helpText = `
❓ *Menu de Ajuda - ${process.env.SALON_NAME || 'Salão de Beleza'}*

*Comandos Disponíveis:*
📅 */agendar* - Fazer novo agendamento
ℹ️ */info* - Informações do salão  
📍 */endereco* - Nosso endereço
📞 */contato* - Formas de contato
❌ */cancelar* - Cancelar agendamento em andamento

*Como Agendar:*
1. Digite */agendar*
2. Informe seu nome (se for primeira vez)
3. Escolha o serviço desejado
4. Selecione a data (formato DD/MM/AAAA)
5. Escolha o horário
6. Confirme o agendamento

*Dúvidas?*
Entre em contato: ${process.env.SALON_PHONE || '(16) 99999-9999'}`;

    await this.sendMessage(client, to, helpText);
  }
}