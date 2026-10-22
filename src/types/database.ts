export type Json = string | number | boolean | null | {
  [key: string]: Json | undefined;
} | Json[];

export type Database = {
  "public": {
    Tables: {
      "api_settings": {
        Row: {
          "created_at": string;
          "id": string;
          "openai_api_key": string | null;
          "updated_at": string;
          "user_id": string;
        };
        ComputedFields: never;
        Insert: {
          "created_at"?: string;
          "id"?: string;
          "openai_api_key"?: string | null;
          "updated_at"?: string;
          "user_id": string;
        };
        Update: {
          "created_at"?: string;
          "id"?: string;
          "openai_api_key"?: string | null;
          "updated_at"?: string;
          "user_id"?: string;
        };
        Relationships: [
        ];
      };
      "automation_logs": {
        Row: {
          "created_at": string;
          "detalhe": Json | null;
          "execucao_id": string | null;
          "id": number;
          "mensagem": string;
          "nivel": string;
          "referencia_id": string | null;
          "workflow": string;
        };
        ComputedFields: never;
        Insert: {
          "created_at"?: string;
          "detalhe"?: Json | null;
          "execucao_id"?: string | null;
          "id"?: never;
          "mensagem": string;
          "nivel"?: string;
          "referencia_id"?: string | null;
          "workflow": string;
        };
        Update: {
          "created_at"?: string;
          "detalhe"?: Json | null;
          "execucao_id"?: string | null;
          "id"?: never;
          "mensagem"?: string;
          "nivel"?: string;
          "referencia_id"?: string | null;
          "workflow"?: string;
        };
        Relationships: [
        ];
      };
      "base_de_conhecimento": {
        Row: {
          "created_at": string;
          "id": number;
          "nome_cliente": string;
          "publico_alvo": string;
          "regras_extras": string | null;
          "tom_de_voz": string;
        };
        ComputedFields: never;
        Insert: {
          "created_at"?: string;
          "id"?: number;
          "nome_cliente": string;
          "publico_alvo": string;
          "regras_extras"?: string | null;
          "tom_de_voz": string;
        };
        Update: {
          "created_at"?: string;
          "id"?: number;
          "nome_cliente"?: string;
          "publico_alvo"?: string;
          "regras_extras"?: string | null;
          "tom_de_voz"?: string;
        };
        Relationships: [
        ];
      };
      "conteudo_gerado": {
        Row: {
          "created_at": string;
          "favorito": boolean | null;
          "id": number;
          "posts_instagram": Json | null;
          "posts_linkedin": Json | null;
          "relatorio_tendencias": string;
          "sugestoes_pautas": Json | null;
          "topicos_editados": Json | null;
          "topicos_editados_log": Json | null;
          "topicos_editados_usuario": string | null;
          "topicos_estrategicos": Json | null;
        };
        ComputedFields: never;
        Insert: {
          "created_at"?: string;
          "favorito"?: boolean | null;
          "id"?: number;
          "posts_instagram"?: Json | null;
          "posts_linkedin"?: Json | null;
          "relatorio_tendencias": string;
          "sugestoes_pautas"?: Json | null;
          "topicos_editados"?: Json | null;
          "topicos_editados_log"?: Json | null;
          "topicos_editados_usuario"?: string | null;
          "topicos_estrategicos"?: Json | null;
        };
        Update: {
          "created_at"?: string;
          "favorito"?: boolean | null;
          "id"?: number;
          "posts_instagram"?: Json | null;
          "posts_linkedin"?: Json | null;
          "relatorio_tendencias"?: string;
          "sugestoes_pautas"?: Json | null;
          "topicos_editados"?: Json | null;
          "topicos_editados_log"?: Json | null;
          "topicos_editados_usuario"?: string | null;
          "topicos_estrategicos"?: Json | null;
        };
        Relationships: [
        ];
      };
      "conteudo_semanal": {
        Row: {
          "ciclo_fim": string;
          "ciclo_inicio": string;
          "created_at": string | null;
          "id": string;
          "nota_semanal": number | null;
          "posts_instagram": Json | null;
          "posts_linkedin": Json | null;
          "referencias_diarias": Json | null;
          "relatorio_evolutivo": string | null;
          "selecao_id": string | null;
          "status": string | null;
          "topicos_estrategicos": Json | null;
          "updated_at": string | null;
        };
        ComputedFields: never;
        Insert: {
          "ciclo_fim": string;
          "ciclo_inicio": string;
          "created_at"?: string | null;
          "id"?: string;
          "nota_semanal"?: number | null;
          "posts_instagram"?: Json | null;
          "posts_linkedin"?: Json | null;
          "referencias_diarias"?: Json | null;
          "relatorio_evolutivo"?: string | null;
          "selecao_id"?: string | null;
          "status"?: string | null;
          "topicos_estrategicos"?: Json | null;
          "updated_at"?: string | null;
        };
        Update: {
          "ciclo_fim"?: string;
          "ciclo_inicio"?: string;
          "created_at"?: string | null;
          "id"?: string;
          "nota_semanal"?: number | null;
          "posts_instagram"?: Json | null;
          "posts_linkedin"?: Json | null;
          "referencias_diarias"?: Json | null;
          "relatorio_evolutivo"?: string | null;
          "selecao_id"?: string | null;
          "status"?: string | null;
          "topicos_estrategicos"?: Json | null;
          "updated_at"?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "conteudo_semanal_selecao_id_fkey";
            columns: [
              "selecao_id"
            ];
            isOneToOne: true;
            referencedRelation: "selecao_semanal";
            referencedColumns: [
              "id"
            ];
          }
        ];
      };
      "fontes_noticias": {
        Row: {
          "ativo": boolean | null;
          "data_cadastro": string;
          "id": string;
          "nome": string;
          "tipo_coleta": string | null;
          "url": string;
        };
        ComputedFields: never;
        Insert: {
          "ativo"?: boolean | null;
          "data_cadastro"?: string;
          "id"?: string;
          "nome": string;
          "tipo_coleta"?: string | null;
          "url": string;
        };
        Update: {
          "ativo"?: boolean | null;
          "data_cadastro"?: string;
          "id"?: string;
          "nome"?: string;
          "tipo_coleta"?: string | null;
          "url"?: string;
        };
        Relationships: [
        ];
      };
      "memoria_agente": {
        Row: {
          "content": string;
          "embedding": string | null;
          "id": number;
          "metadata": Json | null;
        };
        ComputedFields: never;
        Insert: {
          "content": string;
          "embedding"?: string | null;
          "id"?: number;
          "metadata"?: Json | null;
        };
        Update: {
          "content"?: string;
          "embedding"?: string | null;
          "id"?: number;
          "metadata"?: Json | null;
        };
        Relationships: [
        ];
      };
      "noticias_brutas": {
        Row: {
          "categoria": string | null;
          "conteudo_bruto": string;
          "data_coleta": string;
          "id": string;
          "nome_fonte": string | null;
          "status_processamento": string | null;
          "titulo": string;
          "url_fonte": string;
        };
        ComputedFields: never;
        Insert: {
          "categoria"?: string | null;
          "conteudo_bruto": string;
          "data_coleta"?: string;
          "id"?: string;
          "nome_fonte"?: string | null;
          "status_processamento"?: string | null;
          "titulo": string;
          "url_fonte": string;
        };
        Update: {
          "categoria"?: string | null;
          "conteudo_bruto"?: string;
          "data_coleta"?: string;
          "id"?: string;
          "nome_fonte"?: string | null;
          "status_processamento"?: string | null;
          "titulo"?: string;
          "url_fonte"?: string;
        };
        Relationships: [
        ];
      };
      "posts_gerados": {
        Row: {
          "conteudo": string | null;
          "conteudo_gerado_id": number | null;
          "created_at": string | null;
          "cta": string | null;
          "formato": string | null;
          "hashtags": string | null;
          "headline": string | null;
          "id": number;
          "legenda": string | null;
          "plataforma": string;
          "status": string | null;
          "subtitulo": string | null;
          "texto_apoio": string | null;
        };
        ComputedFields: never;
        Insert: {
          "conteudo"?: string | null;
          "conteudo_gerado_id"?: number | null;
          "created_at"?: string | null;
          "cta"?: string | null;
          "formato"?: string | null;
          "hashtags"?: string | null;
          "headline"?: string | null;
          "id"?: number;
          "legenda"?: string | null;
          "plataforma": string;
          "status"?: string | null;
          "subtitulo"?: string | null;
          "texto_apoio"?: string | null;
        };
        Update: {
          "conteudo"?: string | null;
          "conteudo_gerado_id"?: number | null;
          "created_at"?: string | null;
          "cta"?: string | null;
          "formato"?: string | null;
          "hashtags"?: string | null;
          "headline"?: string | null;
          "id"?: number;
          "legenda"?: string | null;
          "plataforma"?: string;
          "status"?: string | null;
          "subtitulo"?: string | null;
          "texto_apoio"?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "posts_gerados_conteudo_gerado_id_fkey";
            columns: [
              "conteudo_gerado_id"
            ];
            isOneToOne: false;
            referencedRelation: "conteudo_gerado";
            referencedColumns: [
              "id"
            ];
          }
        ];
      };
      "profiles": {
        Row: {
          "created_at": string;
          "email": string | null;
          "id": string;
          "role": string;
        };
        ComputedFields: never;
        Insert: {
          "created_at"?: string;
          "email"?: string | null;
          "id": string;
          "role"?: string;
        };
        Update: {
          "created_at"?: string;
          "email"?: string | null;
          "id"?: string;
          "role"?: string;
        };
        Relationships: [
        ];
      };
      "radar_palavras": {
        Row: {
          "ativo": boolean | null;
          "categoria": string | null;
          "codigo_id": string | null;
          "created_at": string | null;
          "id": string;
          "leitura_aurum": string | null;
          "palavra_chave": string;
          "prioridade": number | null;
          "segmento": string;
          "tipo_sinal": string | null;
          "variacoes": string | null;
        };
        ComputedFields: never;
        Insert: {
          "ativo"?: boolean | null;
          "categoria"?: string | null;
          "codigo_id"?: string | null;
          "created_at"?: string | null;
          "id"?: string;
          "leitura_aurum"?: string | null;
          "palavra_chave": string;
          "prioridade"?: number | null;
          "segmento": string;
          "tipo_sinal"?: string | null;
          "variacoes"?: string | null;
        };
        Update: {
          "ativo"?: boolean | null;
          "categoria"?: string | null;
          "codigo_id"?: string | null;
          "created_at"?: string | null;
          "id"?: string;
          "leitura_aurum"?: string | null;
          "palavra_chave"?: string;
          "prioridade"?: number | null;
          "segmento"?: string;
          "tipo_sinal"?: string | null;
          "variacoes"?: string | null;
        };
        Relationships: [
        ];
      };
      "selecao_semanal": {
        Row: {
          "ciclo_fim": string;
          "ciclo_inicio": string;
          "created_at": string;
          "criado_por": string;
          "erro_mensagem": string | null;
          "id": string;
          "orientacao": string | null;
          "solicitado_em": string | null;
          "status": string;
          "topicos_selecionados": NonNullable<Json>;
          "updated_at": string;
        };
        ComputedFields: never;
        Insert: {
          "ciclo_fim": string;
          "ciclo_inicio": string;
          "created_at"?: string;
          "criado_por"?: string;
          "erro_mensagem"?: string | null;
          "id"?: string;
          "orientacao"?: string | null;
          "solicitado_em"?: string | null;
          "status"?: string;
          "topicos_selecionados"?: NonNullable<Json>;
          "updated_at"?: string;
        };
        Update: {
          "ciclo_fim"?: string;
          "ciclo_inicio"?: string;
          "created_at"?: string;
          "criado_por"?: string;
          "erro_mensagem"?: string | null;
          "id"?: string;
          "orientacao"?: string | null;
          "solicitado_em"?: string | null;
          "status"?: string;
          "topicos_selecionados"?: NonNullable<Json>;
          "updated_at"?: string;
        };
        Relationships: [
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      "buscar_memoria_agente": {
        Args: {
          "filter"?: Json;
          "match_count"?: number;
          "query_embedding": string;
        };
        Returns: {
          "content": string;
          "id": string;
          "metadata": Json;
          "similarity": number;
        }[];
      } | {
        Args: {
          "match_count": number;
          "match_threshold": number;
          "query_embedding": string;
        };
        Returns: {
          "content": string;
          "id": number;
          "metadata": Json;
          "similaridade": number;
        }[];
      };
      "buscar_memoria_agente_semanal": {
        Args: {
          "filter"?: Json;
          "match_count"?: number;
          "query_embedding": string;
        };
        Returns: {
          "content": string;
          "id": number;
          "metadata": Json;
          "similarity": number;
        }[];
      };
      "is_admin": {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      "is_admin_or_editor": {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | {
  schema: keyof DatabaseWithoutInternals;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"]) : never = never> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
  Row: infer R;
} ? R : never : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
  Row: infer R;
} ? R : never : never;

export type TablesInsert<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | {
  schema: keyof DatabaseWithoutInternals;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
  Insert: infer I;
} ? I : never : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
  Insert: infer I;
} ? I : never : never;

export type TablesUpdate<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | {
  schema: keyof DatabaseWithoutInternals;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
  Update: infer U;
} ? U : never : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
  Update: infer U;
} ? U : never : never;

export type Enums<DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | {
  schema: keyof DatabaseWithoutInternals;
}, EnumName extends DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"] : never = never> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName] : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions] : never;

export type CompositeTypes<PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | {
  schema: keyof DatabaseWithoutInternals;
}, CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"] : never = never> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName] : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions] : never;

export const Constants = {
  "public": {
    Enums: {}
  }
} as const;
