# Documentação do Sistema · AurumAcompanhamento

> **Levantamento:** 20/10/2026, consolidado pelo Agente Revisor e DevOps a partir dos relatórios dos agentes Supabase DBA, Frontend React, Orquestrador n8n e Gestão de Prompts.
> **Natureza:** fotografia do estado atual. Itens marcados como **premissa** ou **a confirmar** não foram validados no ambiente vivo.
> **Detalhes de segurança do banco** ficam fora deste arquivo de propósito. A referência interna é mantida pelo Agente DBA.

---

## 1. Visão geral

O AurumAcompanhamento é a plataforma interna de inteligência de conteúdo da Aurum DI. Ela coleta notícias do mercado imobiliário e logístico, gera com IA um relatório diário de tendências, tópicos estratégicos pontuados e posts para Instagram e LinkedIn, e consolida o ciclo em um fechamento semanal. A equipe revisa e aprova esse conteúdo no painel web.

O sistema é single-tenant: todo o conteúdo pertence à própria Aurum DI.

```
                       ┌──────────────────────── n8n ────────────────────────┐
fontes_noticias ──────▶│ Extração de Dados (seg–sex 06h)                      │
                       │   rss/html ──▶ noticias_brutas (status = pendente)   │
                       │        │                                             │
                       │        ▼ Execute Workflow                            │
                       │ SubAgente (gpt-5 + RAG memoria_agente)               │
                       │   ──▶ conteudo_gerado (relatório + tópicos + pautas) │
                       │   ──▶ posts_gerados (status = pendente)              │
                       │   ──▶ memoria_agente (embedding do relatório)        │
                       │   ──▶ noticias_brutas (status = processado)          │
                       │                                                      │
                       │ Gerador Semanal (sexta 05h, gpt-4o + RAG)            │
                       │   conteudo_gerado (7 dias) ──▶ conteudo_semanal      │
                       └──────────────────────────────────────────────────────┘
                                              │
                                              ▼
                       ┌──────────── Painel React (Vercel) ───────────────────┐
                       │ revisão, edição de pontuação, aprovação de posts     │
                       │ e do fechamento semanal (editor/admin)               │
                       └──────────────────────────────────────────────────────┘
```

## 2. Componentes

| Componente | Onde fica | Responsável |
| --- | --- | --- |
| Painel web (React + Vite + Tailwind) | este repositório, `src/` | Agente Desenvolvedor |
| Banco, Auth e Edge Functions (Supabase, PostgreSQL 17) | este repositório, `supabase/` | Agente DBA |
| Workflows de coleta e geração (n8n) | instância n8n, backups em `n8n_automacoes/` | Orquestrador n8n |
| Prompts de IA | hoje só dentro dos nós do n8n | Gestão de Prompts |
| Esteira de CI/CD e revisão | `.github/` (a criar) | Agente Revisor e DevOps |

---

## 3. Painel web

### 3.1 Rotas

Toda rota, exceto `/login`, passa por `ProtectedRoute`, que exige apenas sessão ativa. **Não há bloqueio de rota por papel.** Qualquer usuário logado abre qualquer URL; quem limita o que ele pode fazer é o RLS do banco.

| Rota | Arquivo | O que o usuário faz | Leitura | Escrita (editor/admin) |
| --- | --- | --- | --- | --- |
| `/login` | `Login.tsx` | Entra com e-mail e senha | Supabase Auth | — |
| `/` | `Dashboard.tsx` | Consulta as notícias coletadas, com busca e filtros por status e categoria | `noticias_brutas` | — |
| `/fontes` | `FontesNoticias.tsx` | Cadastra, edita, exclui e ativa/desativa fontes de coleta | `fontes_noticias` | `fontes_noticias` |
| `/aprovacao` | `ApprovalCenter.tsx` | Lê o relatório diário, ajusta a pontuação dos tópicos e aprova posts | `conteudo_gerado` (50 últimos), `posts_gerados` (200 últimos) | `conteudo_gerado`, `posts_gerados` |
| `/fechamento-semanal` | `WeeklySummary.tsx` | Revisa o consolidado da semana, aprova/rejeita e dá nota | `conteudo_semanal` (50 últimos), `conteudo_gerado` | `conteudo_semanal` |
| `/usuarios` | `UserManagement.tsx` | Admin cria usuários e define o papel | `profiles` | Edge Function `create_user` |
| `/configuracoes` | `SettingsApi.tsx` | Cada usuário grava a própria chave OpenAI e consulta o consumo | `api_settings` | `api_settings`, Edge Function `get_openai_usage` |

