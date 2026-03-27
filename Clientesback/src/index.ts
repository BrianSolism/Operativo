import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { createPool } from 'mysql2/promise';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

export const pool = createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.use(cors());
app.use(express.json());

// ──────────────────────────────────────────────
// Rutas públicas (sin autenticación)
// ──────────────────────────────────────────────
import authRoutes from './routes/auth';
app.use('/api/auth', authRoutes);

// ──────────────────────────────────────────────
// Middleware global de autenticación JWT
// ──────────────────────────────────────────────
import { requireAuth } from './middleware/auth';
app.use(requireAuth);

// ──────────────────────────────────────────────
// Rutas protegidas
// ──────────────────────────────────────────────
import cpRoutes            from './routes/cp';
import clientesRoutes      from './routes/clientes';
import quienEsQuienRoutes  from './routes/quienEsQuien';
import representantesRoutes from './routes/representantes';
import contratosRoutes     from './routes/contratos';
import empresasRoutes      from './routes/empresas';
import usuariosRoutes      from './routes/usuarios';

import unidadesNegocioRoutes      from './routes/cat/unidades-negocio';
import reglasTipoContratoRoutes   from './routes/cat/reglas-tipo-contrato';
import { createSimpleCatalogRouter } from './routes/cat/simple-catalog';

app.use('/api/cp',             cpRoutes);
app.use('/api/quien-es-quien', quienEsQuienRoutes);
app.use('/api/clientes',       clientesRoutes);
app.use('/api/representantes', representantesRoutes);
app.use('/api/contratos',      contratosRoutes);
app.use('/api/empresas',       empresasRoutes);
app.use('/api/usuarios',       usuariosRoutes);

app.use('/api/cat/tipos-cliente',            createSimpleCatalogRouter({ table: 'cat_tipo_cliente',               idField: 'idtipocliente' }));
app.use('/api/cat/tipos-contrato',           createSimpleCatalogRouter({ table: 'cat_tipo_contrato',              idField: 'idtipocontrato' }));
app.use('/api/cat/tipos-servicio',           createSimpleCatalogRouter({ table: 'cat_tipo_servicio',              idField: 'idtiposervicio' }));
app.use('/api/cat/personalidades-juridicas', createSimpleCatalogRouter({ table: 'cat_personalidad_juridica',      idField: 'idpersonalidadjuridica' }));
app.use('/api/cat/unidades-estrategicas',    createSimpleCatalogRouter({ table: 'cat_unidad_negocio_estrategico', idField: 'idunidadestrategico' }));

app.use('/api/cat/unidades-negocio',     unidadesNegocioRoutes);
app.use('/api/cat/reglas-tipo-contrato', reglasTipoContratoRoutes);

// ──────────────────────────────────────────────
// Inicialización de tablas de auth en BD
// ──────────────────────────────────────────────
async function initAuthTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        idusuario      INT AUTO_INCREMENT PRIMARY KEY,
        username       VARCHAR(50)  UNIQUE NOT NULL,
        password_hash  VARCHAR(255) NOT NULL,
        nombre         VARCHAR(100) NOT NULL,
        es_admin       TINYINT(1) DEFAULT 0,
        activo         TINYINT(1) DEFAULT 1,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS modulos (
        idmodulo INT AUTO_INCREMENT PRIMARY KEY,
        clave    VARCHAR(80) UNIQUE NOT NULL,
        nombre   VARCHAR(100) NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS permisos_usuario (
        idusuario     INT NOT NULL,
        idmodulo      INT NOT NULL,
        puede_ver     TINYINT(1) DEFAULT 0,
        puede_crear   TINYINT(1) DEFAULT 0,
        puede_editar  TINYINT(1) DEFAULT 0,
        puede_eliminar TINYINT(1) DEFAULT 0,
        PRIMARY KEY (idusuario, idmodulo),
        FOREIGN KEY (idusuario) REFERENCES usuarios(idusuario) ON DELETE CASCADE,
        FOREIGN KEY (idmodulo)  REFERENCES modulos(idmodulo)   ON DELETE CASCADE
      )
    `);

    // Catálogo de módulos del sistema
    const modulos = [
      ['dashboard',                   'Dashboard'],
      ['clientes',                    'Clientes'],
      ['contratos',                   'Contratos'],
      ['empresas',                    'Empresas'],
      ['cat/personalidades-juridicas','Personalidades Jurídicas'],
      ['cat/tipos-cliente',           'Tipos de Cliente'],
      ['cat/tipos-contrato',          'Tipos de Contrato'],
      ['cat/tipos-servicio',          'Tipos de Servicio'],
      ['cat/unidades-negocio',        'Unidades de Negocio'],
      ['cat/unidades-estrategicas',   'UDN Estratégica'],
      ['usuarios',                    'Gestión de Usuarios'],
    ];
    for (const [clave, nombre] of modulos) {
      await pool.query('INSERT IGNORE INTO modulos (clave, nombre) VALUES (?, ?)', [clave, nombre]);
    }

    // Crear usuario admin por defecto si no existe
    const [admins] = await pool.query<any[]>('SELECT idusuario FROM usuarios WHERE username = "admin"');
    if (!admins.length) {
      const hash = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO usuarios (username, password_hash, nombre, es_admin) VALUES ("admin", ?, "Administrador", 1)',
        [hash]
      );
      console.log('✓ Usuario admin creado (user: admin / pass: admin123)');
    }

    console.log('✓ Tablas de autenticación listas');
  } catch (err) {
    console.error('✗ Error inicializando tablas de auth:', err);
  }
}

app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  await initAuthTables();
});
