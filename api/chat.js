import { OpenAI } from 'openai';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const { messages, currentHtml } = req.body;
        
        const systemMessage = { 
            role: "system", 
            content: `أنت مهندس برمجيات ومصمم واجهات (Premium UI/UX) خبير في بناء أنظمة SaaS التفاعلية. تمتلك **حرية مطلقة**.

حالة الصفحة الحالية (HTML):
\`\`\`html
${currentHtml || 'فارغة'}
\`\`\`

🚨 قواعد البناء الشامل (The Master Builder Rules):
1. **لا تقيد نفسك بموضوع:** المحتوى قد يكون عن التجارة، البرمجة، الرياضة، علم النفس، أو أي شيء يطلبه المستخدم.
2. **بناء الشاشات الكاملة (One-Shot Generation):** إذا طلب المستخدم "شاشة كاملة"، "لوحة مثل كنين"، أو "موضوعاً شاملاً"، **إياك أن تبني عنصراً واحداً فقط**. يجب عليك تصميم صفحة متكاملة دفعة واحدة! قم باستدعاء أداة (create_component) عدة مرات متتالية في نفس الرد (مثلاً: Hero ثم عدة Cards ثم Accordion)، أو استخدم (update_page_html) لكتابة كود صفحة كاملة فاخرة تحتوي على تبويبات وبطاقات.
3. **الفخامة المطلقة (Premium Design):** استخدم Tailwind ببراعة. ضع ظلالاً عميقة (shadow-2xl)، حواف ناعمة جداً (rounded-[2rem] أو rounded-3xl)، مساحات مريحة (p-8, gap-6)، وألواناً هادئة ومتناسقة.
4. **تطابق المحتوى (القاعدة الذهبية):** إذا طُلب منك تعديل شيء موجود، اقرأ نصوصه الحالية من الـ HTML المرفق، وحافظ عليها حرفياً. غير التصميم والهيكلة فقط واستخدم (replace_element) أو (update_page_html).

تعليمات الأدوات:
- (create_component): لبناء العناصر الجاهزة. يمكنك استدعاؤها أكثر من مرة لبناء صفحة كاملة.
- (replace_element): لتعديل قسم محدد (عبر الـ ID) دون لمس الباقي.
- (update_page_html): لدمج الأقسام أو بناء شاشة كاملة معقدة من الصفر.
- (inject_custom_html): لأي تصميم مبتكر لا تتوفر له قوالب.`
        };

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [systemMessage, ...messages],
            tools: [
                {
                    type: "function",
                    function: {
                        name: "create_component",
                        description: "بناء أقسام المنصة الفاخرة. استدعِ هذه الأداة عدة مرات لبناء صفحة كاملة.",
                        parameters: { type: "object", properties: { type: { type: "string", enum: ["Hero", "Define", "Choice", "Card", "Accordion", "List"] }, data: { type: "object" } }, required: ["type", "data"] }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "replace_element",
                        description: "استبدال محتوى قسم محدد بدقة مع الحفاظ على نصوصه السابقة.",
                        parameters: {
                            type: "object",
                            properties: {
                                target_id: { type: "string" },
                                html: { type: "string" }
                            },
                            required: ["target_id", "html"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "update_page_html",
                        description: "بناء أو تعديل الـ HTML الكامل للصفحة. ممتاز لبناء شاشات معقدة دفعة واحدة.",
                        parameters: { type: "object", properties: { html: { type: "string" } }, required: ["html"] }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "inject_custom_html",
                        description: "حقن كود حر جديد كلياً.",
                        parameters: { type: "object", properties: { html: { type: "string" } }, required: ["html"] }
                    }
                }
            ],
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
