function normalizeTool(tool){
  const names=[
    'update_text','update_style','create_component','delete_component','reorder_layout','highlight_element','preview_change','apply_change','reset_section',
    'replace_text','append_text','update_typography','update_spacing','apply_theme','duplicate_component','move_component','create_section','split_section','merge_sections','add_button','add_link','scroll_to_element','focus_element','batch_update','validate_selector','get_selected_element_info','get_dom_summary','save_snapshot','restore_snapshot'
  ];
  if(!tool||names.indexOf(tool.name)<0)return null;
  tool.params=tool.params||{};
  return tool;
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
          {
            role:'system',
            content:`أنت AI متخصص في S3D AI Builder.

قواعد:
- نفّذ باستخدام tools.
- لا تشرح فقط.
- لا تعدل view.html.
- التعديل داخل Builder فقط.
- حافظ على RTL.
- Mobile-first.
- لا تكسر التصميم.
- لا تحذف عناصر بدون تأكيد.
- استخدم selectedSelector.
- إذا selector غير واضح اطلب تحديد.
- لا تخترع selector.
- أرجع tool واحد فقط.
- الرد مختصر.

الإخراج:
{
  "reply":"string",
  "tool":{
    "name":"string",
    "params":{}
  },
  "requiresConfirmation":false,
  "reason":"string"
}`
          },
          {
            role:'user',
            content:JSON.stringify(payload)
          }
        ]
      })
    });

    const data=await response.json();

    if(!response.ok){
      return res.status(response.status).json({error:data.error?.message||'AI failed'});
    }

    const content=data.choices?.[0]?.message?.content||'{}';
    const json=JSON.parse(content);

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
