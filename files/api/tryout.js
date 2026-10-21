const { submit } = require('../server/tryout.cjs');
const { store } = require('../server/recovery.cjs');
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!process.env.BLOB_READ_WRITE_TOKEN || process.env.TRYOUT_ENABLED !== 'true') return res.status(503).json({ error: 'unavailable' });
  const origin = process.env.SITE_ORIGIN || 'https://tomahawk-three.vercel.app';
  if (req.headers.origin !== origin) return res.status(403).json({ error: 'origin' });
  if (!(req.headers['content-type'] || '').startsWith('application/json')) return res.status(415).json({ error: 'format' });
  if (Number(req.headers['content-length']) > 12000) return res.status(413).json({ error: 'size' });
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (Buffer.byteLength(JSON.stringify(body)) > 12000) return res.status(413).json({ error: 'size' });
    require('../server/tryout.cjs').validate(body);
  } catch { return res.status(400).json({ error: 'invalid' }); }
  try { return res.status(200).json(await submit(body, { store })); }
  catch { return res.status(503).json({ error: 'unavailable' }); }
};
