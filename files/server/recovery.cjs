const PREFIX = 'tryout-recovery/';
async function sdk() { return import('@vercel/blob'); }
function path(id) { return PREFIX + id + '.json'; }
const options = () => ({ access: 'private', token: process.env.BLOB_READ_WRITE_TOKEN, abortSignal: AbortSignal.timeout(8000) });
const store = {
  async read(id) {
    const { get } = await sdk();
    const result = await get(path(id), { ...options(), useCache: false });
    return result ? new Response(result.stream).json() : null;
  },
  async create(record) {
    const { put } = await sdk();
    await put(path(record.protocol), JSON.stringify(record), { ...options(), addRandomSuffix: false, allowOverwrite: false, contentType: 'application/json', cacheControlMaxAge: 60 });
  },
  async update(record) {
    const { put } = await sdk();
    await put(path(record.protocol), JSON.stringify(record), { ...options(), addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60 });
  }
};
async function cleanup(now = Date.now()) {
  const { list, del } = await sdk();
  let cursor, removed = 0;
  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 100, token: process.env.BLOB_READ_WRITE_TOKEN });
    for (const blob of page.blobs) {
      const id = blob.pathname.slice(PREFIX.length, -5);
      const record = await store.read(id);
      // Daily schedule: remove during the final day to stay within 30 days.
      if (record && Date.parse(record.expiresAt) <= now + 86400000) {
        await del(blob.url, { token: process.env.BLOB_READ_WRITE_TOKEN }); removed++;
      }
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return removed;
}
module.exports = { store, cleanup };
