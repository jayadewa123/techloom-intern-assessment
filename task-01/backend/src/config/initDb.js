const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDb() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '5432');
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';
  const dbName = process.env.DB_NAME || 'techloom_pos';

  console.log(`Connecting to default 'postgres' database on ${host}:${port}...`);
  const rootClient = new Client({ host, port, user, password, database: 'postgres' });

  try {
    await rootClient.connect();
    const res = await rootClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    if (res.rows.length === 0) {
      console.log(`Database '${dbName}' does not exist. Creating database...`);
      await rootClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database '${dbName}' created successfully.`);
    } else {
      console.log(`Database '${dbName}' already exists.`);
    }
  } catch (err) {
    console.error('Error checking/creating database:', err.message);
  } finally {
    await rootClient.end();
  }

  // Connect to techloom_pos DB and run schema.sql
  const targetClient = new Client({ host, port, user, password, database: dbName });
  try {
    await targetClient.connect();
    console.log(`Running schema.sql on '${dbName}'...`);
    const schemaPath = path.join(__dirname, '../../schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await targetClient.query(sql);
    console.log(`Schema initialized and seed data inserted successfully!`);
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
