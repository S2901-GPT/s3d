function normalizeTool(tool){
  const names=[
    'update_text','update_style','create_component','delete_component','reorder_layout','highlight_element','preview_change','apply_change','reset_section',
    'replace_text','append_text','update_typography','update_spacing','apply_theme','duplicate_component','move_component','create_section','split_section','merge_sections','add_button','add_link','scroll_to_element','focus_element','batch_update','validate_selector','get_selected_element_info','get_dom_summary','save_snapshot','restore_snapshot'
  ];
  if(!tool||names.indexOf(tool.name)<0)return null;
  tool.params=tool.params||{};
  return tool;
}

const SYSTEM_MESSAGE=`أنت نظام Backend لـ S3D Builder.

ممنوع إرجاع HTML كامل.
ممنوع إرجاع <!DOCTYPE html> أو <html>.

يجب أن يكون الرد دائمًا JSON صالح فقط بدون أي نص إضافي.

هيكل الرد الإجباري:
{
  "reply": "وصف قصير لما تم",
  "tool": {
    "name": "اسم الأداة",
    "params": { }
  }
}

القواعد:
- إذا كان الطلب تعديل عنصر → استخدم tool
- إذا لم يوجد tool مناسب → أرجع reply فقط بدون tool
- لا تستخدم markdown
- لا تستخدم \`\`\`json
- لا تضف شرح خارج JSON
- لا تسأل المستخدم عن تفاصيل
- استخدم selectedSelector إذا كان متوفرًا
- استخدم أداة واحدة فقط في الرد

أمثلة:

1) تغيير نص:
{
  "reply": "تم تحديث النص",
  "tool": {
    "name": "update_text",
    "params": {
      "text": "النص الجديد"
    }
  }
}

2) إضافة قسم:
{
  "reply": "تم إضافة قسم",
  "tool": {
    "name": "create_section",
    "params": {
      "type": "text"
    }
  }
}

3) بدون تنفيذ:
{
  "reply": "تم فهم الطلب"
}

أي رد غير JSON سيتم اعتباره خطأ.`;

function stripCodeFence(text){
  return String(text||'')
    .trim()
    .replace(/^```(?:json)?\s*/i,'')
    .replace(/\s*```$/,'')
    .trim();
}

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
    if(!response.ok)return res.status(response.status).json({error:data.error?.message||'AI failed'});

    const content=stripCodeFence(data.choices?.[0]?.message?.content||'{}');

    if(/^\s*<!DOCTYPE html/i.test(content)||/^\s*<html/i.test(content)){
      return res.status(502).json({
        error:'AI returned HTML instead of JSON',
        detail:'HTML responses are not allowed from /api/chat.'
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

    const result={reply:json.reply||'تم'};
    const tool=normalizeTool(json.tool);
    if(tool)result.tool=tool;

    return res.status(200).json(result);

  }catch(err){
    return res.status(500).json({error:err.message||'Chat failed'});
  }
}
