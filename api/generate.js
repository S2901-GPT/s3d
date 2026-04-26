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
            content: "أنت مصمم شاشات تفاعلية معلوماتية للجوال، وليس صفحات بيع أو مطاعم. المطلوب إنشاء شاشة تعرض محتوى وتفاعل: تبويبات، أسئلة وأجوبة، خطوات، بطاقات معلومات، قائمة قابلة للفتح، أزرار تنقل داخل المحتوى. لا تستخدم لغة تسويق ولا بيع ولا طلب ولا تسوق. أرجع JSON فقط بهذا الشكل: {\"screenTitle\":\"...\",\"blocks\":[{\"type\":\"hero\",\"title\":\"...\",\"subtitle\":\"...\"},{\"type\":\"tabs\",\"title\":\"...\",\"items\":\"تبويب 1|تبويب 2|تبويب 3\"},{\"type\":\"accordion\",\"title\":\"...\",\"items\":\"سؤال:جواب|سؤال:جواب\"},{\"type\":\"steps\",\"title\":\"...\",\"items\":\"خطوة 1|خطوة 2|خطوة 3\"},{\"type\":\"info\",\"title\":\"...\",\"text\":\"...\"},{\"type\":\"quiz\",\"title\":\"...\",\"items\":\"سؤال|خيار أ|خيار ب|الخيار الصحيح\"},{\"type\":\"nav\",\"items\":\"الرئيسية|المعلومات|الأسئلة\"}]}. ركز على شاشة تفاعلية تعليمية/معلوماتية حسب محتوى المستخدم."
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
