import { OpenAI } from 'openai';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { messages } = body;
        
        const systemMessage = { 
            role: "system", 
            content: "أنت باني صفحات تفاعلية. مهمتك بناء عناصر الصفحة بناءً على طلب المستخدم. استدعِ الأداة (create_component) دائماً. البيانات المطلوبة لـ Hero هي (title و description). البيانات المطلوبة لـ Define هي (word و definition). البيانات المطلوبة لـ Choice هي (question و options)." 
        };

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [systemMessage, ...messages],
            tools: [{
                type: "function",
                function: {
                    name: "create_component",
                    description: "إنشاء عنصر جديد",
                    parameters: {
                        type: "object",
                        properties: {
                            type: { type: "string", enum: ["Hero", "Define", "Choice"] },
                            data: { 
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    description: { type: "string" },
                                    word: { type: "string" },
                                    definition: { type: "string" },
                                    question: { type: "string" },
                                    options: { 
                                        type: "array", 
                                        items: {
                                            type: "object",
                                            properties: {
                                                label: { type: "string" },
                                                result: { type: "string" }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        required: ["type"]
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
