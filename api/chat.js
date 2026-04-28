import { OpenAI } from 'openai';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { messages } = body;
        
        const systemMessage = { 
            role: "system", 
            content: "أنت خبير محتوى علمي وباني صفحات SaaS تفاعلية. يجب أن يكون المحتوى دقيقاً ومنطقياً وغنياً بالمعلومات. استخدم Hero للعناوين، Card للتحليل، Accordion للأسئلة الشائعة، List للنقاط، Define للتعريفات، و Choice للاختبارات. استخدم create_component دائماً." 
        };

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [systemMessage, ...messages],
            tools: [{
                type: "function",
                function: {
                    name: "create_component",
                    parameters: {
                        type: "object",
                        properties: {
                            type: { type: "string", enum: ["Hero", "Define", "Choice", "Card", "Accordion", "List"] },
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
