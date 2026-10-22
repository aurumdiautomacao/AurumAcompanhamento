-- Curadoria do Resumo Semanal: o Nertan escolhe os tópicos dos diários do ciclo e
-- escreve uma orientação; só então o n8n gera o conteudo_semanal a partir dessa seleção.
-- Não altera tabelas do fluxo diário (conteudo_gerado, posts_gerados, noticias_brutas).

-- ============================================================
-- 1. Tabela selecao_semanal
-- ============================================================
create table if not exists public.selecao_semanal (
  id                   uuid primary key default gen_random_uuid(),
  ciclo_inicio         date not null,
  ciclo_fim            date not null,
  -- snapshot dos tópicos escolhidos (array de objetos); o n8n não depende do índice no diário
  topicos_selecionados jsonb not null default '[]'::jsonb
                       check (jsonb_typeof(topicos_selecionados) = 'array'),
  orientacao           text check (char_length(orientacao) <= 1000),
  status               text not null default 'rascunho'
                       check (status in ('rascunho', 'solicitado', 'gerando', 'concluido', 'erro')),
  erro_mensagem        text,
  criado_por           uuid not null default auth.uid()
                       references auth.users (id) on delete restrict,
  solicitado_em        timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint selecao_semanal_ciclo_valido check (ciclo_fim >= ciclo_inicio),
  -- chave natural: uma seleção por ciclo (upsert do front e lookup do n8n)
  constraint selecao_semanal_ciclo_key unique (ciclo_inicio, ciclo_fim)
);

-- A unique (ciclo_inicio, ciclo_fim) já atende a listagem por ciclo mais recente (scan reverso).
-- FK criado_por: suporta o restrict ao excluir usuário e o filtro "minhas seleções".
create index if not exists selecao_semanal_criado_por_idx
  on public.selecao_semanal (criado_por);

drop trigger if exists trg_selecao_semanal_updated_at on public.selecao_semanal;
create trigger trg_selecao_semanal_updated_at
  before update on public.selecao_semanal
  for each row execute function public.set_updated_at();

-- Máquina de estados do status; vale também para o n8n (service_role ignora RLS, não ignora trigger)
create or replace function public.valida_transicao_selecao_semanal()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if not (
       (old.status = 'rascunho'   and new.status = 'solicitado')
    or (old.status = 'solicitado' and new.status in ('gerando', 'erro', 'rascunho'))
    or (old.status = 'gerando'    and new.status in ('concluido', 'erro'))
    or (old.status = 'erro'       and new.status in ('solicitado', 'rascunho'))
  ) then
    raise exception 'Transição de status inválida em selecao_semanal: % -> %', old.status, new.status
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

revoke execute on function public.valida_transicao_selecao_semanal() from public, anon, authenticated;

drop trigger if exists trg_selecao_semanal_valida_transicao on public.selecao_semanal;
create trigger trg_selecao_semanal_valida_transicao
  before update of status on public.selecao_semanal
  for each row execute function public.valida_transicao_selecao_semanal();

-- ============================================================
-- 2. Vínculo do semanal gerado com a seleção que o originou
-- ============================================================
alter table public.conteudo_semanal
  add column if not exists selecao_id uuid
  references public.selecao_semanal (id) on delete set null;

-- Um semanal por seleção (idempotência do n8n); nulls dos registros antigos continuam permitidos.
-- A unique também serve de índice para o join seleção → semanal gerado.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'conteudo_semanal_selecao_id_key'
      and conrelid = 'public.conteudo_semanal'::regclass
  ) then
    alter table public.conteudo_semanal
      add constraint conteudo_semanal_selecao_id_key unique (selecao_id);
  end if;
end $$;

-- ============================================================
-- 3. Privilégios (defesa em profundidade)
-- ============================================================
alter table public.selecao_semanal enable row level security;

revoke all on public.selecao_semanal from anon;
revoke all on public.selecao_semanal from authenticated;
grant select, insert, delete on public.selecao_semanal to authenticated;
-- authenticated não altera criado_por, created_at, updated_at nem id
grant update (ciclo_inicio, ciclo_fim, topicos_selecionados, orientacao, status, erro_mensagem, solicitado_em)
  on public.selecao_semanal to authenticated;

-- ============================================================
-- 4. Políticas RLS
-- Ciclo de vida: rascunho → solicitado (front/Edge Function) → gerando → concluido | erro (n8n, service_role).
-- authenticated só manipula rascunho/solicitado/erro; gerando e concluido ficam travados para o usuário.
-- ============================================================
drop policy if exists "selecao_semanal_select_authenticated" on public.selecao_semanal;
create policy "selecao_semanal_select_authenticated"
  on public.selecao_semanal for select
  to authenticated
  using (true);

drop policy if exists "selecao_semanal_insert_admin_editor" on public.selecao_semanal;
create policy "selecao_semanal_insert_admin_editor"
  on public.selecao_semanal for insert
  to authenticated
  with check (
    (select public.is_admin_or_editor())
    and criado_por = (select auth.uid())
    and status = 'rascunho'
  );

drop policy if exists "selecao_semanal_update_admin_editor" on public.selecao_semanal;
create policy "selecao_semanal_update_admin_editor"
  on public.selecao_semanal for update
  to authenticated
  using (
    (select public.is_admin_or_editor())
    and status in ('rascunho', 'solicitado', 'erro')
  )
  with check (
    (select public.is_admin_or_editor())
    and status in ('rascunho', 'solicitado', 'erro')
  );

drop policy if exists "selecao_semanal_delete_admin_editor" on public.selecao_semanal;
create policy "selecao_semanal_delete_admin_editor"
  on public.selecao_semanal for delete
  to authenticated
  using (
    (select public.is_admin_or_editor())
    and status in ('rascunho', 'erro')
  );
