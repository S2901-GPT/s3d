export default async function handler(req, res) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY is missing in Vercel Environment Variables" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const prompt = body.prompt || "";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "أنت مصمم واجهات محترف. صمّم صفحة هبوط عربية للجوال من معلومات المستخدم. أرجع JSON فقط بدون شرح. الشكل المطلوب: {\"theme\":\"luxury|clean|dark|commerce|service\",\"blocks\":[{\"type\":\"hero\",\"title\":\"...\",\"subtitle\":\"...\"},{\"type\":\"card\",\"title\":\"...\",\"text\":\"...\"},{\"type\":\"stat\",\"title\":\"...\",\"content\":\"...\",\"value2\":\"...\",\"label2\":\"...\"},{\"type\":\"list\",\"title\":\"...\",\"items\":\"ميزة 1|ميزة 2|ميزة 3\"},{\"type\":\"button\",\"content\":\"...\"},{\"type\":\"footer\",\"content\":\"...\"}]}. لازم التصميم يحتوي Hero قوي، 3 كروت، إحصائية، قائمة مميزات، زر دعوة للإجراء. لا ترجع type=text."
          },
          { "role": "user", "content": prompt }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || "OpenAI request failed" });

    const json = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    return res.status(200).json(json);
  } catch (err) {
    return res.status(500).json({ error: err.message || "AI error" });
  }
}
