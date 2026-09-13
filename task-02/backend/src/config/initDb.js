const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDb() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '5432');
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';
  const dbName = process.env.DB_NAME || 'techloom_store';

  console.log(`[Task-02 DB] Connecting to 'postgres' database on ${host}:${port}...`);
  const rootClient = new Client({ host, port, user, password, database: 'postgres' });

  try {
    await rootClient.connect();
    const res = await rootClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    if (res.rows.length === 0) {
      console.log(`Creating database '${dbName}'...`);
      await rootClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database '${dbName}' created.`);
    }
  } catch (err) {
    console.error('Database connection error:', err.message);
  } finally {
    await rootClient.end();
  }

  const targetClient = new Client({ host, port, user, password, database: dbName });
  try {
    await targetClient.connect();
    console.log(`Executing schema.sql for '${dbName}'...`);
    const schemaPath = path.join(__dirname, '../../schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await targetClient.query(sql);
    console.log(`Task 02 E-Commerce database initialized successfully!`);
  } catch (err) {
    console.error('Error running schema.sql:', err.message);
  } finally {
    await targetClient.end();
  }
}

if (require.main === module) {
  initDb();
}

module.exports = initDb;
