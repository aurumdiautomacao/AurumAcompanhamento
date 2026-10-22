-- Habilita RLS em tabelas internas do n8n (memoria_agente, base_de_conhecimento, radar_palavras);
-- acesso apenas via service_role. O front não usa essas tabelas. Se precisar no futuro, as
-- políticas entram em uma migration própria.

alter table public.memoria_agente enable row level security;
alter table public.base_de_conhecimento enable row level security;
alter table public.radar_palavras enable row level security;

revoke all on public.memoria_agente from anon, authenticated;
revoke all on public.base_de_conhecimento from anon, authenticated;
revoke all on public.radar_palavras from anon, authenticated;

-- Funções de busca vetorial são security invoker (o RLS já bloquearia), mas não há motivo para
-- anon/authenticated chamarem; o n8n chama com service_role.
revoke execute on function public.buscar_memoria_agente(public.vector, double precision, integer) from public, anon, authenticated;
revoke execute on function public.buscar_memoria_agente(public.vector, integer, jsonb) from public, anon, authenticated;
revoke execute on function public.buscar_memoria_agente_semanal(public.vector, integer, jsonb) from public, anon, authenticated;

grant execute on function public.buscar_memoria_agente(public.vector, double precision, integer) to service_role;
grant execute on function public.buscar_memoria_agente(public.vector, integer, jsonb) to service_role;
grant execute on function public.buscar_memoria_agente_semanal(public.vector, integer, jsonb) to service_role;
