create table public.login_handoffs (
  id uuid primary key,
  email_hash text not null,
  secret_hash text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  approved_user uuid references auth.users(id) on delete cascade,
  unique (email_hash, code_hash)
);
alter table public.login_handoffs enable row level security;
revoke all on public.login_handoffs from public, anon, authenticated;
grant select, insert, update, delete on public.login_handoffs to service_role;
create index login_handoffs_expires_at_idx on public.login_handoffs(expires_at);
