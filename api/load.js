import { createClient } from '@vercel/kv';
const kv = createClient({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).send();
    const { id } = req.query;
    const html = await kv.get(`page:${id}`);
    res.status(200).json({ html });
}
