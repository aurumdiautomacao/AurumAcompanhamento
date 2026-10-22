-- Corrige o achado 3 do docs/ARQUITETURA_BANCO.md: a sobrecarga buscar_memoria_agente(vector, int, jsonb),
-- usada pela tool de busca do Vector Store no fluxo diário do n8n, declarava id uuid, mas
-- memoria_agente.id é bigint (erro 42804 em toda chamada). Também passa a aplicar o filter por metadata.
-- O tipo de retorno muda, então é preciso drop + create (create or replace não altera returns table).
-- A sobrecarga (vector, float8, int) não muda.

drop function if exists public.buscar_memoria_agente(public.vector, integer, jsonb);

create function public.buscar_memoria_agente(
  query_embedding public.vector,
  match_count     integer default 10,
  filter          jsonb   default '{}'::jsonb
)
returns table (id bigint, content text, metadata jsonb, similarity double precision)
language sql
stable
set search_path = public
as $$
  select
    m.id,
    m.content,
    m.metadata,
    1 - (m.embedding <=> query_embedding) as similarity
  from public.memoria_agente m
  where m.metadata @> coalesce(filter, '{}'::jsonb)
  order by m.embedding <=> query_embedding
  limit match_count;
$$;

revoke execute on function public.buscar_memoria_agente(public.vector, integer, jsonb) from public, anon, authenticated;
grant execute on function public.buscar_memoria_agente(public.vector, integer, jsonb) to service_role;
