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
            content: "أنت منشئ واجهات عرض معلومات. أرجع JSON فقط بهذا الشكل: {\"blocks\":[{\"type\":\"hero\",\"content\":\"عنوان\"},{\"type\":\"text\",\"content\":\"نص\"},{\"type\":\"btn\",\"content\":\"زر\"}]}"
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "OpenAI request failed" });
    }

    const text = data.choices?.[0]?.message?.content || "{}";
    const json = JSON.parse(text);

    return res.status(200).json(json);
  } catch (err) {
    return res.status(500).json({ error: err.message || "AI error" });
  }
}
