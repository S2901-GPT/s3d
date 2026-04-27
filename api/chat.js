import { OpenAI } from 'openai';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { message } = body;
        
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "أنت باني صفحات SaaS تفاعلية خبير. وظيفتك استخدام الأدوات لبناء أقسام الصفحة. ركز على التفاعل والوضوح والجمال البصري." },
                { role: "user", content: message }
            ],
            tools: [{
                type: "function",
                function: {
                    name: "create_component",
                    parameters: {
                        type: "object",
                        properties: {
                            type: { type: "string", enum: ["Hero", "Define", "Choice"] },
                            data: { type: "object" }
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
        res.status(500).json({ error: error.message });
    }
}
