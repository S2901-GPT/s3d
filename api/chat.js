function normalizeTool(tool){
  const names=[
    'update_text','update_style','create_component','delete_component','reorder_layout','highlight_element','preview_change','apply_change','reset_section',
    'replace_text','append_text','update_typography','update_spacing','apply_theme','duplicate_component','move_component','create_section','split_section','merge_sections','add_button','add_link','scroll_to_element','focus_element','batch_update','validate_selector','get_selected_element_info','get_dom_summary','save_snapshot','restore_snapshot'
  ];
  if(!tool||names.indexOf(tool.name)<0)return null;
  tool.params=tool.params||{};
  return tool;
}

const SYSTEM_MESSAGE=`أنت تعمل داخل S3D Builder.

قواعد التنفيذ الإلزامية:

1) ممنوع إرسال HTML كامل:
- لا تستخدم <!DOCTYPE>
- لا تستخدم <html> أو <body>
- لا تستخدم document.write

2) أي طلب يجب تنفيذه باستخدام tools فقط.

3) إذا كان الطلب:
- قصير → استخدم update_text
- طويل / عنوان / يحتوي "دليل" أو "تحليل" أو "شرح" → أنشئ صفحة كاملة

4) عند إنشاء صفحة:
يجب استخدام batch_update ويحتوي على:
- create_section (hero)
- update_text
- create_section (text)
- update_text
- create_section (cards أو steps)
- update_text

5) الرد يجب أن يكون JSON فقط بدون markdown أو شرح:
{
  "reply": "تم التنفيذ",
  "tool": {
    "name": "batch_update",
    "params": {
      "tools": []
    }
  }
}

6) ممنوع:
- إرسال نص عادي بدون tool
- إرسال HTML
- إرسال \`\`\`json أو \`\`\`html

7) الهدف:
تنفيذ التعديل داخل الصفحة الحالية فقط بدون استبدالها.

أي رد غير JSON سيتم اعتباره خطأ.`;

function stripCodeFence(text){
  return String(text||'')
    .trim()
    .replace(/^```(?:json|html)?\s*/i,'')
    .replace(/\s*```$/,'')
    .trim();
}

function shouldBuildFullContent(message){
  const m=String(message||'').trim();
  if(/إنشاء|انشاء|تحليل|بناء|صفحة|دليل|شرح|create|build|generate|guide|analysis|explain/i.test(m))return true;
  return m.length>=45 && !/غيّر|غير|عدّل|عدل|احذف|حذف|لون|خط|كبّر|صغّر/i.test(m);
}

function shouldForceTool(message){
  return shouldBuildFullContent(message)||/أضف|اضف|غيّر|غير|عدّل|عدل|حسّن|حسن|رتّب|رتب|احذف|حذف/i.test(String(message||''));
}

function buildPageTool(message){
  const topic=String(message||'صفحة محتوى')
    .replace(/^(أنشئ|انشئ|إنشاء|انشاء|بناء|ابن|create|build|generate)\s*/i,'')
    .trim()||'صفحة محتوى';

  return {
    name:'batch_update',
    params:{
      tools:[
        {name:'create_section',params:{type:'hero'}},
        {name:'update_text',params:{title:topic,text:'مقدمة واضحة ومنظمة تعرض الموضوع بأسلوب مباشر مناسب للجوال وتضع القارئ في سياق سريع.'}},
        {name:'create_section',params:{type:'text'}},
        {name:'update_text',params:{title:'شرح شامل',text:'شرح مفصل حول '+topic+'، يتناول الفكرة الرئيسية، الخلفية، النقاط المهمة، وأفضل طريقة لفهم الموضوع أو تطبيقه داخل سياق عملي واضح.'}},
        {name:'create_section',params:{type:'cards'}},
        {name:'update_text',params:{title:'محاور رئيسية',items:'الفكرة الأساسية:تعريف مبسط وواضح للموضوع|الأهمية:لماذا يستحق هذا الموضوع الانتباه|التطبيق العملي:كيف يمكن تحويل الفكرة إلى خطوات قابلة للتنفيذ'}},
        {name:'create_section',params:{type:'steps'}},
        {name:'update_text',params:{title:'خطوات عملية',items:'حدد الهدف من الصفحة|اقرأ المحاور الرئيسية|اربط كل محور بمثال واقعي|استخدم الخلاصة لاتخاذ قرار أو إجراء'}}
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

    if(/^\s*<!DOCTYPE/i.test(content)||/^\s*<html/i.test(content)||/^\s*<body/i.test(content)||/document\.write/i.test(content)){
      return res.status(502).json({
        error:'AI returned forbidden HTML response',
        detail:'Only JSON tool responses are allowed from /api/chat.'
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
