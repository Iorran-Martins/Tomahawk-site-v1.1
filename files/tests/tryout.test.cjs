const test = require('node:test');
const assert = require('node:assert/strict');
const { submit, validate } = require('../server/tryout.cjs');

function application() {
  return {
    requestId: '59a64242-6dfe-4d75-b0d2-bc32c169cae5',
    emailAddress: 'atleta@example.com', 'entry.942478611': 'Atleta de Teste',
    'entry.979617444_year': '2000', 'entry.979617444_month': '01', 'entry.979617444_day': '20',
    'entry.649875364': '12345-6', 'entry.43192797': '52998224725', 'entry.1687358232': '19999999999',
    'entry.680141850': 'Rua de Teste, 10', 'entry.1367242974': 'Limeira',
    'entry.1030420135': 'Quarterback', 'entry.1551743960': '', 'entry.55136223': 'TESTE',
    'entry.422728940': '12', 'entry.1021032316': 'M', 'entry.1494405221': 'Não',
    'entry.338483210': '', 'entry.266559786': 'Sim, eu aceito os termos.'
  };
}
function memoryStore() {
  const records = new Map();
  return { records, read: async id => records.get(id) || null, create: async record => {
    if (records.has(record.protocol)) throw Error('exists'); records.set(record.protocol, structuredClone(record));
  }, update: async record => records.set(record.protocol, structuredClone(record)) };
}

test('rejects payloads outside the expected field shape', () => {
  const body = application(); body['entry.942478611'] = '<script>alert(1)</script>';
  assert.throws(() => validate(body));
});

test('saves a minimal recovery record before submitting to both destinations', async () => {
  const store = memoryStore(); const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    assert.ok(store.records.has(application().requestId));
    return url.includes('google') ? new Response('Sua resposta foi registrada.', { status: 200 }) : new Response(JSON.stringify({ success: 'true' }), { status: 200 });
  };
  const result = await submit(application(), { store, fetcher, now: () => Date.UTC(2026, 9, 21) });
  assert.deepEqual({ registration: result.registration, notification: result.notification, recoverySaved: result.recoverySaved }, { registration: 'confirmed', notification: 'accepted', recoverySaved: true });
  assert.equal(calls.length, 2);
  assert.deepEqual(Object.keys(store.records.get(application().requestId)).sort(), ['createdAt', 'email', 'expiresAt', 'name', 'notification', 'phone', 'protocol', 'registration']);
  assert.match(calls[1].options.body, /"CPF":"52998224725"/);
});

test('does not resubmit the same protocol after a possibly accepted request', async () => {
  const store = memoryStore(); let calls = 0;
  const fetcher = async url => { calls++; return url.includes('google') ? new Response('Sua resposta foi registrada.') : new Response('{"success":true}'); };
  await submit(application(), { store, fetcher });
  const second = await submit(application(), { store, fetcher });
  assert.equal(calls, 2);
  assert.equal(second.registration, 'confirmed');
});
