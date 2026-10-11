/*
# Add topicos editing tracking columns to conteudo_gerado

1. Overview
This migration adds three columns to `conteudo_gerado` to track manual edits
made to strategic topic scores (pontuacao_relevancia) by users:
- `topicos_editados` (jsonb): an array of indices that have been edited, e.g. [0, 3]
- `topicos_editados_usuario` (text): the email of the last user who edited
- `topicos_editados_log` (jsonb): an array of log entries recording each edit

2. Modified Tables
- `conteudo_gerado`
  - New column: `topicos_editados` (jsonb, nullable, default '[]')
  - New column: `topicos_editados_usuario` (text, nullable)
  - New column: `topicos_editados_log` (jsonb, nullable, default '[]')

3. Security
- No RLS policy changes needed. The existing CRUD policies on
  `conteudo_gerado` already allow authenticated users to SELECT and UPDATE.
- The new columns are writable by the same authenticated role that can
  already update the `topicos_estrategicos` column.

4. Important notes
- All three columns are nullable with safe defaults ('[]' for jsonb), so
  existing rows are unaffected.
- ALTER TABLE ADD COLUMN is non-destructive; no data is lost.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conteudo_gerado' AND column_name = 'topicos_editados'
  ) THEN
    ALTER TABLE public.conteudo_gerado ADD COLUMN topicos_editados jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conteudo_gerado' AND column_name = 'topicos_editados_usuario'
  ) THEN
    ALTER TABLE public.conteudo_gerado ADD COLUMN topicos_editados_usuario text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conteudo_gerado' AND column_name = 'topicos_editados_log'
  ) THEN
    ALTER TABLE public.conteudo_gerado ADD COLUMN topicos_editados_log jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
