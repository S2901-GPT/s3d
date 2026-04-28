import { OpenAI } from 'openai';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { messages } = body;
        
        const systemMessage = { 
            role: "system", 
            content: `أنت خبير محتوى علمي وطبي ومصمم صفحات SaaS تفاعلية.
مهمتك: توليد محتوى دقيق، مفصل، وحقيقي، وعرضه باستخدام أداة create_component.

🚨 قواعد صارمة جداً إياك مخالفتها:
1. ممنوع منعاً باتاً إرسال بيانات فارغة أو نصوص افتراضية مثل "عنوان القسم" أو "وصف هنا".
2. يجب أن تملأ كائن "data" بالبيانات الحقيقية بالكامل بناءً على نوع المكون.
3. إذا استخدمت (Card)، يجب أن تكتب تفاصيل داخل challenges و advantages و analysis.
4. إذا استخدمت (Accordion)، يجب أن تضع بيانات حقيقية داخل accordionItems.
5. إذا استخدمت (List)، يجب أن تضع نصوصاً داخل listItems.
6. اكتب دائماً محتوى غني، منطقي، وطويل نسبياً يفيد القارئ.`
        };

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [systemMessage, ...messages],
            tools: [{
                type: "function",
                function: {
                    name: "create_component",
                    description: "بناء عنصر تفاعلي في الصفحة. يجب إرفاق المحتوى كاملاً.",
                    parameters: {
                        type: "object",
                        properties: {
                            type: { type: "string", enum: ["Hero", "Define", "Choice", "Card", "Accordion", "List"] },
                            data: { 
                                type: "object",
                                description: "البيانات الفعلية للمكون (يجب تعبئتها وعدم تركها فارغة)",
                                properties: {
                                    title: { type: "string", description: "عنوان القسم أو البطاقة" },
                                    description: { type: "string", description: "الوصف التفصيلي" },
                                    word: { type: "string" },
                                    definition: { type: "string" },
                                    question: { type: "string" },
                                    options: { type: "array", items: { type: "object", properties: { label: { type: "string" }, result: { type: "string" } } } },
                                    challenges: { type: "array", items: { type: "object", properties: { title: { type: "string" }, example: { type: "string" } } } },
                                    advantages: { type: "array", items: { type: "object", properties: { title: { type: "string" }, example: { type: "string" } } } },
                                    analysis: { type: "string" },
                                    accordionItems: { type: "array", items: { type: "object", properties: { title: { type: "string" }, content: { type: "string" } } } },
                                    listItems: { type: "array", items: { type: "string" } },
                                    isNumbered: { type: "boolean" }
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
