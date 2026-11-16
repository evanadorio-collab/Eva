import { createClient } from "npm:@supabase/supabase-js@2.49.8";
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin");
 const allowedOrigin=origin==="https://trilhacarreira.vercel.app"||origin==="https://eva-fase-1.vercel.app"?origin:"https://evanadorio-collab.github.io";
const h={"Access-Control-Allow-Origin":allowedOrigin,"Vary":"Origin","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const reply=(x:unknown,s=200)=>new Response(JSON.stringify(x),{status:s,headers:h});
 if(req.method==="OPTIONS")return new Response(null,{headers:h});
 if(req.method!=="POST")return reply({error:"Método não permitido"},405);
 try{
  const auth=req.headers.get("Authorization")||"";
  if(!auth.startsWith("Bearer "))return reply({error:"Faça login."},401);
  const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:auth}}});
  const {data:{user},error:ue}=await db.auth.getUser();
  if(ue||!user)return reply({error:"Sessão inválida."},401);
  const body=await req.json();const id=body?.curriculo_id;
  if(typeof id!=="string"||!/^[0-9a-f-]{36}$/i.test(id))return reply({error:"Currículo inválido."},400);
  const {data:cv,error:ce}=await db.from("curriculos").select("caminho_storage").eq("id",id).eq("usuario_id",user.id).single();
  if(ce||!cv)return reply({error:"Currículo não encontrado."},404);
  const {data:file,error:fe}=await db.storage.from("curriculos").download(cv.caminho_storage);
  if(fe||!file)return reply({error:"Não foi possível abrir o PDF."},400);
  if(file.size>10*1024*1024)return reply({error:"PDF maior que 10 MB."},413);
  const bytes=new Uint8Array(await file.arrayBuffer());let binary="";
  for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  const key=Deno.env.get("GEMINI_API_KEY")?.trim();
  if(!key)return reply({error:"GEMINI_API_KEY não configurada."},503);
  const instruction="Extraia APENAS fatos explicitamente presentes neste currículo PDF. Não invente informações. Campos ausentes devem ser vazios. Responda exclusivamente JSON: {nome:string,resumo:string,competencias:string[],experiencias:[{empresa:string,cargo:string,periodo:string,responsabilidades:string,resultados:string}],formacao:string,cursos:string,idiomas:string}. Resumo conciso, fiel ao documento. Não inclua dados pessoais desnecessários.";
  const modelsResponse=await fetch("https://generativelanguage.googleapis.com/v1beta/models",{headers:{"x-goog-api-key":key}});
  const modelsData=await modelsResponse.json();
  if(!modelsResponse.ok){console.error("Gemini models list error",modelsResponse.status,modelsData?.error?.status);return reply({error:"Não foi possível consultar os modelos do Gemini ("+modelsResponse.status+")."},502);}
  const allowed=(modelsData.models||[]).filter((m:{name:string,supportedGenerationMethods?:string[]})=>m.supportedGenerationMethods?.includes("generateContent"));
  const preferidos=["models/gemini-3.5-flash-lite","models/gemini-3.5-flash","models/gemini-3-flash","models/gemini-2.5-flash-lite","models/gemini-2.5-flash"];
  const modelos=preferidos.filter(name=>allowed.some((m:{name:string})=>m.name===name));
  if(!modelos.length)return reply({error:"Nenhum modelo Gemini compatível está disponível para esta chave."},502);
  const payload=JSON.stringify({contents:[{parts:[{text:instruction},{inline_data:{mime_type:"application/pdf",data:btoa(binary)}}]}],generationConfig:{responseMimeType:"application/json",temperature:0.1,maxOutputTokens:4096}});
  let result;
  for(let tentativa=0;tentativa<2;tentativa++){
   const modelo=modelos[tentativa]??modelos[0];
   let ai:Response;
   try{
    ai=await fetch("https://generativelanguage.googleapis.com/v1beta/"+modelo+":generateContent",{
     method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},body:payload,
     signal:AbortSignal.timeout(25000),
    });
    result=await ai.json().catch(()=>null);
   }catch{
    if(tentativa===0){await new Promise(resolve=>setTimeout(resolve,700));continue;}
    return reply({error:"A IA demorou a responder. Tente novamente ou preencha os campos manualmente."},502);
   }
   if(ai.ok)break;
   console.warn("Falha na extração Gemini",ai.status,modelo);
   if(tentativa===0&&[500,502,503,504].includes(ai.status)){
    await new Promise(resolve=>setTimeout(resolve,700));
    continue;
   }
   const msg=ai.status===429?"Limite de uso do Gemini atingido. Tente novamente mais tarde.":ai.status===400?"O Gemini não conseguiu ler este PDF. Confira se o arquivo abre ou preencha os campos manualmente.":ai.status>=500?"A IA está temporariamente indisponível. Tente novamente ou preencha os campos manualmente.":"Não foi possível acessar o Gemini para extrair o currículo.";
   return reply({error:msg},502);
  }
  let parsed:Record<string,unknown>;
  try{parsed=JSON.parse(result?.candidates?.[0]?.content?.parts?.filter((p:{thought?:boolean})=>!p.thought).map((p:{text?:string})=>p.text||"").join("")||"");if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Error();}catch{return reply({error:"Resposta inválida da IA. Tente novamente."},502)}
  const str=(v:unknown)=>typeof v==="string"?v:"";
  const experiencias=Array.isArray(parsed.experiencias)?parsed.experiencias.slice(0,30).map((e:Record<string,unknown>)=>({empresa:str(e.empresa),cargo:str(e.cargo),periodo:str(e.periodo),responsabilidades:str(e.responsabilidades),resultados:str(e.resultados)})):[];
  return reply({perfil:{nome:str(parsed.nome),resumo:str(parsed.resumo),competencias:Array.isArray(parsed.competencias)?parsed.competencias.filter((x:unknown)=>typeof x==="string").slice(0,80):[],experiencias,formacao:str(parsed.formacao),cursos:str(parsed.cursos),idiomas:str(parsed.idiomas)}});
 }catch{return reply({error:"Não foi possível processar o currículo."},500)}
});