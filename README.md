# 💅 WhatsApp Beauty Salon Booking Chatbot - Backend

Sistema de agendamento para salão de beleza integrado com WhatsApp, desenvolvido em Node.js com TypeScript.

## 🚀 Tecnologias

- **Node.js** + **TypeScript**
- **Express.js** - Framework web
- **SQLite** - Banco de dados local
- **WhatsApp Web.js** - Integração com WhatsApp
- **Helmet** + **CORS** - Segurança
- **Winston** - Sistema de logs

## ✨ Funcionalidades

### 💬 Chatbot WhatsApp
- ✅ Integração completa com WhatsApp Web.js
- ✅ Fluxo conversacional intuitivo para agendamentos
- ✅ Gerenciamento de estado de conversas
- ✅ Validação de dados em tempo real
- ✅ Mensagens de confirmação e lembretes

### 📅 Sistema de Agendamentos
- ✅ Criação de agendamentos via WhatsApp
- ✅ Verificação de disponibilidade de horários
- ✅ Gestão de clientes automática
- ✅ Catálogo de serviços configurável
- ✅ Status de agendamentos (pendente, confirmado, concluído, cancelado)

### 🔧 API REST Completa
- ✅ Endpoints para gerenciamento de clientes
- ✅ Endpoints para gerenciamento de serviços
- ✅ Endpoints para gerenciamento de agendamentos
- ✅ Validação de dados
- ✅ Tratamento de erros

### 💾 Banco de Dados
- ✅ SQLite para armazenamento local
- ✅ Estrutura normalizada
- ✅ Migrações automáticas
- ✅ Dados de exemplo pré-configurados

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js v16 ou superior
- NPM ou Yarn
- WhatsApp instalado no celular

### 1. Clone e Instale
\`\`\`bash
# Navegue até a pasta do projeto
cd backend

# Instale as dependências
npm install

# Copie o arquivo de configuração
cp .env.example .env
\`\`\`

### 2. Configure o arquivo .env
\`\`\`env
# Environment Variables
NODE_ENV=development
PORT=3000

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=./sessions

# Database
DATABASE_PATH=./database/salon.db

# Salon Configuration
SALON_PHONE=5516992802418
SALON_NAME=Seu Salão de Beleza

# Business Hours (24h format)
BUSINESS_START_HOUR=8
BUSINESS_END_HOUR=18
BUSINESS_DAYS=1,2,3,4,5,6  # Monday to Saturday (0=Sunday, 6=Saturday)

# Appointment Duration (minutes)
DEFAULT_APPOINTMENT_DURATION=60
\`\`\`

### 3. Execute o Sistema
\`\`\`bash
# Modo desenvolvimento (recarrega automaticamente)
npm run dev

# Ou build e execute em produção
npm run build
npm start
\`\`\`

### 4. Conecte o WhatsApp
1. Execute o sistema
2. Escaneie o QR Code que aparece no terminal com seu WhatsApp
3. Aguarde a confirmação de conexão
4. O chatbot está pronto para uso!

## 📱 Como Usar o Chatbot

### Para Clientes
1. **Iniciar conversa**: Envie qualquer mensagem ou `/agendar`
2. **Informar nome**: Se for primeira vez, informe seu nome
3. **Escolher serviço**: Digite o número do serviço desejado
4. **Selecionar data**: Digite a data no formato DD/MM/AAAA
5. **Escolher horário**: Digite o horário no formato HH:MM
6. **Confirmar**: Digite "CONFIRMAR" para finalizar

### Comandos Disponíveis
- `/agendar` - Iniciar novo agendamento
- `/cancelar` - Cancelar agendamento em andamento
- `/info` - Informações do salão
- `/endereco` - Endereço do salão
- `/contato` - Formas de contato

## � Documentação da API

Base URL: `http://localhost:3000`

### Estrutura de Resposta Padrão

```json
{
  "success": true/false,
  "data": {...},
  "error": "mensagem de erro (se houver)"
}
```

---

## 📊 **Rotas de Sistema**

### Health Check
**GET** `/health`

Verifica o status do sistema e conexão com WhatsApp.

