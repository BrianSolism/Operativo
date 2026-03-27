import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               Number(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'pirelli_checklist',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+00:00',
  dateStrings:        true,
});

export const poolClientes = mysql.createPool({
  host:               process.env.MYSQL_HOST     || 'localhost',
  port:               Number(process.env.MYSQL_PORT) || 3306,
  user:               process.env.MYSQL_USER     || 'root',
  password:           process.env.MYSQL_PASSWORD || '',
  database:           process.env.MYSQL_DATABASE || 'clientes',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+00:00',
  dateStrings:        true,
});

export async function testConnection(): Promise<void> {
  const conn = await pool.getConnection();
  console.log('✅  MySQL conectado correctamente');
  conn.release();
}
