import { OpenAI } from 'openai';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        
        // نستقبل مصفوفة الرسائل بدلاً من رسالة واحدة
        const { messages } = body;
        
        // إعداد رسالة النظام الأساسية
        const systemMessage = { 
            role: "system", 
            content: "أنت باني صفحات SaaS تفاعلية خبير. وظيفتك استخدام الأدوات لبناء أقسام الصفحة. عندما يطلب المستخدم محتوى، قم بتوليده واستدعاء أداة (create_component) لعرضه. لا تسأل المستخدم كثيراً، بل بادر بإنشاء المحتوى مباشرة. ركز على التفاعل والوضوح." 
        };

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [systemMessage, ...messages],
            tools: [{
                type: "function",
                function: {
                    name: "create_component",
                    description: "إنشاء عنصر تفاعلي جديد في الصفحة",
                    parameters: {
                        type: "object",
                        properties: {
                            type: { type: "string", enum: ["Hero", "Define", "Choice"] },
                            data: { type: "object", description: "بيانات المكون. يجب أن تحتوي على title و description للـ Hero. و word و definition للـ Define. و question و options للـ Choice." }
                        },
                        required: ["type", "data"]
                    }
                }
            }],
            tool_choice: "auto"
        });

        res.status(200).json({ 
            reply: response.choices[0].message.content, 
            tool_calls: response.choices[0].message.tool_calls 
        });
    } catch (error) {
        console.error("OpenAI Error:", error);
        res.status(500).json({ error: error.message });
    }
}
