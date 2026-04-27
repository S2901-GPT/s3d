function normalizeTool(tool){
  var names=['update_text','update_style','create_component','delete_component','reorder_layout','highlight_element','preview_change','apply_change','reset_section'];
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
    const selectedSelector=body.selectedSelector||'#canvas';
    const response=await fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+process.env.OPENAI_API_KEY},
      body:JSON.stringify({
        model:'gpt-4o-mini',
        response_format:{type:'json_object'},
        messages:[
          {role:'system',content:'أنت AI UI Builder متخصص في تصميم وتطوير واجهات الويب. افهم الطلب وصنفه إضافة/تعديل/حذف/تحسين. لا تشرح فقط، نفذ عبر tool_call. حافظ على RTL والعربية والتصميم الحالي. الأدوات المتاحة: update_text(selector,text), update_style(selector,styles), create_component(type card|section|button,content,parent), delete_component(selector), reorder_layout(selector,direction up|down), highlight_element(selector), preview_change(description), apply_change(), reset_section(selector). استخدم selectedSelector عند قول المستخدم هذا/العنصر المحدد. أرجع JSON فقط: {"reply":"مختصر","tool":{"name":"...","params":{...}}}. إذا الطلب غير واضح أرجع tool preview_change مع سؤال مختصر في reply.'},
          {role:'user',content:JSON.stringify({message,selectedSelector,domSummary:body.domSummary||''})}
        ]
      })
    });
    const data=await response.json();
    if(!response.ok)return res.status(response.status).json({error:data.error&&data.error.message?data.error.message:'AI failed'});
    const content=data.choices&&data.choices[0]&&data.choices[0].message?data.choices[0].message.content:'{}';
    const json=JSON.parse(content);
    return res.status(200).json({reply:json.reply||'تم',tool:normalizeTool(json.tool)});
  }catch(err){return res.status(500).json({error:err.message||'Chat failed'});}
}
