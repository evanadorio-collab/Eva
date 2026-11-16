import { createClient } from "npm:@supabase/supabase-js@2.80.0";

const origin = "https://trilhacarreira.vercel.app";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const headers = {
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
};
const respond = (status: number, payload = {}) =>
  new Response(JSON.stringify(payload), { status, headers });
const encoder = new TextEncoder();
async function hash(value: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.headers.get("origin") !== origin) return respond(403);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return respond(405);
  const jwt = request.headers.get("authorization")?.match(/^Bearer (\S+\.\S+\.\S+)$/i)?.[1];
  if (!jwt) return respond(401);

  try {
    const { data: { user }, error } = await db.auth.getUser(jwt);
    if (error || !user?.email || !user.email_confirmed_at || user.role !== "authenticated") {
      return respond(401);
    }
    const text = await request.text();
    if (text.length > 512) return respond(400);
    const body = JSON.parse(text);
    const target = await hash(user.email.trim().toLowerCase());
    const now = new Date().toISOString();
    const requests = () => db.from("login_handoffs");

    if (body.action === "available") {
      const { data, error } = await requests().select("id")
        .eq("email_hash", target).gt("expires_at", now)
        .is("approved_user", null).not("desktop_key", "is", null).limit(1);
      if (error) throw error;
      return respond(200, { available: data.length > 0 });
    }

    if (body.action !== "approve" || typeof body.code !== "string" || !/^[A-F0-9]{10}$/.test(body.code)) {
      return respond(400);
    }

    const { data: approved, error: approveError } = await requests()
      .update({ approved_user: user.id })
      .eq("email_hash", target).eq("code_hash", await hash(body.code))
      .is("approved_user", null).not("desktop_key", "is", null).gt("expires_at", now)
      .select("id,desktop_key").maybeSingle();
    if (approveError) throw approveError;
    if (!approved) return respond(404);
    const key = await crypto.subtle.importKey("jwk", approved.desktop_key, {
      name: "RSA-OAEP", hash: "SHA-256",
    }, false, ["encrypt"]);

    const { data: link, error: linkError } = await db.auth.admin.generateLink({
      type: "magiclink", email: user.email,
    });
    if (linkError || link?.user?.id !== user.id || !link.properties?.hashed_token) return respond(409);

    const ciphertext = await crypto.subtle.encrypt("RSA-OAEP", key, encoder.encode(link.properties.hashed_token));
    const sealed = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
    const { data: stored, error: storeError } = await requests().update({ sealed_token: sealed })
      .eq("id", approved.id).eq("approved_user", user.id).gt("expires_at", new Date().toISOString())
      .select("id").maybeSingle();
    if (storeError) throw storeError;
    return stored ? respond(200, { approved: true }) : respond(409);
  } catch {
    return respond(500);
  }
});
