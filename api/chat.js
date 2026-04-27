export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY missing' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const blocks = Array.isArray(body.blocks) ? body.blocks : [];
    const selectedId = body.selectedId || null;
    const message = body.message || '';
    if (!message) return res.status(400).json({ error: 'Missing message' });

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
          {
            role: 'system',
            content: 'أنت مساعد بناء واجهات S3D. المستخدم يتحدث معك بالعربية. عدّل قائمة blocks حسب طلبه. الأنواع المسموحة: hero,text,cards,steps,image. كل block يحتوي id,type,title,text,items. إذا طلب تعديل هذا/العنصر المحدد فعدّل selectedId فقط. إذا طلب إضافة فأضف block جديد. إذا طلب حذف فاحذف المناسب. أرجع JSON فقط بالشكل: {"reply":"رد قصير للمستخدم","blocks":[...]} ولا تشرح خارج JSON.'
          },
          {
            role: 'user',
            content: JSON.stringify({ blocks, selectedId, message })
          }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error && data.error.message ? data.error.message : 'AI failed' });

    const json = JSON.parse(data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '{}');
    return res.status(200).json({ reply: json.reply || 'تم', blocks: Array.isArray(json.blocks) ? json.blocks : blocks });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Chat failed' });
  }
}