Não há cadastro público. `Register.tsx` existe, mas não tem rota.

### 3.2 Central de Aprovação

1. O n8n cria `conteudo_gerado` e os `posts_gerados` ligados a ele. O front não cria conteúdo.
2. O usuário escolhe um relatório; os posts aparecem em abas Instagram e LinkedIn, filtrados por `conteudo_gerado_id`.
3. **Post:** `pendente ⇄ aprovado`. "Aprovar" grava `aprovado`; "Desaprovar" volta para `pendente`. Não existe estado `rejeitado` para post. A interface é otimista e reverte em caso de erro.
4. **Tópico estratégico:** não tem status. O editor ajusta `pontuacao_relevancia` (0 a 10). O front marca `editado`, `editado_por` e `editado_em` no tópico, registra o índice em `topicos_editados`, grava `topicos_editados_usuario` e acrescenta a mudança em `topicos_editados_log` (valor anterior, valor novo, usuário e data). Se o banco não afetar nenhuma linha, o front trata como falta de permissão e reverte.

### 3.3 Fechamento Semanal

1. O Gerador Semanal do n8n cria a linha em `conteudo_semanal` com `ciclo_inicio`, `ciclo_fim`, `relatorio_evolutivo`, tópicos, posts e `referencias_diarias` (ids de `conteudo_gerado`).
2. Status: `pendente → aprovado | rejeitado`, pelos botões Aprovar e Rejeitar. Dá para alternar entre aprovado e rejeitado; não há botão para voltar a pendente.
3. `nota_semanal`: slider de 0 a 10 com "Salvar nota". Fica desabilitado para viewer.
4. O topo da tela mostra a contagem de ciclos pendentes, aprovados e rejeitados.
5. O modal "Referência diária" abre o `conteudo_gerado` de cada dia citado.

### 3.4 Tema, estilo e versão

- **Tema:** `ThemeContext` com `darkMode: 'class'` no Tailwind. O padrão segue `prefers-color-scheme`; a escolha fica em `localStorage` na chave `trendhub_theme` (nome legado). O botão de troca fica no `Layout`.
- **Cores:** o `tailwind.config.js` define as escalas `brand-*` e `gold-*`. **Os tokens `auro-*` exigidos pelo manual (2.1) ainda não existem**, e o código usa cores padrão do Tailwind e classes arbitrárias. Ver pendências.
- **Versão:** `src/lib/appVersion.ts` (`APP_VERSION`), exibida na barra lateral. É atualizada à mão e hoje está em `1.42.0`, diferente do `package.json` (`1.41.3`).
- **Deploy:** Vercel como SPA. O `vercel.json` só faz o rewrite de tudo para `index.html`. As variáveis `VITE_*` ficam no painel da Vercel.

---

## 4. Papéis e acesso

| Papel | O que pode fazer |
| --- | --- |
| `viewer` | Ler notícias, conteúdo gerado, posts, fontes e fechamento semanal; ver o próprio perfil |
| `editor` | Tudo do `viewer`, mais criar, editar e excluir fontes e conteúdo, aprovar posts, ajustar pontuação e aprovar/rejeitar o fechamento semanal |
| `admin` | Tudo do `editor`, mais criar usuários (`create_user`) e ver/excluir qualquer perfil |

