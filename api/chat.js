function normalizeTool(tool){
  const names=[
    'update_text','update_style','create_component','delete_component','reorder_layout','highlight_element','preview_change','apply_change','reset_section',
    'replace_text','append_text','update_typography','update_spacing','apply_theme','duplicate_component','move_component','create_section','split_section','merge_sections','add_button','add_link','scroll_to_element','focus_element','batch_update','validate_selector','get_selected_element_info','get_dom_summary','save_snapshot','restore_snapshot'
  ];
  if(!tool||names.indexOf(tool.name)<0)return null;
  tool.params=tool.params||{};
  return tool;
}

const SYSTEM_MESSAGE=`You are an AI UI Builder inside the S3D AI Builder project.

IMPORTANT:
You must ALWAYS return a valid JSON response.
Do NOT return plain text.

The response MUST include JSON.

JSON format:

{
  "reply": "short message",
  "tool": {
    "name": "tool_name",
    "params": {}
  }
}

----------------------------------------

CORE BEHAVIOR:

If the user asks to:
- create a page
- build content
- generate sections
- or gives a general topic

You MUST:

- NOT ask for more details
- NOT ask questions
- NOT wait for clarification

Instead:

- Automatically generate a full structured page
- Be proactive
- Assume a professional layout

----------------------------------------

PAGE BUILDING RULES:

When building a page:

1. Create a main title
2. Create multiple sections
3. Each section must include:
   - heading
   - description
   - structured content (lists or cards)

4. Always include:
   - introduction
   - main sections
   - explanations
   - examples if possible

----------------------------------------

TOOLS USAGE:

You MUST use tools to build the page.

Do NOT generate raw HTML.

Use tools step-by-step:

- create_component
- update_text
- update_style

If full page requested:
→ start creating sections immediately

----------------------------------------

SELECTOR RULES:

- Use selectedSelector if available
- If not available → use "body"

----------------------------------------

RESPONSE RULES:

- Always return JSON
- Always include the word JSON implicitly in behavior
- Return ONE tool per response
- Keep reply short

----------------------------------------

EXAMPLE:

User:
"انشاء صفحة عن متلازمة اسبرجر"

Expected behavior:

- AI must NOT ask anything
- AI must immediately start building

----------------------------------------

أي سلوك يسأل المستخدم عن تفاصيل يعتبر خطأ.`;

export default async function handler(req,res){
  try{
    if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
    if(!process.env.OPENAI_API_KEY)return res.status(500).json({error:'OPENAI_API_KEY missing'});

    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):req.body||{};
    const message=body.message||'';
    if(!message)return res.status(400).json({error:'Missing message'});

    const payload={
      message,
      selectedSelector:body.selectedSelector,
      domSummary:body.domSummary,
      currentMode:body.currentMode,
      selectedElementInfo:body.selectedElementInfo,
      recentActions:body.recentActions,
      pageGoal:body.pageGoal,
      deviceMode:'mobile',
      publicViewProtected:true
    };

    const response=await fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer '+process.env.OPENAI_API_KEY
      },
      body:JSON.stringify({
        model:'gpt-4o-mini',
        response_format:{type:'json_object'},
        messages:[
          {role:'system',content:SYSTEM_MESSAGE},
          {role:'user',content:JSON.stringify(payload)}
        ]
      })
    });

    const data=await response.json();

    if(!response.ok){
      return res.status(response.status).json({error:data.error?.message||'AI failed'});
    }

    const content=data.choices?.[0]?.message?.content||'';
    let json;

    try{
      json=JSON.parse(content);
    }catch(parseError){
      return res.status(502).json({
        error:'AI returned invalid JSON',
        detail:'The AI response could not be parsed as JSON. No tool was executed.',
        raw:content.slice(0,500)
      });
    }

    return res.status(200).json({
      reply:json.reply||'تم',
      tool:normalizeTool(json.tool),
      requiresConfirmation:json.requiresConfirmation||false,
      reason:json.reason||''
    });

  }catch(err){
    return res.status(500).json({error:err.message||'Chat failed'});
  }
}
