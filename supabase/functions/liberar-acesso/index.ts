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
const respond = (status: number, data: object) =>
  new Response(JSON.stringify(data), { status, headers });

const encoder = new TextEncoder();
const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
const hash = async (value: string) =>
  toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
const emailHash = (email: string) =>
  hash(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! + ":" + email.trim().toLowerCase());
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

Deno.serve(async (request) => {
  if (request.headers.get("origin") !== origin) return respond(403, {});
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return respond(405, {});

  try {
    const body = await request.text();
    if (body.length > 1024) return respond(400, {});
    const input = JSON.parse(body);
    const now = new Date().toISOString();
    const table = () => db.from("login_handoffs");
    const action = input.action;

    if (action === "start") {
      const email = input.email;
      if (typeof email !== "string" || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) {
        return respond(400, {});
      }
      const target = await emailHash(email);
      const { error: cleanupError } = await table().delete().lte("expires_at", now);
      if (cleanupError) throw cleanupError;
      const { count, error: countError } = await table().select("id", { count: "exact", head: true })
        .eq("email_hash", target);
      if (countError) throw countError;
      if ((count ?? 0) >= 5) return respond(429, {});
      const id = crypto.randomUUID();
      const secret = toHex(crypto.getRandomValues(new Uint8Array(32)));
      const code = toHex(crypto.getRandomValues(new Uint8Array(5))).toUpperCase();
      const expiresAt = Date.now() + 10 * 60_000;
      const { error } = await table().insert({
        id,
        email_hash: target,
        secret_hash: await hash(secret),
        code_hash: await hash(code),
        expires_at: new Date(expiresAt).toISOString(),
      });
      if (error) throw error;
      return respond(200, { id, secret, code, expiresAt });
    }

    if (action === "claim") {
      if (typeof input.id !== "string" || !uuid.test(input.id) ||
        typeof input.secret !== "string" || !/^[0-9a-f]{64}$/.test(input.secret)) {
        return respond(400, {});
      }
      const { data: approved, error } = await table().delete()
        .eq("id", input.id).eq("secret_hash", await hash(input.secret)).gt("expires_at", now)
        .not("approved_user", "is", null).select("approved_user,email_hash").maybeSingle();
      if (error) throw error;
      if (!approved) return respond(200, {});
      const { data: account, error: accountError } = await db.auth.admin.getUserById(approved.approved_user);
      const email = account?.user?.email;
      if (accountError || !email || await emailHash(email) !== approved.email_hash) return respond(409, {});
      const { data: link, error: linkError } = await db.auth.admin.generateLink({ type: "magiclink", email });
      if (linkError || link?.user?.id !== approved.approved_user || !link.properties?.hashed_token) return respond(409, {});
      return respond(200, { tokenHash: link.properties.hashed_token });
    }

    if (action !== "available" && action !== "approve") return respond(400, {});
    const jwt = request.headers.get("authorization")?.match(/^Bearer (\S+)$/i)?.[1];
    if (!jwt) return respond(401, {});
    const { data: { user }, error } = await db.auth.getUser(jwt);
    if (error || !user?.email || !user.email_confirmed_at) return respond(401, {});
    const target = await emailHash(user.email);

    if (action === "available") {
      const { data, error: lookupError } = await table().select("id")
        .eq("email_hash", target).gt("expires_at", now).is("approved_user", null).limit(1);
      if (lookupError) throw lookupError;
      return respond(200, { available: Boolean(data.length) });
    }

    const code = typeof input.code === "string" ? input.code.trim().toUpperCase() : "";
    if (!/^[0-9A-F]{10}$/.test(code)) return respond(400, {});
    const { data, error: updateError } = await table().update({ approved_user: user.id })
      .eq("email_hash", target).eq("code_hash", await hash(code))
      .is("approved_user", null).gt("expires_at", now).select("id").maybeSingle();
    if (updateError) throw updateError;
    return respond(data ? 200 : 404, { approved: Boolean(data) });
  } catch {
    return respond(500, {});
  }
});
