const { Client } = require('pg');

const conn = 'postgresql://postgres.iwrjpydlvqzlgfycdsyy:Roosbelmateo621@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

(async () => {
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const q = "select table_schema, table_name from information_schema.tables where table_schema = 'public' order by table_name";
    const r = await client.query(q);
    console.log('TABLAS EN public:');
    if (r.rows.length === 0) console.log('(ninguna)');
    r.rows.forEach((row) => console.log(`  ${row.table_schema}.${row.table_name}`));
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await client.end().catch(() => {});
  }
})();