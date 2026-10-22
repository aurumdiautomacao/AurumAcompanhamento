# AurumAcompanhamento

Painel interno da Aurum DI para curar notícias do mercado imobiliário e logístico e aprovar o conteúdo que a IA gera a partir delas: relatório diário de tendências, tópicos estratégicos pontuados, posts para Instagram e LinkedIn e fechamento semanal.

O uso é restrito à equipe interna, com login via Supabase Auth. Não há cadastro público.

A documentação completa (fluxos, banco, automações, prompts e pendências) está em [`docs/SISTEMA.md`](docs/SISTEMA.md).

## Stack

| Camada       | Tecnologia                                              |
| ------------ | ------------------------------------------------------- |
| Interface    | React 18 + TypeScript + Vite 5                          |
| Estilo       | Tailwind CSS 3 (escalas `brand-*` e `gold-*`)           |
| Rotas        | React Router 6                                          |
| Dados e auth | Supabase (PostgreSQL 17 com RLS, Auth e Edge Functions) |
| Automação    | n8n com OpenAI (coleta e geração, fora deste repo)      |
| Hospedagem   | Vercel (SPA, rewrite para `index.html`)                 |

## Módulos

| Rota                  | Tela                 | Função                                                                 |
| --------------------- | -------------------- | ---------------------------------------------------------------------- |
| `/`                   | Central de Notícias  | Notícias coletadas, com busca e filtros por status e categoria         |
| `/fontes`             | Fontes de Notícias   | Cadastro e ativação das fontes de coleta                               |
| `/aprovacao`          | Central de Aprovação | Relatório diário, ajuste da pontuação dos tópicos e aprovação de posts |
| `/fechamento-semanal` | Fechamento Semanal   | Consolidado do ciclo semanal: aprovar/rejeitar e dar nota de 0 a 10    |
| `/usuarios`           | Gestão de Usuários   | Criação de usuários e definição de papel (somente admin)               |
| `/configuracoes`      | Configurações & API  | Chave OpenAI do usuário e consumo da API                               |
| `/login`              | Login                | Acesso com e-mail e senha                                              |

Todas as rotas exigem sessão, mas nenhuma é bloqueada por papel. Quem limita as ações é o RLS do banco.

## Papéis e permissões

O papel fica em `profiles.role`. O banco aplica as permissões por RLS, com as funções `is_admin()` e `is_admin_or_editor()`. O front lê o mesmo campo só para mostrar ou esconder botões, o que é UX e não controle de acesso.

| Papel    | Permissões                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------ |
| `viewer` | Leitura de notícias, conteúdo gerado, posts, fontes e fechamento semanal; vê só o próprio perfil |
| `editor` | Tudo do `viewer`, mais criar, editar e excluir fontes e conteúdo e aprovar posts e fechamento    |
| `admin`  | Tudo do `editor`, mais criação de usuários (Edge Function `create_user`) e gestão de perfis      |

Todo usuário autenticado gerencia apenas a própria linha em `api_settings`.

> Matriz levantada do código e do banco. Pendente de validação pela Diretoria.

## Fluxo de dados

```
fontes_noticias ──(n8n Extração, seg–sex 06h)──▶ noticias_brutas (pendente)
                                                    │
                     (n8n SubAgente, gpt-5 + RAG) ◀─┘
                        ├─▶ conteudo_gerado ──▶ posts_gerados (pendente → aprovado, no painel)
                        ├─▶ memoria_agente (memória vetorial entre dias)
                        └─▶ noticias_brutas (processado)

conteudo_gerado (7 dias) ──(n8n Gerador Semanal, sexta 05h, gpt-4o)──▶ conteudo_semanal
                                                    (pendente → aprovado | rejeitado, no painel)
```

## Como rodar

Pré-requisitos: Node 20 e npm.

```bash
npm ci
# crie um .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ver tabela abaixo)
npm run dev
```

### Variáveis de ambiente

| Variável                    | Onde             | Uso                                             |
| --------------------------- | ---------------- | ----------------------------------------------- |
| `VITE_SUPABASE_URL`         | Front (`.env`)   | URL do projeto Supabase                         |
| `VITE_SUPABASE_ANON_KEY`    | Front (`.env`)   | Chave pública `anon`                            |
| `SUPABASE_URL`              | Secrets Supabase | Edge Functions                                  |
| `SUPABASE_ANON_KEY`         | Secrets Supabase | Edge Function `get_openai_usage`                |
| Chave de serviço (secret)   | Secrets Supabase | Edge Function `create_user`; **nunca** no front |

O front usa somente a `anon key`. Em produção, as variáveis `VITE_*` ficam no painel da Vercel.

> A chave OpenAI não é variável de ambiente. Ela fica em `api_settings.openai_api_key`, por usuário, e hoje é guardada sem criptografia e trafega pelo navegador. A migração para o Vault está planejada.

### Banco

> **Não rode `supabase db push` a partir deste repositório.** O histórico de migrations diverge do banco remoto, e a reconciliação está pendente com o DBA.

## Scripts

| Comando             | Ação                                                       |
| ------------------- | ---------------------------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento                                |
| `npm run build`     | Build de produção em `dist/`                               |
| `npm run preview`   | Serve o build localmente                                   |
| `npm run lint`      | ESLint                                                     |
| `npm run typecheck` | Verificação de tipos (`tsc --noEmit -p tsconfig.app.json`) |

Ainda não há Prettier, testes nem workflow de CI no repositório.

## Estrutura

```
docs/
  SISTEMA.md    documentação do sistema e pendências
src/
  components/   Layout, ProtectedRoute e componentes de UI
  context/      AuthContext (sessão e papel) e ThemeContext (tema claro/escuro)
  lib/          cliente Supabase, tipos manuais e versão do app (appVersion.ts)
  pages/        uma página por rota
supabase/
  migrations/   schema e políticas RLS (arquivos sem " copy" são os canônicos)
  functions/    create_user, get_openai_usage
```

## Versão

A versão exibida no painel vem de `src/lib/appVersion.ts` e é atualizada à mão a cada release.

## Contribuição

- Nada vai direto na `main`: toda mudança entra por PR.
- Branches no formato `tipo/descricao-curta`, por exemplo `feat/kpi-card-noi` ou `fix/rls-contratos`.
- Commits semânticos em pt-BR, por exemplo `fix(rls): corrige política de update em posts_gerados`.
- Mudança de schema ou de política exige migration em `supabase/migrations/` com RLS habilitado e tipos regenerados.
- Cores só por token do design system Auro; nada de hex, `rgb()` ou classe arbitrária.
- Proibido `push --force` em branch compartilhada e proibido `--no-verify`.
