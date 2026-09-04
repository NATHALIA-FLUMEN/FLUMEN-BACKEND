const { Client } = require('pg');

const conn = 'postgresql://postgres.iwrjpydlvqzlgfycdsyy:Roosbelmateo621@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

(async () => {
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const res = await client.query('select current_database(), version()');
    console.log('CONECTADO OK');
    console.log(res.rows[0]);
  } catch (e) {
    console.error('ERROR DE CONEXION:', e.message);
  } finally {
    await client.end().catch(() => {});
  }
})();