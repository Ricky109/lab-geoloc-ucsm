import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// La URL de conexión vendrá de las variables de entorno de Render
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Requerido para conexiones seguras en Render
  },
  max: 2,
  connectionTimeoutMillis: 5000,
});

export const query = (text, params) => pool.query(text, params);
