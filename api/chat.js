import { OpenAI } from 'openai';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { messages } = body;
        
        const systemMessage = { 
            role: "system", 
            content: "أنت باني صفحات SaaS تفاعلية. استخدم أداة create_component لإنشاء العناصر. لإنشاء محتوى تحليلي مقسم (مثل مميزات وتحديات)، استخدم نوع (Card) حصراً. للتعريفات السريعة استخدم (Define). للأسئلة استخدم (Choice). للبدايات استخدم (Hero)." 
        };

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [systemMessage, ...messages],
            tools: [{
                type: "function",
                function: {
                    name: "create_component",
                    description: "إنشاء عنصر تفاعلي في الصفحة.",
                    parameters: {
                        type: "object",
                        properties: {
                            type: { type: "string", enum: ["Hero", "Define", "Choice", "Card"] },
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
                                    },
                                    challenges: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                title: { type: "string" },
                                                example: { type: "string" }
                                            }
                                        }
                                    },
                                    advantages: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                title: { type: "string" },
                                                example: { type: "string" }
                                            }
                                        }
                                    },
                                    analysis: { type: "string" }
                                }
                            }
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
