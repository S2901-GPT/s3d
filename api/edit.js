export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY missing' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const block = body.block || {};
    const instruction = body.instruction || '';
    if (!instruction) return res.status(400).json({ error: 'Missing instruction' });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'أنت محرر واجهات. عدّل البلوك المحدد فقط حسب طلب المستخدم. أرجع JSON فقط بنفس الحقول: type,title,text,items. لا تضف شرح.' },
          { role: 'user', content: JSON.stringify({ block, instruction }) }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'AI failed' });

    const edited = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    return res.status(200).json({ block: edited });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Edit failed' });
  }
}