- **Fonte do papel:** `profiles.role`. O banco checa com `is_admin()` e `is_admin_or_editor()`, funções `security definer` com `search_path` fixo. O usuário não consegue alterar o próprio papel.
- **No front**, o `AuthContext` lê só `profiles.role`. Esconder botão por papel é UX, não controle de acesso.
- **`create_user`** valida o chamador por `app_metadata.role === 'admin'`, sem consultar `profiles`. Os dois critérios precisam convergir (ver pendências).
- **`api_settings`:** cada usuário acessa só a própria linha.
- **n8n:** acessa o banco com a credencial do cofre do n8n, sem passar pelo RLS (premissa: chave de serviço do Supabase, a confirmar no painel do n8n).

> Matriz levantada do código e do banco. Pendente de validação pela Diretoria.

---

## 5. Banco de dados

Projeto Supabase "Automacao IA", PostgreSQL 17, schema `public`.

| Tabela | Propósito | Ciclo de vida |
| --- | --- | --- |
| `fontes_noticias` | Fontes coletadas pelo n8n | `ativo`, `tipo_coleta` (`rss` \| `html`) |
| `noticias_brutas` | Notícias coletadas | `status_processamento`: `pendente → processado` |
| `conteudo_gerado` | Relatório diário: tendências, tópicos pontuados, pautas | `favorito`, histórico de edição dos tópicos |
| `posts_gerados` | Posts Instagram/LinkedIn ligados ao relatório (FK com cascade) | `status`: `pendente → aprovado` |
| `conteudo_semanal` | Consolidado semanal | `ciclo_inicio`/`ciclo_fim`, `status`, `nota_semanal` |
| `memoria_agente` | Base vetorial (RAG) dos agentes de IA | — |
| `base_de_conhecimento` | Perfil editorial: tom de voz, público-alvo | — |
| `radar_palavras` | Termos monitorados por segmento | `ativo`, `prioridade`, `tipo_sinal` |
| `profiles` | Perfil e papel do usuário, criado por trigger no cadastro | `role`: `admin` \| `editor` \| `viewer` |
| `api_settings` | Chave OpenAI por usuário | — |

### 5.1 Edge Functions

| Função | O que faz | Quem chama | Secrets (só nomes) |
| --- | --- | --- | --- |
| `create_user` | Cria usuário com papel definido e atualiza `profiles.role` | Admin autenticado | `SUPABASE_URL`, chave de serviço |
| `get_openai_usage` | Retorna o custo de uso da OpenAI no mês corrente | Qualquer autenticado | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |

O código em `supabase/functions/` é o mesmo que está em produção.

### 5.2 Migrations

As canônicas são os 8 arquivos sem ` copy` em `supabase/migrations/`. O histórico do repositório **diverge do remoto**: há migration local que não consta no remoto, migration remota que não está no repositório e objetos criados fora de migration. **Hoje o banco não é reproduzível a partir do repositório.**

> Não rode `supabase db push` a partir deste repositório até o DBA concluir a reconciliação (`db pull` + `migration repair`).

---

## 6. Automações n8n

| Workflow | ID | Ativo | Gatilho | Agenda |
| --- | --- | --- | --- | --- |
| Production: AurumDI Extração de Dados | `A8Qra8Y7m09Oddyg` | sim | Schedule + manual | seg–sex 06h |
| Aurum SubAgente | `AkCEj9aFW6d9DPdZ` | sim | Chamado pela Extração + manual | herda da Extração |
| Gerador Semanal Aurum | `tC5gCas1mWHiynRU` | sim | Schedule + manual | sexta 05h |
| Aurum Agente - Conectado via IA | `ekcIEnudJFftmWsw` | não | Schedule + manual | versão antiga do SubAgente |
| Disparo Lead Kommo | `I55jVt9mU9XAKauS` | não | Webhook | não usa o Supabase |

O fuso dos agendamentos não está fixado na instância; vale o fuso padrão dela.

