const { Client } = require('pg');

const conn = 'postgresql://postgres.iwrjpydlvqzlgfycdsyy:Roosbelmateo621@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

(async () => {
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const s = await client.query('select count(*)::int as n from public.settings');
    console.log('settings:', s.rows[0].n);
    const b = await client.query("select id, name, public from storage.buckets order by id");
    console.log('buckets:', JSON.stringify(b.rows));
    const ext = await client.query("select extname from pg_extension where extname='pgcrypto'");
    console.log('extensiones:', JSON.stringify(ext.rows));
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await client.end().catch(() => {});
  }
})();