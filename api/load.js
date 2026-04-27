export default async function handler(req, res) {
  try {
    const { id } = req.query || {};
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const url = process.env.KV_REST_API_URL || process.env.STORAGE_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.STORAGE_REST_API_TOKEN;
    if (!url || !token) return res.status(500).json({ error: 'KV env variables missing' });

    const r = await fetch(`${url}/get/screen:${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(404).json({ error: text || 'Not found' });
    }

    const data = await r.json();
    if (!data || data.result == null) return res.status(404).json({ error: 'Not found' });

    let parsed;
    try { parsed = JSON.parse(data.result); } catch (e) { parsed = { html: String(data.result || '') }; }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Load failed' });
  }
}