**Resposta:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-15T10:30:00.000Z",
  "whatsapp": true
}
```

### Informações do Salão
**GET** `/api/salon-info`

Retorna informações configuradas do salão.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "name": "Meu Salão de Beleza",
    "phone": "+55 11 99999-9999",
    "businessHours": {
      "start": "8",
      "end": "18",
      "days": ["1","2","3","4","5","6"]
    }
  }
}
```

### Estatísticas
**GET** `/api/stats`

Retorna estatísticas gerais do sistema.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "totalClients": 150,
    "totalAppointments": 500,
    "todayAppointments": 8,
    "pendingAppointments": 3
  }
}
```

---

## 👥 **Rotas de Clientes** (`/api/clients`)

### Listar Todos os Clientes
**GET** `/api/clients`

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "whatsapp_number": "5511999999999",
      "name": "Maria Silva",
      "created_at": "2025-10-15T10:00:00.000Z"
    }
  ]
}
```

### Buscar Cliente por WhatsApp
**GET** `/api/clients/:whatsapp`

**Parâmetros:**
- `whatsapp` (string) - Número do WhatsApp

### Criar Novo Cliente
**POST** `/api/clients`

**Body:**
```json
{
  "whatsapp_number": "5511999999999",
  "name": "Maria Silva"
}
```

### Atualizar Cliente
**PUT** `/api/clients/:id`

**Parâmetros:**
- `id` (number) - ID do cliente

**Body:**
```json
{
  "name": "Maria Silva Santos"
}
```

---

## 💅 **Rotas de Serviços** (`/api/services`)

### Listar Todos os Serviços Ativos
**GET** `/api/services`

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Corte Feminino",
      "description": "Corte de cabelo feminino",
      "duration_minutes": 60,
      "price": 50.00,
      "is_active": true,
      "created_at": "2025-10-15T10:00:00.000Z"
    }
  ]
}
```

### Buscar Serviço por ID
**GET** `/api/services/:id`

**Parâmetros:**
- `id` (number) - ID do serviço

### Criar Novo Serviço
**POST** `/api/services`

**Body:**
```json
{
  "name": "Corte Feminino",
  "description": "Corte de cabelo feminino",
  "duration_minutes": 60,
  "price": 50.00
}
```

### Atualizar Serviço
**PUT** `/api/services/:id`

**Body (campos opcionais):**
```json
{
  "name": "Corte Feminino Premium",
  "description": "Corte de cabelo feminino com finalização",
  "duration_minutes": 90,
  "price": 80.00,
  "is_active": true
}
```

---

## 📅 **Rotas de Agendamentos** (`/api/appointments`)

### Listar Todos os Agendamentos
**GET** `/api/appointments`

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "client_id": 1,
      "service_id": 1,
      "appointment_date": "2025-10-16",
      "appointment_time": "14:00",
      "status": "confirmed",
      "notes": "Cliente prefere corte mais curto",
      "created_at": "2025-10-15T10:00:00.000Z",
      "client_name": "Maria Silva",
      "client_whatsapp": "5511999999999",
      "service_name": "Corte Feminino",
      "service_duration": 60,
      "service_price": 50.00
    }
  ]
}
```

### Listar Agendamentos por Data
**GET** `/api/appointments/date/:date`

**Parâmetros:**
- `date` (string) - Data no formato YYYY-MM-DD

### Listar Agendamentos por Cliente
**GET** `/api/appointments/client/:whatsapp`

**Parâmetros:**
- `whatsapp` (string) - Número do WhatsApp do cliente

### Verificar Disponibilidade
**GET** `/api/appointments/availability/:date/:time/:serviceId`

**Parâmetros:**
- `date` (string) - Data no formato YYYY-MM-DD
- `time` (string) - Horário no formato HH:MM
- `serviceId` (number) - ID do serviço

**Resposta:**
```json
{
  "success": true,
  "data": {
    "available": true
  }
}
```

### Criar Novo Agendamento
**POST** `/api/appointments`

**Body:**
```json
{
  "client_id": 1,
  "service_id": 1,
  "appointment_date": "2025-10-16",
  "appointment_time": "14:00",
  "notes": "Cliente prefere corte mais curto"
}
```