### 6.1 Extração de Dados

- Lê `fontes_noticias` e separa por `tipo_coleta`: `rss` vai para o RSS Read e `html` para HTTP Request + HTML.
- Insere em `noticias_brutas` com `status_processamento = 'pendente'` (insert simples, sem upsert).
- Não usa IA. No fim, chama o SubAgente.

### 6.2 SubAgente (conteúdo diário)

- **Lê:** `noticias_brutas` pendentes (até 150), `base_de_conhecimento`, o último `conteudo_gerado`, os 5 últimos posts aprovados (como exemplos) e `radar_palavras` com prioridade 1 e ativos.
- **IA:** AI Agent com OpenAI `gpt-5`, usando a ferramenta de busca vetorial em `memoria_agente`.
- **Escreve:** `conteudo_gerado` (relatório, tópicos, pautas), uma linha de `posts_gerados` por post, o embedding do relatório em `memoria_agente` e `status_processamento = 'processado'` nas notícias usadas.

### 6.3 Gerador Semanal

- Lê o `conteudo_gerado` dos últimos 7 dias.
- **IA:** AI Agent com OpenAI `gpt-4o` e busca vetorial em `memoria_agente` (top 10).
- Escreve `conteudo_semanal` com `status = 'pendente'`. A aprovação acontece no painel.

### 6.4 Credenciais e versionamento

- Todas as credenciais ficam no cofre do n8n; nenhuma aparece em Code Node ou expressão.
- Os workflows **não estão em git**. Os scripts em `n8n_automacoes/scripts/` listam e renomeiam workflows via API (este último salva backup antes). Só existe backup local do workflow inativo.

---

## 7. Prompts de IA

| Prompt | Workflow | Saída | Versionado |
| --- | --- | --- | --- |
| Conteúdo diário | SubAgente | relatório, tópicos pontuados, pautas, posts Instagram e LinkedIn | não, texto só no nó do n8n |
| Fechamento semanal | Gerador Semanal | relatório evolutivo, tópicos com nota, posts da semana | não, ainda não exportado |

### 7.1 Pontuação dos tópicos estratégicos

Definida hoje no user prompt do conteúdo diário:

- A IA agrupa as notícias por assunto.
- **Eco:** assunto presente em mais de uma fonte ganha +3.
- **Efeito dominó:** tema A que impacta tema B (ex.: macroeconomia afetando mercado imobiliário) é tese de alto valor, nota de 8 a 10.
- **Ruído:** notícia isolada e de baixo impacto, nota de 1 a 4.

A escala máxima não está declarada no prompt (a interface usa 0 a 10), e o +3 aditivo convive com faixas absolutas. A calibragem humana é feita na Central de Aprovação, com rastreio de cada edição.

### 7.2 Processo de alteração (proposta, pendente de aprovação da Diretoria)

1. PR no repositório de prompts com novo arquivo `<nome>_v<n+1>.md`, sem editar a versão anterior.
2. Revisão do Agente Revisor (Seções 1 e 3 do manual).
3. Aprovação de copy pela Diretoria de Estratégia.
4. Atualização do nó no n8n citando a versão.
5. Novo backup do workflow.

---

## 8. Qualidade e CI/CD

| Verificação | Situação |
| --- | --- |
| `npm run lint` | não validado nesta rodada (ver abaixo) |
| `npm run typecheck` | não validado nesta rodada |
| `npm run build` | não validado nesta rodada |
| Prettier | não configurado no projeto |
| Testes | não há script de teste |
| `.github/workflows/ci.yml` | não existe |

As verificações não rodaram porque o `npm ci` falhou por erro de rede (`ECONNRESET`) nas máquinas dos agentes. Elas precisam rodar em CI ou em uma máquina com acesso ao registro npm antes de qualquer PR de código.

---

## 9. Pendências em aberto

Nada abaixo está resolvido. A ordem é por área, não por prioridade.

