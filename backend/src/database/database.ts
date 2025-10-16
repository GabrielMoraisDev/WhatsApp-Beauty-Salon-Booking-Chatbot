import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

class DatabaseManager {
  private db: sqlite3.Database;
  private dbPath: string;

  constructor() {
    // Criar diretório do banco se não existir
    const dbDir = path.join(process.cwd(), 'database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.dbPath = process.env.DATABASE_PATH || path.join(dbDir, 'salon.db');
    this.db = new sqlite3.Database(this.dbPath);
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Tabela de clientes
        this.db.run(`
          CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            whatsapp_number TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Tabela de serviços
        this.db.run(`
          CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            duration_minutes INTEGER NOT NULL,
            price REAL NOT NULL,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Tabela de agendamentos
        this.db.run(`
          CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER NOT NULL,
            service_id INTEGER NOT NULL,
            appointment_date DATE NOT NULL,
            appointment_time TIME NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients (id),
            FOREIGN KEY (service_id) REFERENCES services (id),
            CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'))
          )
        `);

        // Tabela de estados de conversa
        this.db.run(`
          CREATE TABLE IF NOT EXISTS conversation_states (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            whatsapp_number TEXT UNIQUE NOT NULL,
            current_step TEXT NOT NULL,
            data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Inserir serviços padrão se não existirem
        this.db.get("SELECT COUNT(*) as count FROM services", (err, row: any) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (row.count === 0) {
            const defaultServices = [
              ['Corte Feminino', 'Corte de cabelo feminino', 60, 50.00],
              ['Corte Masculino', 'Corte de cabelo masculino', 45, 35.00],
              ['Escova', 'Escova progressiva', 120, 80.00],
              ['Manicure', 'Manicure completa', 45, 25.00],
              ['Pedicure', 'Pedicure completa', 60, 30.00],
              ['Sobrancelha', 'Design de sobrancelha', 30, 20.00],
              ['Coloração', 'Tintura de cabelo', 180, 120.00],
              ['Hidratação', 'Tratamento hidratante', 90, 60.00]
            ];

            const stmt = this.db.prepare(`
              INSERT INTO services (name, description, duration_minutes, price) 
              VALUES (?, ?, ?, ?)
            `);

            defaultServices.forEach(service => {
              stmt.run(service);
            });

            stmt.finalize();
          }
          
          resolve();
        });
      });
    });
  }

  // Métodos para executar queries
  async run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

export const database = new DatabaseManager();