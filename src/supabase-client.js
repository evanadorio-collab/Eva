import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./supabase-config.js";
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
export async function listarCompetencias(){
  const { data, error } = await supabase.from("competencias").select("codigo,nome,categoria,descricao,sinonimos").order("nome");
  if(error) throw error;
  return data;
}
export async function entrarComEmail(email){
  return supabase.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});
}
export async function salvarPerfil({nome,resumo,preferencias={}}){
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user) throw new Error("Entre na sua conta antes de salvar dados.");
  const {data,error}=await supabase.from("perfis").upsert({usuario_id:user.id,nome,resumo,preferencias,validado_em:new Date().toISOString()},{onConflict:"usuario_id"}).select().single();
  if(error) throw error;
  return data;
}
