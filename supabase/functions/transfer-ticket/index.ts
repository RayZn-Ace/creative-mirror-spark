import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { UUID } from '../_shared/paymentSafety.ts';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json','Cache-Control':'no-store'}});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 try{
  const auth=req.headers.get('Authorization');if(!auth)return json({error:'Nicht autorisiert'},401);
  const url=Deno.env.get('SUPABASE_URL');const key=Deno.env.get('SUPABASE_ANON_KEY');if(!url||!key)throw Error('Configuration unavailable');
  const client=createClient(url,key,{global:{headers:{Authorization:auth}}});
  const {data:{user},error}=await client.auth.getUser();if(error||!user)return json({error:'Nicht autorisiert'},401);
  const raw=await req.text();if(raw.length>8192)return json({error:'Anfrage zu groß'},400);
  const b=JSON.parse(raw);
  if(typeof b.ticket_id!=='string'||!UUID.test(b.ticket_id)||typeof b.to_email!=='string'||b.to_email.length>255||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.to_email)||(b.to_name!=null&&(typeof b.to_name!=='string'||b.to_name.length>255))||(b.message!=null&&(typeof b.message!=='string'||b.message.length>2000)))return json({error:'Bitte prüfe die Übertragungsdaten.'},400);
  const result=await client.rpc('transfer_owned_ticket',{p_ticket:b.ticket_id,p_email:b.to_email.trim().toLowerCase(),p_name:b.to_name??null,p_message:b.message??null});
  if(result.error)return json({error:'Ticket kann nicht übertragen werden.'},403);
  return json(result.data);
 }catch{return json({error:'Übertragung nicht bestätigt.'},503);}
});
