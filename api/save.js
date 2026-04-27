import { createClient } from '@vercel/kv';
const kv = createClient({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send();
    const { html } = req.body;
    const id = Math.random().toString(36).substr(2, 8);
    await kv.set(`page:${id}`, html);
    res.status(200).json({ id });
}
