create or replace function public.trilha_handoff_start(target_email text, request_id uuid, secret_digest text, code_digest text, public_key jsonb)
returns timestamptz
language plpgsql security definer set search_path = ''
as $$
declare
  target text;
  expiry timestamptz := statement_timestamp() + interval '10 minutes';
begin
  if target_email is null or length(target_email) > 254 or target_email !~ '^[^[:space:]@]+@[^[:space:]@]+$'
    or secret_digest is null or secret_digest !~ '^[0-9a-f]{64}$'
    or code_digest is null or code_digest !~ '^[0-9a-f]{64}$'
    or public_key is null or length(public_key::text) > 1500 or public_key->>'kty' is distinct from 'RSA'
    or length(coalesce(public_key->>'n','')) <> 342 or coalesce(public_key->>'n','') !~ '^[a-zA-Z0-9_-]+$' or public_key->>'e' is distinct from 'AQAB' then
    raise exception 'Solicitação inválida';
  end if;
  target := encode(sha256(convert_to(lower(btrim(target_email)), 'UTF8')), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(target, 0));
  delete from public.login_handoffs where expires_at <= statement_timestamp();
  if (select count(*) from public.login_handoffs where email_hash = target) >= 5 then
    raise exception 'Limite de solicitações para este endereço';
  end if;
  insert into public.login_handoffs (id,email_hash,secret_hash,code_hash,expires_at,desktop_key)
    values (request_id,target,secret_digest,code_digest,expiry,public_key);
  return expiry;
end;
$$;

