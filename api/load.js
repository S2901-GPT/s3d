export default async function handler(req, res) {
  try {
    const id = req.query && req.query.id;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.STORAGE_KV_REST_API_URL || process.env.STORAGE_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.STORAGE_KV_REST_API_TOKEN || process.env.STORAGE_REST_API_TOKEN;
    if (!url || !token) return res.status(500).json({ error: 'KV env variables missing' });

    const cleanUrl = String(url).replace(/\/$/, '');
    const r = await fetch(cleanUrl + '/get/screen:' + encodeURIComponent(id), {
      headers: { Authorization: 'Bearer ' + token }
    });

    let data = null;
    try { data = await r.json(); } catch (e) { data = null; }

    if (!r.ok) return res.status(404).json({ error: (data && data.error) || 'Not found' });
    if (!data || data.result == null) return res.status(404).json({ error: 'Not found' });

    let parsed = data.result;
    for (let i = 0; i < 3 && typeof parsed === 'string'; i++) {
      try { parsed = JSON.parse(parsed); } catch (e) { break; }
    }

    if (typeof parsed === 'string') parsed = { html: parsed };
    if (parsed && parsed.html && typeof parsed.html === 'string') return res.status(200).json(parsed);
    return res.status(200).json({ html: '' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Load failed' });
  }
}
