# AurumAcompanhamento

Painel interno da Aurum DI para curar notícias do mercado imobiliário e logístico e aprovar o conteúdo gerado a partir delas: relatório de tendências, tópicos estratégicos pontuados, posts para Instagram e LinkedIn e o fechamento semanal.

O uso é restrito à equipe interna, com login via Supabase Auth.

## Stack

| Camada         | Tecnologia                                           |
| -------------- | ---------------------------------------------------- |
| Interface      | React 18 + TypeScript + Vite 5                       |
| Estilo         | Tailwind CSS 3 (tokens `auro-*`)                     |
| Rotas          | React Router 6                                       |
| Dados e auth   | Supabase (Postgres com RLS, Auth e Edge Functions)   |
| Automação      | n8n (coleta e geração de conteúdo, fora deste repo)  |
| Hospedagem     | Vercel (SPA, rewrite para `index.html`)              |

## Módulos

| Rota                  | Tela                  | Função                                                        |
| --------------------- | --------------------- | ------------------------------------------------------------- |
| `/`                   | Central de Notícias   | Notícias coletadas e relatório de tendências                  |
| `/fontes`             | Fontes de Notícias    | Cadastro e ativação das fontes de coleta                      |
| `/aprovacao`          | Central de Aprovação  | Revisão, edição e aprovação de posts e tópicos estratégicos   |
| `/fechamento-semanal` | Fechamento Semanal    | Consolidado do ciclo semanal, com status e nota               |
| `/usuarios`           | Gestão de Usuários    | Criação de usuários e atribuição de papel (somente admin)     |
| `/configuracoes`      | Configurações & API   | Chave OpenAI do usuário e consumo da API                      |
| `/login`              | Login                 | Acesso via Supabase Auth                                      |

## Papéis e permissões

O papel é lido de `app_metadata.role`, com fallback em `profiles.role`. Quem aplica as permissões é o banco, por políticas RLS (`is_admin_or_editor()`). Esconder botão no front é só UX.

| Papel    | Permissões                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------ |
| `viewer` | Leitura de notícias, conteúdo gerado, posts, fontes, fechamento semanal e perfis                 |
| `editor` | Tudo do `viewer`, mais criar, editar e excluir conteúdo e fontes e aprovar posts e tópicos        |
| `admin`  | Tudo do `editor`, mais gestão de usuários (Edge Function `create_user`) e de perfis de terceiros |

Todo usuário autenticado gerencia apenas a própria linha em `api_settings`.

> Matriz levantada do código. Pendente de validação pela Diretoria.

## Fluxo de dados

```
fontes_noticias ──(n8n: coleta)──▶ noticias_brutas
                                     │ status_processamento: pendente → processando → concluido | falha
                                     ▼
                  (n8n: IA) ──▶ conteudo_gerado ──▶ posts_gerados (pendente → aprovado, no front)
                                     │
                                     ▼
                              conteudo_semanal (fechamento do ciclo)
```

> Nomes, gatilhos e agendamento dos fluxos n8n: a confirmar com o Orquestrador n8n.

## Como rodar

Pré-requisitos: Node 20 e npm.

```bash
npm ci
# crie um .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ver tabela abaixo)
npm run dev
```

### Variáveis de ambiente

| Variável                    | Onde              | Uso                                     |
| --------------------------- | ----------------- | --------------------------------------- |
| `VITE_SUPABASE_URL`         | Front (`.env`)    | URL do projeto Supabase                 |
| `VITE_SUPABASE_ANON_KEY`    | Front (`.env`)    | Chave pública `anon`                    |
| `SUPABASE_URL`              | Secrets Supabase  | Edge Functions                          |
| `SUPABASE_ANON_KEY`         | Secrets Supabase  | Edge Functions                          |
| `SUPABASE_SERVICE_ROLE_KEY` | Secrets Supabase  | Edge Functions; **nunca** no front      |

O front usa somente a `anon key`. A `service_role` existe só nos secrets das Edge Functions.

> A chave OpenAI não é variável de ambiente. Ela fica em `api_settings.openai_api_key`, por usuário, e hoje trafega em texto puro pelo navegador. A migração para Vault ou Edge Function está pendente.

## Scripts

| Comando             | Ação                                  |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento           |
| `npm run build`     | Build de produção em `dist/`          |
| `npm run preview`   | Serve o build localmente              |
| `npm run lint`      | ESLint                                |
| `npm run typecheck` | Verificação de tipos (`tsc --noEmit`) |

## Estrutura

```
src/
  components/   layout, rota protegida e componentes de UI (sem acesso a dados)
  context/      AuthContext (sessão e papel) e ThemeContext (tema claro/escuro)
  lib/          cliente Supabase, tipos do schema e versão do app
  pages/        uma página por rota
supabase/
  migrations/   schema e políticas RLS versionados
  functions/    create_user, get_openai_usage
```

## Contribuição

- Nada vai direto na `main`: toda mudança entra por PR.
- Branches no formato `tipo/descricao-curta`, por exemplo `feat/kpi-card-noi` ou `fix/rls-contratos`.
- Commits semânticos em pt-BR, por exemplo `fix(rls): corrige política de update em posts_gerados`.
- Mudança de schema ou de política exige migration em `supabase/migrations/` com RLS habilitado.
- Proibido `push --force` em branch compartilhada e proibido `--no-verify`.
