function normalizeTool(tool){
  const names=[
    'update_text','update_style','create_component','delete_component','reorder_layout','highlight_element','preview_change','apply_change','reset_section',
    'replace_text','append_text','update_typography','update_spacing','apply_theme','duplicate_component','move_component','create_section','split_section','merge_sections','add_button','add_link','scroll_to_element','focus_element','batch_update','validate_selector','get_selected_element_info','get_dom_summary','save_snapshot','restore_snapshot'
  ];
  if(!tool||names.indexOf(tool.name)<0)return null;
  tool.params=tool.params||{};
  return tool;
}

function wantsFullPage(message,body){
  const m=String(message||'').toLowerCase();
  const isEmpty=!body.hasPageContent&&(!body.domSummary||!body.domSummary.count);
  return isEmpty||/انشاء صفحة|إنشاء صفحة|ابن صفحة|بناء صفحة|build page|generate page|create page|full html/i.test(m);
}

const HTML_SYSTEM_MESSAGE=`You are an AI UI Builder inside the S3D AI Builder project.

When the user asks to create, build, or generate a page, return FULL HTML ONLY.
Do NOT return JSON.
Do NOT use tools.
Do NOT ask questions.
Build immediately.

Requirements:
- Arabic RTL page.
- Mobile-first responsive design.
- Use Tailwind CDN in the head.
- Return a complete document starting with <!DOCTYPE html>.
- Include: html lang="ar" dir="rtl", head, body.
- Include multiple sections, cards, headings, paragraphs, examples, and practical content.
- Professional SaaS-like visual design.
- No external images unless using gradients/placeholders.
- No script tags.
- No unsafe inline event handlers.`;

const JSON_SYSTEM_MESSAGE=`You are an AI UI Builder inside the S3D AI Builder project.

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

CORE BEHAVIOR:

If a page already exists, use tools to modify it.
Do NOT rebuild the full page unless the user explicitly asks.
Do NOT ask questions.
Be proactive.

TOOLS USAGE:
- Use tools for edits.
- Do NOT generate raw HTML in edit mode.
- Return ONE tool per response.

SELECTOR RULES:
- Use selectedSelector if available.
- If not available, use "body".

Rules:
- Always return JSON.
- Never return text outside JSON.
- If no tool is needed, set "tool": null.
- Keep reply short.`;

export default async function handler(req,res){
  try{
    if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
    if(!process.env.OPENAI_API_KEY)return res.status(500).json({error:'OPENAI_API_KEY missing'});

    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):req.body||{};
    const message=body.message||'';
    if(!message)return res.status(400).json({error:'Missing message'});

    const fullPage=wantsFullPage(message,body);
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

    const requestBody={
      model:'gpt-4o-mini',
      messages:[
        {role:'system',content:fullPage?HTML_SYSTEM_MESSAGE:JSON_SYSTEM_MESSAGE},
        {role:'user',content:fullPage?message:JSON.stringify(payload)}
      ]
    };

    if(!fullPage)requestBody.response_format={type:'json_object'};

    const response=await fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer '+process.env.OPENAI_API_KEY
      },
      body:JSON.stringify(requestBody)
    });

    const data=await response.json();

    if(!response.ok){
      return res.status(response.status).json({error:data.error?.message||'AI failed'});
    }

    const content=data.choices?.[0]?.message?.content||'';

    if(fullPage){
      return res.status(200).json({
        mode:'html',
        reply:'تم إنشاء الصفحة',
        html:content,
        tool:null
      });
    }

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
      mode:'tool',
      reply:json.reply||'تم',
      tool:normalizeTool(json.tool),
      requiresConfirmation:json.requiresConfirmation||false,
      reason:json.reason||''
    });

  }catch(err){
    return res.status(500).json({error:err.message||'Chat failed'});
  }
}
