export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const html = body.html || '';
    const name = body.name || 'screen';
    if (!html) return res.status(400).json({ error: 'Missing html' });

    const url = process.env.KV_REST_API_URL || process.env.STORAGE_KV_REST_API_URL || process.env.STORAGE_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.STORAGE_KV_REST_API_TOKEN || process.env.STORAGE_REST_API_TOKEN;
    if (!url || !token) {
      return res.status(500).json({ error: 'KV env variables missing: check KV_REST_API_URL / KV_REST_API_TOKEN or STORAGE_KV_REST_API_URL / STORAGE_KV_REST_API_TOKEN in Vercel' });
    }

    const id = Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
    const payload = JSON.stringify({ id, name, html, createdAt: new Date().toISOString() });

    const r = await fetch(`${url}/set/screen:${id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(500).json({ error: text || 'KV save failed' });
    }

    return res.status(200).json({ id, url: `/view.html?id=${id}` });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Save failed' });
  }
}