### Atualizar Status do Agendamento
**PUT** `/api/appointments/:id/status`

**Body:**
```json
{
  "status": "completed"
}
```

**Status válidos:** `pending`, `confirmed`, `completed`, `cancelled`

---

## 🔒 **Códigos de Status HTTP**

- **200** - Sucesso
- **201** - Criado com sucesso
- **400** - Dados inválidos
- **404** - Recurso não encontrado
- **500** - Erro interno do servidor

## 📝 **Exemplos de Erro**

```json
{
  "success": false,
  "error": "Cliente não encontrado"
}
```

```json
{
  "success": false,
  "error": "WhatsApp e nome são obrigatórios"
}
```

```json
{
  "success": false,
  "error": "Horário não disponível"
}
```

---

## 🗂️ Estrutura do Projeto

\`\`\`
backend/
├── src/
│   ├── database/
│   │   └── database.ts          # Configuração e inicialização do banco
│   ├── models/
│   │   └── types.ts             # Interfaces TypeScript
│   ├── routes/
│   │   ├── appointments.ts      # Rotas de agendamentos
│   │   ├── clients.ts          # Rotas de clientes
│   │   └── services.ts         # Rotas de serviços
│   ├── services/
│   │   └── database.service.ts  # Serviços de banco de dados
│   ├── utils/
│   │   └── logger.ts           # Configuração de logs
│   ├── whatsapp/
│   │   ├── message-handler.ts   # Processamento de mensagens
│   │   └── whatsapp.service.ts  # Serviço WhatsApp
│   └── app.ts                   # Aplicação principal
├── database/                    # Banco de dados SQLite
├── sessions/                    # Sessões WhatsApp
├── logs/                       # Arquivos de log
├── .env                        # Variáveis de ambiente
├── .env.example               # Exemplo de configuração
├── package.json               # Dependências
├── tsconfig.json             # Configuração TypeScript
└── README.md                 # Esta documentação
\`\`\`

## 🛠️ Scripts Disponíveis

\`\`\`bash
# Desenvolvimento (watch mode)
npm run dev

# Build para produção
npm run build

# Executar em produção
npm start

# Executar testes
npm test

# Executar migrações
npm run migrate
\`\`\`

## 🔐 Segurança

- ✅ Helmet.js para headers de segurança
- ✅ CORS configurado
- ✅ Validação de entrada
- ✅ Sanitização de dados
- ✅ Logs estruturados
- ✅ Tratamento de erros

## 📊 Banco de Dados

### Tabelas

#### clients
- id (PRIMARY KEY)
- whatsapp_number (UNIQUE)
- name
- created_at
- updated_at

#### services
- id (PRIMARY KEY)
- name
- description
- duration_minutes
- price
- is_active
- created_at
- updated_at

#### appointments
- id (PRIMARY KEY)
- client_id (FK)
- service_id (FK)
- appointment_date
- appointment_time
- status (pending/confirmed/completed/cancelled)
- notes
- created_at
- updated_at

#### conversation_states
- id (PRIMARY KEY)
- whatsapp_number (UNIQUE)
- current_step
- data (JSON)
- created_at
- updated_at

## 🚨 Troubleshooting

### WhatsApp não conecta
1. Verifique se o QR Code foi escaneado corretamente
2. Certifique-se que não há outra instância do WhatsApp Web aberta
3. Limpe a pasta `sessions/` e tente novamente

### Erro de banco de dados
1. Verifique as permissões da pasta `database/`
2. Certifique-se que o SQLite está instalado
3. Execute `npm run migrate` se necessário

### API não responde
1. Verifique se a porta 3000 está livre
2. Confirme as configurações no arquivo `.env`
3. Verifique os logs para erros específicos

## 📈 Próximas Funcionalidades

- [ ] Interface web para administração
- [ ] Notificações por email
- [ ] Integração com calendário
- [ ] Relatórios avançados
- [ ] Múltiplos idiomas
- [ ] Pagamentos online
- [ ] Lembretes automáticos

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🆘 Suporte

Para suporte, envie um email para: seu-email@exemplo.com

---

**Desenvolvido com ❤️ para salões de beleza**
