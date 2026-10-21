const FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSfvqrBSX-7feKIy6unUr6NCpbhuA4sMg5l41cjr3ksDNPLwAQ/formResponse';
const MAIL = 'https://formsubmit.co/ajax/flagtomahawk@gmail.com';
const DAY = 86400000;
const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://tomahawk-three.vercel.app';
const fields = {
  'emailAddress': 254, 'entry.942478611': 80, 'entry.979617444_year': 4,
  'entry.979617444_month': 2, 'entry.979617444_day': 2, 'entry.649875364': 20,
  'entry.43192797': 11, 'entry.1687358232': 11, 'entry.680141850': 160,
  'entry.1367242974': 80, 'entry.1030420135': 60, 'entry.1551743960': 30,
  'entry.55136223': 20, 'entry.422728940': 2, 'entry.1021032316': 2,
  'entry.1494405221': 3, 'entry.338483210': 500, 'entry.266559786': 40
};
function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw Error('invalid');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId || '')) throw Error('invalid');
  if (body.website) throw Error('invalid');
  const clean = {};
  for (const [key, max] of Object.entries(fields)) {
    const value = body[key] ?? '';
    if (typeof value !== 'string' || value.length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value)) throw Error('invalid');
    clean[key] = value.trim();
    if (!clean[key] && !['entry.1551743960', 'entry.338483210'].includes(key)) throw Error('invalid');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.emailAddress) || !/^\d{11}$/.test(clean['entry.1687358232']) || !/^\d{11}$/.test(clean['entry.43192797'])) throw Error('invalid');
  const enums = {
    'entry.1030420135': ['Offensive Lineman','Tight End','Quarterback','Running Back','Wide Receiver','Defensive Lineman','Linebacker','Cornerback','Safety'],
    'entry.1551743960': ['', 'Kicker','Punter','Holder','Long Snapper','Kick/Punt Returner'],
    'entry.1021032316': ['PP','P','M','G','GG','XG'],
    'entry.1494405221': ['Sim','Não'], 'entry.266559786': ['Sim, eu aceito os termos.']
  };
  for (const [key, values] of Object.entries(enums)) if (!values.includes(clean[key])) throw Error('invalid');
  if (!/^[1-9]\d?$/.test(clean['entry.422728940'])) throw Error('invalid');
  if (/[<>]/.test(clean['entry.942478611']) || /[<>]/.test(clean['entry.55136223']) || /[<>]/.test(clean['entry.1367242974'])) throw Error('invalid');
  const y = Number(clean['entry.979617444_year']), m = Number(clean['entry.979617444_month']), d = Number(clean['entry.979617444_day']);
  const date = new Date(Date.UTC(y,m-1,d));
  if (y < 1900 || date > new Date() || date.getUTCFullYear() !== y || date.getUTCMonth() !== m-1 || date.getUTCDate() !== d) throw Error('invalid');
  if (clean['entry.1494405221'] === 'Sim' && !clean['entry.338483210']) throw Error('invalid');
  if (clean['entry.1494405221'] === 'Não') clean['entry.338483210'] = '';
  return clean;
}
function publicStatus(record) {
  return { protocol: record.protocol, registration: record.registration, notification: record.notification, recoverySaved: true };
}
async function submit(body, { store, fetcher = fetch, now = Date.now }) {
  const clean = validate(body);
  const existing = await store.read(body.requestId);
  if (existing) return publicStatus(existing); // Never resubmit a possibly accepted Google response.
  const record = {
    protocol: body.requestId, createdAt: new Date(now()).toISOString(),
    expiresAt: new Date(now() + 30 * DAY).toISOString(),
    name: clean['entry.942478611'], email: clean.emailAddress, phone: clean['entry.1687358232'],
    registration: 'pending', notification: 'pending'
  };
  try { await store.create(record); }
  catch (error) {
    const concurrent = await store.read(body.requestId);
    if (concurrent) return publicStatus(concurrent);
    throw error; // Fail closed: no destinations called unless recovery has been saved.
  }
  const payload = new URLSearchParams({ ...clean, fvv: '1', pageHistory: '0,1' });
  if (!clean['entry.1551743960']) payload.delete('entry.1551743960');
  try {
    const response = await fetcher(FORM, { method: 'POST', body: payload, signal: AbortSignal.timeout(12000) });
    const html = await response.text();
    record.registration = response.ok && /Sua resposta foi registrada\.|Your response has been recorded\./.test(html)
      ? 'confirmed' : 'unconfirmed';
  } catch { record.registration = 'unconfirmed'; }
  // The full payload is never written to recovery storage, console, or error logs.
  try { await store.update(record); } catch { /* Initial recovery record still exists. */ }
  try {
    const response = await fetcher(MAIL, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Origin': SITE_ORIGIN, 'Referer': SITE_ORIGIN + '/seletiva-2026.html' },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        _subject: 'Nova inscrição — Seletiva Tomahawk 2026', _template: 'table',
        Protocolo: record.protocol,
        'Data do envio': record.createdAt,
        'Registro no Google Forms': record.registration === 'confirmed' ? 'Confirmado pelo Google Forms' : 'Não confirmado — verificar recuperação privada',
        'Nome completo': clean['entry.942478611'],
        'E-mail': clean.emailAddress,
        'Data de nascimento': clean['entry.979617444_day'] + '/' + clean['entry.979617444_month'] + '/' + clean['entry.979617444_year'],
        'RG': clean['entry.649875364'],
        'CPF': clean['entry.43192797'],
        'Telefone': clean['entry.1687358232'],
        'Endereço': clean['entry.680141850'],
        'Cidade': clean['entry.1367242974'],
        'Posição': clean['entry.1030420135'],
        'Special Teams': clean['entry.1551743960'] || 'Não informado',
        'Nome no uniforme': clean['entry.55136223'],
        'Número no uniforme': clean['entry.422728940'],
        'Tamanho de camiseta': clean['entry.1021032316'],
        'Restrição médica': clean['entry.1494405221'],
        'Descrição da restrição': clean['entry.338483210'] || 'Não se aplica',
        'Termo aceito': clean['entry.266559786']
      })
    });
    const result = await response.json();
    record.notification = response.ok && (result.success === true || result.success === 'true') ? 'accepted' : 'unconfirmed';
  } catch { record.notification = 'unconfirmed'; }
  // Acceptance by FormSubmit does not prove delivery to the recipient inbox.
  try { await store.update(record); } catch { /* Do not turn a confirmed registration into a false failure. */ }
  return publicStatus(record);
}
module.exports = { submit, validate, DAY };
