const { timingSafeEqual } = require('node:crypto');
const { cleanup } = require('../server/recovery.cjs');
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const secret = process.env.CRON_SECRET;
  const actual = Buffer.from(req.headers.authorization || '');
  const expected = Buffer.from('Bearer ' + (secret || ''));
  if (req.method !== 'GET' || !secret || actual.length !== expected.length || !timingSafeEqual(actual, expected)) return res.status(401).json({ error: 'unauthorized' });
  try { return res.status(200).json({ removed: await cleanup() }); }
  catch { return res.status(503).json({ error: 'cleanup_failed' }); }
};
