
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "biblioteca_textos": {
                  Row: {
                    "chave": string,"created_at": string,"criado_por": string | null,"empresa": string,"etapa": number,"id": string,"origem": string,"porte": string,"projeto_origem": string | null,"ramo": string,"servico_id": string | null,"texto": string,"titulo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "chave": string,"created_at"?: string,"criado_por"?: string | null,"empresa": string,"etapa": number,"id"?: string,"origem"?: string,"porte"?: string,"projeto_origem"?: string | null,"ramo"?: string,"servico_id"?: string | null,"texto": string,"titulo"?: string
                  }
                  Update: {
                    "chave"?: string,"created_at"?: string,"criado_por"?: string | null,"empresa"?: string,"etapa"?: number,"id"?: string,"origem"?: string,"porte"?: string,"projeto_origem"?: string | null,"ramo"?: string,"servico_id"?: string | null,"texto"?: string,"titulo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "biblioteca_textos_criado_por_fkey"
      columns: ["criado_por"]
isOneToOne: false
      referencedRelation: "perfis"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "biblioteca_textos_empresa_fkey"
      columns: ["empresa"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["slug"]
    },{
      foreignKeyName: "biblioteca_textos_servico_id_fkey"
      columns: ["servico_id"]
isOneToOne: false
      referencedRelation: "servicos"
      referencedColumns: ["id"]
    }
                  ]
                },"clientes": {
                  Row: {
                    "created_at": string,"dados": NonNullable<Json>,"empresa": string,"id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"dados": NonNullable<Json>,"empresa": string,"id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"dados"?: NonNullable<Json>,"empresa"?: string,"id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "clientes_empresa_fkey"
      columns: ["empresa"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["slug"]
    }
                  ]
                },"convites": {
                  Row: {
                    "acessos": NonNullable<Json>,"admin_grupo": boolean,"created_at": string,"email": string,"nome": string,"nome_completo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "acessos"?: NonNullable<Json>,"admin_grupo"?: boolean,"created_at"?: string,"email": string,"nome": string,"nome_completo": string
                  }
                  Update: {
                    "acessos"?: NonNullable<Json>,"admin_grupo"?: boolean,"created_at"?: string,"email"?: string,"nome"?: string,"nome_completo"?: string
                  }
                  Relationships: [
                    
                  ]
                },"empresas": {
                  Row: {
                    "descricao": string,"nome": string,"ordem": number,"slug": string,"socios": string,"status": Database["public"]['Enums']["empresa_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "descricao"?: string,"nome": string,"ordem"?: number,"slug": string,"socios"?: string,"status"?: Database["public"]['Enums']["empresa_status"]
                  }
                  Update: {
                    "descricao"?: string,"nome"?: string,"ordem"?: number,"slug"?: string,"socios"?: string,"status"?: Database["public"]['Enums']["empresa_status"]
                  }
                  Relationships: [
                    
                  ]
                },"financeiro_empresas": {
                  Row: {
                    "aliquota_fixa": number | null,"empresa": string,"faturamento_12m": number,"mudancas": NonNullable<Json>,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "aliquota_fixa"?: number | null,"empresa": string,"faturamento_12m"?: number,"mudancas"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Update: {
                    "aliquota_fixa"?: number | null,"empresa"?: string,"faturamento_12m"?: number,"mudancas"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "financeiro_empresas_empresa_fkey"
      columns: ["empresa"]
isOneToOne: true
      referencedRelation: "empresas"
      referencedColumns: ["slug"]
    }
                  ]
                },"financeiro_projetos": {
                  Row: {
                    "empresa": string,"perc_funcern": number | null,"previsoes": NonNullable<Json>,"projeto_id": string,"recebidos": NonNullable<Json>,"updated_at": string,"valor_hora": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "empresa": string,"perc_funcern"?: number | null,"previsoes"?: NonNullable<Json>,"projeto_id": string,"recebidos"?: NonNullable<Json>,"updated_at"?: string,"valor_hora"?: number | null
                  }
                  Update: {
                    "empresa"?: string,"perc_funcern"?: number | null,"previsoes"?: NonNullable<Json>,"projeto_id"?: string,"recebidos"?: NonNullable<Json>,"updated_at"?: string,"valor_hora"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "financeiro_projetos_empresa_fkey"
      columns: ["empresa"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["slug"]
    },{
      foreignKeyName: "financeiro_projetos_projeto_id_fkey"
      columns: ["projeto_id"]
isOneToOne: true
      referencedRelation: "projetos"
      referencedColumns: ["id"]
    }
                  ]
                },"financeiro_servicos": {
                  Row: {
                    "empresa": string,"perc_funcern": number,"servico_id": string,"teto": number,"updated_at": string,"valor_hora": number
                  }
                  ComputedFields: never
                  Insert: {
                    "empresa": string,"perc_funcern"?: number,"servico_id": string,"teto"?: number,"updated_at"?: string,"valor_hora"?: number
                  }
                  Update: {
                    "empresa"?: string,"perc_funcern"?: number,"servico_id"?: string,"teto"?: number,"updated_at"?: string,"valor_hora"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "financeiro_servicos_empresa_fkey"
      columns: ["empresa"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["slug"]
    },{
      foreignKeyName: "financeiro_servicos_servico_id_fkey"
      columns: ["servico_id"]
isOneToOne: true
      referencedRelation: "servicos"
      referencedColumns: ["id"]
    }
                  ]
                },"gestores_sebrae": {
                  Row: {
                    "created_at": string,"empresa": string,"id": string,"nome": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"empresa": string,"id"?: string,"nome": string
                  }
                  Update: {
                    "created_at"?: string,"empresa"?: string,"id"?: string,"nome"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "gestores_sebrae_empresa_fkey"
      columns: ["empresa"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["slug"]
    }
                  ]
                },"membros": {
                  Row: {
                    "empresa": string,"papel": Database["public"]['Enums']["papel_membro"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "empresa": string,"papel": Database["public"]['Enums']["papel_membro"],"user_id": string
                  }
                  Update: {
                    "empresa"?: string,"papel"?: Database["public"]['Enums']["papel_membro"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "membros_empresa_fkey"
      columns: ["empresa"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["slug"]
    },{
      foreignKeyName: "membros_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "perfis"
      referencedColumns: ["id"]
    }
                  ]
                },"mensagens_projeto": {
                  Row: {
                    "acoes": NonNullable<Json>,"anexos": NonNullable<Json>,"autor": string | null,"autor_nome": string,"created_at": string,"desfazer": NonNullable<Json>,"desfeita": boolean,"empresa": string,"id": string,"papel": string,"projeto_id": string,"texto": string
                  }
                  ComputedFields: never
                  Insert: {
                    "acoes"?: NonNullable<Json>,"anexos"?: NonNullable<Json>,"autor"?: string | null,"autor_nome"?: string,"created_at"?: string,"desfazer"?: NonNullable<Json>,"desfeita"?: boolean,"empresa": string,"id"?: string,"papel": string,"projeto_id": string,"texto"?: string
                  }
                  Update: {
                    "acoes"?: NonNullable<Json>,"anexos"?: NonNullable<Json>,"autor"?: string | null,"autor_nome"?: string,"created_at"?: string,"desfazer"?: NonNullable<Json>,"desfeita"?: boolean,"empresa"?: string,"id"?: string,"papel"?: string,"projeto_id"?: string,"texto"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "mensagens_projeto_autor_fkey"
      columns: ["autor"]
isOneToOne: false
      referencedRelation: "perfis"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "mensagens_projeto_empresa_fkey"
      columns: ["empresa"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["slug"]
    },{
      foreignKeyName: "mensagens_projeto_projeto_id_fkey"
      columns: ["projeto_id"]
isOneToOne: false
      referencedRelation: "projetos"
      referencedColumns: ["id"]
    }
                  ]
                },"perfis": {
                  Row: {
                    "admin_grupo": boolean,"created_at": string,"email": string,"id": string,"nome": string,"nome_completo": string,"ve_financeiro": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "admin_grupo"?: boolean,"created_at"?: string,"email": string,"id": string,"nome": string,"nome_completo": string,"ve_financeiro"?: boolean
                  }
                  Update: {
                    "admin_grupo"?: boolean,"created_at"?: string,"email"?: string,"id"?: string,"nome"?: string,"nome_completo"?: string,"ve_financeiro"?: boolean
                  }
                  Relationships: [
                    
                  ]
                },"projetos": {
                  Row: {
                    "atualizado_por": string | null,"cliente_id": string,"created_at": string,"dados": NonNullable<Json>,"empresa": string,"id": string,"updated_at": string,"versao": number
                  }
                  ComputedFields: never
                  Insert: {
                    "atualizado_por"?: string | null,"cliente_id": string,"created_at"?: string,"dados": NonNullable<Json>,"empresa": string,"id": string,"updated_at"?: string,"versao"?: number
                  }
                  Update: {
                    "atualizado_por"?: string | null,"cliente_id"?: string,"created_at"?: string,"dados"?: NonNullable<Json>,"empresa"?: string,"id"?: string,"updated_at"?: string,"versao"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "projetos_atualizado_por_fkey"
      columns: ["atualizado_por"]
isOneToOne: false
      referencedRelation: "perfis"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projetos_cliente_id_fkey"
      columns: ["cliente_id"]
isOneToOne: false
      referencedRelation: "clientes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projetos_empresa_fkey"
      columns: ["empresa"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["slug"]
    }
                  ]
                },"servicos": {
                  Row: {
                    "created_at": string,"dados": NonNullable<Json>,"empresa": string,"id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"dados": NonNullable<Json>,"empresa": string,"id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"dados"?: NonNullable<Json>,"empresa"?: string,"id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "servicos_empresa_fkey"
      columns: ["empresa"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["slug"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "atualizar_meu_perfil":
{ Args: { "p_nome": string,"p_nome_completo": string }; Returns: undefined
                           },
"definir_financeiro":
{ Args: { "p_email": string,"p_ve": boolean }; Returns: undefined
                           },
"definir_situacao_empresa":
{ Args: { "p_empresa": string,"p_status": string }; Returns: undefined
                           },
"equipe_da_empresa":
{ Args: { "p_empresa": string }; Returns: {
              "admin_grupo": boolean,"email": string,"membro": boolean,"nome": string,"nome_completo": string,"papel": string,"situacao": string
            }[]
                           },
"mover_projeto":
{ Args: { "p_destino": string,"p_id": string,"p_servico_id"?: string | null,"p_usuario"?: string }; Returns: Json
                           },
"retirar_acesso":
{ Args: { "p_email": string }; Returns: undefined
                           },
"retirar_membro":
{ Args: { "p_email": string,"p_empresa": string }; Returns: undefined
                           },
"salvar_acesso":
{ Args: { "p_acessos": Json,"p_admin": boolean,"p_email": string,"p_nome": string,"p_nome_completo": string }; Returns: undefined
                           },
"salvar_membro":
{ Args: { "p_email": string,"p_empresa": string,"p_nome": string,"p_nome_completo": string,"p_papel": string }; Returns: undefined
                           },
"salvar_projeto":
{ Args: { "p_dados": Json,"p_id": string,"p_versao": number }; Returns: number
                           }
          }
          Enums: {
            "empresa_status": "ativo"|"em_estruturacao"|"standby","papel_membro": "gestor"|"consultor"|"equipe"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "empresa_status": ["ativo", "em_estruturacao", "standby"],"papel_membro": ["gestor", "consultor", "equipe"]
          }
        }
} as const
