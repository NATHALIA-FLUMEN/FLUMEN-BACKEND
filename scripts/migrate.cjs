const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const conn = 'postgresql://postgres.iwrjpydlvqzlgfycdsyy:Roosbelmateo621@aws-0-us-west-2.pooler.supabase.com:5432/postgres';
const schemaFile = path.join(__dirname, '..', 'supabase_schema.sql');

(async () => {
  const sql = fs.readFileSync(schemaFile, 'utf-8');
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Ejecutando supabase_schema.sql ...');
    await client.query(sql);
    console.log('SCHEMA APLICADO OK');
  } catch (e) {
    console.error('ERROR AL APLICAR SCHEMA:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
})();