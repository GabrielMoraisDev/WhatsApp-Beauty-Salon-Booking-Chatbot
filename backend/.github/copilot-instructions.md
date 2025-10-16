<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## WhatsApp Beauty Salon Booking Chatbot

This is a Node.js TypeScript project for a WhatsApp chatbot that handles beauty salon appointment bookings.

### Project Features
- WhatsApp integration for client communication
- Appointment scheduling system
- Client management
- Service management
- SQLite database for data persistence
- REST APIs for frontend integration
- TypeScript for type safety

### Architecture
- **Backend**: Node.js with TypeScript
- **Database**: SQLite for local data storage
- **WhatsApp**: WhatsApp Web.js for messaging
- **API**: Express.js REST endpoints
- **Validation**: Input validation and data sanitization

### Key Components
- WhatsApp webhook handlers
- Appointment booking flow
- Database models and migrations
- API endpoints for CRUD operations
- Client conversation state management

### Development Guidelines
- Use TypeScript for all new code
- Follow REST API conventions
- Implement proper error handling
- Add input validation for all endpoints
- Use async/await for database operations
- Maintain clean separation of concerns