function normalizeTool(tool){
  const names=[
    'update_text','update_style','create_component','delete_component','reorder_layout','highlight_element','preview_change','apply_change','reset_section',
    'replace_text','append_text','update_typography','update_spacing','apply_theme','duplicate_component','move_component','create_section','split_section','merge_sections','add_button','add_link','scroll_to_element','focus_element','batch_update','validate_selector','get_selected_element_info','get_dom_summary','save_snapshot','restore_snapshot'
  ];
  if(!tool||names.indexOf(tool.name)<0)return null;
  tool.params=tool.params||{};
  return tool;
}

const SYSTEM_MESSAGE=`أنت محرك بناء محتوى داخل S3D Builder.

ممنوع إرجاع HTML كامل.
ممنوع إرجاع <!DOCTYPE html> أو <html>.
ممنوع إرجاع نص فقط إذا كان الطلب قابل للتنفيذ.

أي نص طويل أو عنوان = اعتبره طلب إنشاء محتوى كامل وليس تعديل بسيط.
ممنوع استخدام update_text فقط في هذه الحالة.

يجب دائمًا إرجاع JSON صالح فقط بدون أي نص إضافي.

هيكل الرد الإجباري:
{
  "reply": "وصف قصير",
  "tool": {
    "name": "اسم الأداة",
    "params": { }
  }
}

قواعد مهمة:
- يجب دائمًا اختيار tool وتنفيذه إذا كان الطلب تعديل.
- لا تكتب "تم فهم الطلب" إطلاقًا.
- إذا كان الطلب عام، قم بتحويله إلى إجراءات فعلية باستخدام الأدوات.
- أي طلب فيه "إنشاء" أو "انشاء" أو "تحليل" أو "بناء" أو "create" أو "build" أو "generate" → استخدم batch_update.
- أي نص طويل أو عنوان طويل → استخدم batch_update + create_section + update_text.
- يجب بناء صفحة كاملة تحتوي على Hero و Text و Cards أو Steps.
- أي محتوى طويل → ضعه داخل text.
- لا ترجع رد بدون tool إلا إذا كان مستحيل التنفيذ.
- لا تستخدم markdown.
- لا تستخدم \`\`\`json.
- لا تضف شرح خارج JSON.
- لا تسأل المستخدم عن تفاصيل.
- استخدم selectedSelector إذا كان متوفرًا للتعديلات فقط، وليس عند بناء صفحة كاملة.
- استخدم أداة واحدة فقط في الرد، ويمكن أن تكون batch_update وبداخلها عدة tools.

هيكل بناء صفحة كاملة:
{
  "reply": "تم إنشاء صفحة كاملة",
  "tool": {
    "name": "batch_update",
    "params": {
      "tools": [
        { "name": "create_section", "params": {"type": "hero"} },
        { "name": "update_text", "params": {"title": "العنوان", "text": "الوصف"} },
        { "name": "create_section", "params": {"type": "text"} },
        { "name": "update_text", "params": {"text": "شرح مفصل"} },
        { "name": "create_section", "params": {"type": "cards"} },
        { "name": "update_text", "params": {"items": "عنصر1:شرح|عنصر2:شرح"} }
      ]
    }
  }
}

أي رد غير JSON سيتم اعتباره خطأ.`;

function stripCodeFence(text){
  return String(text||'')
    .trim()
    .replace(/^```(?:json)?\s*/i,'')
    .replace(/\s*```$/,'')
    .trim();
}

function shouldBuildFullContent(message){
  const m=String(message||'').trim();
  if(/إنشاء|انشاء|تحليل|بناء|صفحة|create|build|generate/i.test(m))return true;
  return m.length>=45 && !/غيّر|غير|عدّل|عدل|احذف|حذف|لون|خط|كبّر|صغّر/i.test(m);
}

function shouldForceTool(message){
  return /إنشاء|انشاء|تحليل|بناء|create|build|generate|أضف|اضف|غيّر|غير|عدّل|عدل|حسّن|حسن|رتّب|رتب|احذف|حذف/i.test(String(message||'')) || shouldBuildFullContent(message);
}

function buildPageTool(message){
  const topic=String(message||'صفحة محتوى').replace(/^(أنشئ|انشئ|إنشاء|انشاء|بناء|ابن|create|build|generate)\s*/i,'').trim()||'صفحة محتوى';
  return {
    name:'batch_update',
    params:{
      tools:[
        {name:'create_section',params:{type:'hero'}},
        {name:'update_text',params:{title:topic,text:'مقدمة منظمة تعرض الفكرة الأساسية وتضع القارئ في سياق واضح ومباشر.'}},
        {name:'create_section',params:{type:'text'}},
        {name:'update_text',params:{title:'شرح تفصيلي',text:'شرح مفصل ومنظم حول '+topic+'، يتناول المفهوم الأساسي، أهميته، أبرز النقاط المرتبطة به، وكيف يمكن فهمه أو تطبيقه بصورة عملية وواضحة.'}},
        {name:'create_section',params:{type:'cards'}},
        {name:'update_text',params:{title:'محاور رئيسية',items:'المفهوم الأساسي:تعريف مبسط وواضح للموضوع|الأهمية:لماذا يعتبر هذا الموضوع مهمًا للقارئ|أمثلة عملية:أمثلة تساعد على تحويل الفكرة إلى فهم قابل للتطبيق'}},
        {name:'create_section',params:{type:'steps'}},
        {name:'update_text',params:{title:'خطوات الفهم',items:'ابدأ بتحديد الفكرة الرئيسية|قسّم الموضوع إلى محاور صغيرة|اربط كل محور بمثال واقعي|راجع الخلاصة وحدد الإجراء التالي'}}
      ]
    }
  };
}

function fallbackTool(message,selectedSelector){
  const m=String(message||'');
  if(shouldBuildFullContent(m))return buildPageTool(m);
  return {name:'update_text',params:{selector:selectedSelector||'body',text:m}};
}

function isSingleUpdateText(tool){
  return tool&&tool.name==='update_text';
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

    const buildMode=shouldBuildFullContent(message);
    const result={reply:json.reply&&json.reply!=='تم فهم الطلب'?json.reply:'تم التنفيذ'};
    let tool=normalizeTool(json.tool);

    if(buildMode&&isSingleUpdateText(tool)){
      tool=normalizeTool(buildPageTool(message));
      result.reply='تم إنشاء صفحة كاملة';
    }

    if(!tool&&shouldForceTool(message)){
      tool=normalizeTool(fallbackTool(message,body.selectedSelector));
      result.reply=buildMode?'تم إنشاء صفحة كاملة':'تم تحويل الطلب إلى إجراء قابل للتنفيذ';
    }

    if(tool)result.tool=tool;

    return res.status(200).json(result);

  }catch(err){
    return res.status(500).json({error:err.message||'Chat failed'});
  }
}