**Banco (Agente DBA)**
- Ajustes de RLS e de privilégios em algumas tabelas, já priorizados pelo DBA.
- Reconciliar o histórico de migrations com o remoto; remover os arquivos ` copy.sql` e renomear os `.sql.sql` para `.sql`.
- Gerar os tipos com `supabase gen types` e passar o genérico `Database` ao `createClient`.
- Migrar a chave OpenAI de `api_settings` para o Vault.
- Criar índices em colunas de join e ordenação e `check` nas colunas de status e papel.
- Corrigir o tipo de retorno de uma das funções de busca vetorial.

**Front (Agente Desenvolvedor)**
- Criar os tokens `auro-*` e substituir as cores padrão do Tailwind, os hex e as classes arbitrárias (manual 2.1).
- Quebrar os componentes acima de ~150 linhas (`WeeklySummary` 1.350, `ApprovalCenter` 1.246, `DashboardPieces` 497, `SettingsApi` 472, `FontesNoticias` 409, `UserManagement` 406 e outros) e tirar o acesso a dados das páginas para hooks (manual 2.3).
- Tratar como erro o update que não afeta nenhuma linha em `posts_gerados`, `conteudo_semanal` e `fontes_noticias`.
- Implementar ou remover os botões "Editar" e "Desativar" em `/usuarios`, que hoje não fazem nada.
- Remover os cerca de 20 arquivos ` copy` em `src/` e `supabase/`, além de `Register.tsx` e `lib/mockData.ts`, que não são usados.
- Alinhar a validação de admin da `create_user` com `is_admin()`.
- Não exibir `error.message` cru do Supabase ao usuário.
- Sincronizar `APP_VERSION` com o `package.json` e renomear o pacote (`vite-react-typescript-starter`).
- Ajustar o fundo do spinner do `ProtectedRoute` para o tema escuro.

**n8n (Orquestrador)**
- Criar um workflow de erro comum que grave em `automation_logs` e notifique (manual 3.4). Hoje nenhum workflow tem ramo de erro.
- Trocar os parsers de saída por JSON Schema completo, com `required` e `additionalProperties: false`, e ligar o auto-fix.
- Versionar os workflows em git, com export sem `pinData` e sem ids de credencial.
- Confirmar se a Extração chama o SubAgente mais de uma vez por execução e se ele gera relatório vazio quando não há notícia pendente.
- O ramo `html` da Extração não grava os links extraídos.
- Tornar o insert em `noticias_brutas` idempotente.
- Fixar o fuso dos agendamentos (sugestão: `America/Fortaleza`).
- Padronizar os nomes dos workflows para `[dominio] - [acao] - v[n]`.
- Conferir o formato dos posts de Instagram do semanal: o n8n grava `{tema, roteiro}`, e o tipo do front espera `{tema, conteudo}`.

**Prompts (Gestão de Prompts)**
- Exportar o prompt do Gerador Semanal e versionar os dois prompts em arquivos `_v1.md`.
- Mover tarefas e critérios de pontuação do user prompt para o system prompt (manual 3.3).
- Delimitar as notícias de terceiros como dados (`<dados>…</dados>`) para reduzir o risco de prompt injection.
- Revisar a copy da persona conforme a Seção 1: há termos da lista proibida e superlativos sem número.
- Declarar a escala da pontuação (teto e regra do +3).

**Decisões da Diretoria**
- Validar a matriz de papéis da seção 4.
- Aprovar formalmente o uso da persona nominal do CEO, com textos escritos em 1ª pessoa no nome dele.
- Aprovar o processo de alteração de prompts da seção 7.2.
- Definir se o sistema vai atender mais de um cliente. Hoje nenhuma query filtra por `cliente_id`.

**CI/CD (Agente Revisor)**
- Criar `.github/workflows/ci.yml` com os jobs `qualidade` e `manual-auro` e proteger a `main`.
- Adicionar Prettier e um script de teste para a esteira mínima rodar.
