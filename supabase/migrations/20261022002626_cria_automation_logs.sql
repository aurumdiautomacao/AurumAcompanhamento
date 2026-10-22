-- Log padronizado dos fluxos do n8n e das Edge Functions administrativas (ramos de erro e
-- operações em massa). Escrita só via service_role; leitura no front apenas para admin.
create table if not exists public.automation_logs (
  id            bigint generated always as identity primary key,
  workflow      text not null,
  execucao_id   text,
  referencia_id text,
  nivel         text not null default 'erro' check (nivel in ('info', 'aviso', 'erro')),
  mensagem      text not null,
  detalhe       jsonb check (detalhe is null or jsonb_typeof(detalhe) = 'object'),
  created_at    timestamptz not null default now()
);

-- Tela/consulta "últimos erros do fluxo X"
create index if not exists automation_logs_workflow_created_at_idx
  on public.automation_logs (workflow, created_at desc);
-- Rastreio de um registro específico (ex.: selecao_id do semanal)
create index if not exists automation_logs_referencia_id_idx
  on public.automation_logs (referencia_id);

alter table public.automation_logs enable row level security;

revoke all on public.automation_logs from anon;
revoke all on public.automation_logs from authenticated;
grant select on public.automation_logs to authenticated;

-- Sem políticas de insert/update/delete: só a service_role (BYPASSRLS) escreve; log é append-only.
drop policy if exists "automation_logs_select_somente_admin" on public.automation_logs;
create policy "automation_logs_select_somente_admin"
  on public.automation_logs for select
  to authenticated
  using ((select public.is_admin()));
