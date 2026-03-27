/**
 * Seed inicial: crea el usuario admin con contraseña hasheada.
 * Ejecutar UNA sola vez: npx ts-node src/seed.ts
 */
import bcrypt from 'bcrypt';
import { pool } from './config/database';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  const hash = await bcrypt.hash('Admin123!', 10);
  await pool.execute(
    `INSERT INTO usuarios (nombre, email, password, rol)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE password = VALUES(password)`,
    ['Administrador', 'admin@algebasa.com', hash, 'admin'],
  );
  console.log('✅  Usuario admin creado — email: admin@algebasa.com  pass: Admin123!');
  process.exit(0);
})();
