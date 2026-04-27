function normalizeItems(items) {
  if (items == null) return '';
  if (typeof items === 'string') return items;
  if (Array.isArray(items)) {
    return items.map(function (item, index) {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        var title = item.title || item.label || item.name || item.question || item.term || ('عنصر ' + (index + 1));
        var text = item.text || item.content || item.description || item.answer || item.definition || item.value || '';
        return String(title) + ':' + String(text);
      }
      return String(item);
    }).join('|');
  }
  if (typeof items === 'object') {
    return Object.keys(items).map(function (key) {
      var value = items[key];
      if (value && typeof value === 'object') value = value.text || value.content || value.description || value.answer || JSON.stringify(value);
      return String(key) + ':' + String(value);
    }).join('|');
  }
  return String(items);
}

function normalizeBlock(block, index) {
  var allowed = ['hero', 'text', 'cards', 'steps', 'image', 'define', 'choice'];
  var type = allowed.indexOf(block && block.type) >= 0 ? block.type : 'text';
  return {
    id: block && block.id ? String(block.id) : ('b' + Date.now().toString(36) + index),
    type: type,
    title: block && block.title ? String(block.title) : 'عنوان',
    text: block && block.text ? String(block.text) : '',
    items: normalizeItems(block && block.items),
    image: block && block.image ? String(block.image) : ''
  };
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY missing' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const blocks = Array.isArray(body.blocks) ? body.blocks.map(normalizeBlock) : [];
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
            content: 'أنت مساعد بناء واجهات S3D. المستخدم يتحدث معك بالعربية. عدّل قائمة blocks حسب طلبه. الأنواع المدعومة: hero,text,cards,steps,image,define,choice. عنصر define يعني كلمات يضغط عليها القارئ فتظهر تعريفاتها. عنصر choice يعني اختيارات يضغط عليها القارئ فيظهر محتوى مختلف. لا ترجع items كـ objects. items يجب أن تكون string فقط بصيغة: عنوان:شرح|عنوان:شرح. إذا احتجت قائمة، حولها لهذه الصيغة. أرجع JSON فقط بالشكل: {"reply":"رد قصير","blocks":[{"id":"...","type":"...","title":"...","text":"...","items":"عنوان:شرح|عنوان:شرح","image":""}]}. لا تشرح خارج JSON.'
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

    const content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '{}';
    const json = JSON.parse(content);
    const normalized = Array.isArray(json.blocks) ? json.blocks.map(normalizeBlock) : blocks;
    return res.status(200).json({ reply: json.reply || 'تم', blocks: normalized });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Chat failed' });
  }
}
