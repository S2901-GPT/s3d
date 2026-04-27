function normalizeTool(tool){
  const names=['update_style','update_spacing','update_typography','apply_theme','batch_update'];
  if(!tool||names.indexOf(tool.name)<0)return null;
  tool.params=tool.params||{};
  if(tool.name==='batch_update'){
    const tools=Array.isArray(tool.params.tools)?tool.params.tools:[];
    tool.params.tools=tools.map(normalizeTool).filter(Boolean);
    if(!tool.params.tools.length)return null;
  }
  return tool;
}

const SYSTEM_MESSAGE=`أنت مساعد تصميم احترافي داخل S3D Builder.

مهمتك:
تحسين التصميم وتمكين التحكم اليدوي فقط بدون إنشاء محتوى أو تغيير النصوص.

القواعد الصارمة:

1) ممنوع تمامًا:
- إنشاء HTML
- استخدام <!DOCTYPE> أو <html> أو <body>
- استخدام document.write
- تعديل النصوص أو إنشاء محتوى
- استخدام update_text

2) المسموح فقط:
- update_style
- update_spacing
- update_typography
- apply_theme
- batch_update

الأهداف:
- تحسين الشكل العام UI
- جعل التصميم حديث Modern / Glass / Dark
- تحسين تجربة المستخدم
- تمكين التحكم اليدوي في الخصائص

قواعد التصميم:
- استخدم ألوان متناسقة و gradients احترافية عند الحاجة
- حافظ على تباين واضح
- padding بين 16px و 32px
- borderRadius بين 16px و 24px
- shadow ناعم: 0 10px 30px rgba(0,0,0,0.3)
- fontSize واضح 16px+
- lineHeight مريح 1.6 إلى 1.9

التحكم اليدوي:
عند طلب "تحكم" أو "تصميم" أو "تعديل الشكل" ركّز على:
- background
- color
- padding
- borderRadius
- boxShadow
- fontSize

هيكل الرد إجباري JSON فقط بدون شرح أو markdown:
{
  "reply": "تم تحسين التصميم",
  "tool": {
    "name": "batch_update",
    "params": {
      "tools": [
        {
          "name": "update_style",
          "params": {
            "background": "#16161a",
            "color": "#ffffff",
            "borderRadius": "20px",
            "boxShadow": "0 20px 60px rgba(0,0,0,0.4)"
          }
        },
        {
          "name": "update_spacing",
          "params": {
            "padding": "24px"
          }
        },
        {
          "name": "update_typography",
          "params": {
            "fontSize": "18px",
            "lineHeight": "1.8"
          }
        }
      ]
    }
  }
}

ملاحظات مهمة:
- لا تستخدم update_text
- لا ترجع HTML
- لا ترجع نص عادي بدون tool
- كل تعديل يجب أن يكون مرئي داخل الصفحة الحالية فقط

الهدف النهائي:
تحويل الصفحة إلى تصميم احترافي مع تحكم يدوي كامل بدون كسر النظام.`;

function stripCodeFence(text){
  return String(text||'')
    .trim()
    .replace(/^```(?:json|html)?\s*/i,'')
    .replace(/\s*```$/,'')
    .trim();
}

function fallbackDesignTool(selectedSelector){
  const selector=selectedSelector||'body';
  return {
    name:'batch_update',
    params:{
      tools:[
        {name:'apply_theme',params:{brand:'#7c3aed',primary:'#7c3aed',card:'#16161a'}},
        {name:'update_style',params:{selector,background:'linear-gradient(135deg,#0f172a,#16161a)',color:'#ffffff',borderRadius:'20px',boxShadow:'0 10px 30px rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.12)'}},
        {name:'update_spacing',params:{selector,padding:'24px',gap:'16px'}},
        {name:'update_typography',params:{selector,fontSize:'18px',lineHeight:'1.8'}}
      ]
    }
  };
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

    if(/^\s*<!DOCTYPE/i.test(content)||/^\s*<html/i.test(content)||/^\s*<body/i.test(content)||/document\.write/i.test(content)||/update_text/i.test(content)){
      return res.status(200).json({reply:'تم تحسين التصميم',tool:fallbackDesignTool(body.selectedSelector)});
    }

    let json;
    try{
      json=JSON.parse(content);
    }catch(parseError){
      return res.status(200).json({reply:'تم تحسين التصميم',tool:fallbackDesignTool(body.selectedSelector)});
    }

    let tool=normalizeTool(json.tool);
    if(!tool)tool=fallbackDesignTool(body.selectedSelector);

    return res.status(200).json({
      reply:'تم تحسين التصميم',
      tool
    });

  }catch(err){
    return res.status(500).json({error:err.message||'Chat failed'});
  }
}
