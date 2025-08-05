export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categorias_pecas: {
        Row: {
          codigo: string | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          codigo?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          codigo?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_pecas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          cep: string | null
          cidade: string | null
          codigo: string | null
          cpf_cnpj: string | null
          created_at: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          codigo?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          codigo?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracao_email: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          email_remetente: string | null
          id: string
          nome_remetente: string | null
          porta: number | null
          senha: string | null
          servidor_smtp: string | null
          updated_at: string | null
          usar_ssl: boolean | null
          user_id: string
          usuario: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          email_remetente?: string | null
          id?: string
          nome_remetente?: string | null
          porta?: number | null
          senha?: string | null
          servidor_smtp?: string | null
          updated_at?: string | null
          usar_ssl?: boolean | null
          user_id: string
          usuario?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          email_remetente?: string | null
          id?: string
          nome_remetente?: string | null
          porta?: number | null
          senha?: string | null
          servidor_smtp?: string | null
          updated_at?: string | null
          usar_ssl?: boolean | null
          user_id?: string
          usuario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracao_email_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracao_empresa: {
        Row: {
          cep: string | null
          cidade: string | null
          cnpj: string | null
          created_at: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          logo_url: string | null
          nome_empresa: string
          site: string | null
          telefone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          logo_url?: string | null
          nome_empresa: string
          site?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          logo_url?: string | null
          nome_empresa?: string
          site?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracao_empresa_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracao_notificacoes: {
        Row: {
          created_at: string | null
          dias_antecedencia_vencimento: number | null
          email_notificacoes: string | null
          id: string
          notificar_estoque_baixo: boolean | null
          notificar_manutencao_ferramentas: boolean | null
          notificar_os_vencidas: boolean | null
          notificar_vencimento_contas: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dias_antecedencia_vencimento?: number | null
          email_notificacoes?: string | null
          id?: string
          notificar_estoque_baixo?: boolean | null
          notificar_manutencao_ferramentas?: boolean | null
          notificar_os_vencidas?: boolean | null
          notificar_vencimento_contas?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dias_antecedencia_vencimento?: number | null
          email_notificacoes?: string | null
          id?: string
          notificar_estoque_baixo?: boolean | null
          notificar_manutencao_ferramentas?: boolean | null
          notificar_os_vencidas?: boolean | null
          notificar_vencimento_contas?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracao_notificacoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracao_sistema: {
        Row: {
          chave: string
          created_at: string | null
          descricao: string | null
          id: string
          tipo: string | null
          updated_at: string | null
          user_id: string
          valor: string | null
        }
        Insert: {
          chave: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          tipo?: string | null
          updated_at?: string | null
          user_id: string
          valor?: string | null
        }
        Update: {
          chave?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          tipo?: string | null
          updated_at?: string | null
          user_id?: string
          valor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracao_sistema_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_pagar: {
        Row: {
          categoria_despesa: string | null
          created_at: string | null
          data_pagamento: string | null
          data_vencimento: string
          desconto: number | null
          descricao: string
          forma_pagamento: string | null
          fornecedor_id: string | null
          id: string
          juros: number | null
          multa: number | null
          numero_documento: string | null
          observacoes: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          valor_original: number
          valor_pago: number | null
          valor_pendente: number
        }
        Insert: {
          categoria_despesa?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          desconto?: number | null
          descricao: string
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          id?: string
          juros?: number | null
          multa?: number | null
          numero_documento?: string | null
          observacoes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          valor_original: number
          valor_pago?: number | null
          valor_pendente: number
        }
        Update: {
          categoria_despesa?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          desconto?: number | null
          descricao?: string
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          id?: string
          juros?: number | null
          multa?: number | null
          numero_documento?: string | null
          observacoes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          valor_original?: number
          valor_pago?: number | null
          valor_pendente?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_receber: {
        Row: {
          cliente_id: string
          created_at: string | null
          data_pagamento: string | null
          data_vencimento: string
          desconto: number | null
          descricao: string
          forma_pagamento: string | null
          id: string
          juros: number | null
          multa: number | null
          numero_documento: string | null
          observacoes: string | null
          ordem_servico_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          valor_original: number
          valor_pago: number | null
          valor_pendente: number
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          desconto?: number | null
          descricao: string
          forma_pagamento?: string | null
          id?: string
          juros?: number | null
          multa?: number | null
          numero_documento?: string | null
          observacoes?: string | null
          ordem_servico_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          valor_original: number
          valor_pago?: number | null
          valor_pendente: number
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          desconto?: number | null
          descricao?: string
          forma_pagamento?: string | null
          id?: string
          juros?: number | null
          multa?: number | null
          numero_documento?: string | null
          observacoes?: string | null
          ordem_servico_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          valor_original?: number
          valor_pago?: number | null
          valor_pendente?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      emprestimos_ferramentas: {
        Row: {
          created_at: string | null
          data_devolucao_prevista: string | null
          data_devolucao_real: string | null
          data_emprestimo: string | null
          ferramenta_id: string
          id: string
          observacoes: string | null
          responsavel_emprestimo: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data_devolucao_prevista?: string | null
          data_devolucao_real?: string | null
          data_emprestimo?: string | null
          ferramenta_id: string
          id?: string
          observacoes?: string | null
          responsavel_emprestimo: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data_devolucao_prevista?: string | null
          data_devolucao_real?: string | null
          data_emprestimo?: string | null
          ferramenta_id?: string
          id?: string
          observacoes?: string | null
          responsavel_emprestimo?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emprestimos_ferramentas_ferramenta_id_fkey"
            columns: ["ferramenta_id"]
            isOneToOne: false
            referencedRelation: "ferramentas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emprestimos_ferramentas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ferramentas: {
        Row: {
          codigo: string
          created_at: string | null
          data_aquisicao: string | null
          descricao: string | null
          disponivel: boolean | null
          estado_conservacao: string | null
          foto_url: string | null
          id: string
          intervalo_manutencao_dias: number | null
          localizacao: string | null
          marca: string | null
          modelo: string | null
          nome: string
          numero_serie: string | null
          observacoes: string | null
          proxima_manutencao: string | null
          requer_manutencao: boolean | null
          responsavel_atual: string | null
          updated_at: string | null
          user_id: string
          valor_aquisicao: number | null
        }
        Insert: {
          codigo: string
          created_at?: string | null
          data_aquisicao?: string | null
          descricao?: string | null
          disponivel?: boolean | null
          estado_conservacao?: string | null
          foto_url?: string | null
          id?: string
          intervalo_manutencao_dias?: number | null
          localizacao?: string | null
          marca?: string | null
          modelo?: string | null
          nome: string
          numero_serie?: string | null
          observacoes?: string | null
          proxima_manutencao?: string | null
          requer_manutencao?: boolean | null
          responsavel_atual?: string | null
          updated_at?: string | null
          user_id: string
          valor_aquisicao?: number | null
        }
        Update: {
          codigo?: string
          created_at?: string | null
          data_aquisicao?: string | null
          descricao?: string | null
          disponivel?: boolean | null
          estado_conservacao?: string | null
          foto_url?: string | null
          id?: string
          intervalo_manutencao_dias?: number | null
          localizacao?: string | null
          marca?: string | null
          modelo?: string | null
          nome?: string
          numero_serie?: string | null
          observacoes?: string | null
          proxima_manutencao?: string | null
          requer_manutencao?: boolean | null
          responsavel_atual?: string | null
          updated_at?: string | null
          user_id?: string
          valor_aquisicao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ferramentas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fluxo_caixa: {
        Row: {
          categoria: string
          created_at: string | null
          data_operacao: string | null
          descricao: string
          forma_pagamento: string | null
          id: string
          observacoes: string | null
          pagamento_recebimento_id: string | null
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string | null
          data_operacao?: string | null
          descricao: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          pagamento_recebimento_id?: string | null
          tipo: string
          user_id: string
          valor: number
        }
        Update: {
          categoria?: string
          created_at?: string | null
          data_operacao?: string | null
          descricao?: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          pagamento_recebimento_id?: string | null
          tipo?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fluxo_caixa_pagamento_recebimento_id_fkey"
            columns: ["pagamento_recebimento_id"]
            isOneToOne: false
            referencedRelation: "pagamentos_recebimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fluxo_caixa_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          contato_responsavel: string | null
          created_at: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato_responsavel?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          contato_responsavel?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracao_email: {
        Row: {
          ativo: boolean
          created_at: string
          email_remetente: string
          id: string
          nome_remetente: string
          porta: number
          senha: string
          servidor_smtp: string
          updated_at: string
          usar_ssl: boolean
          user_id: string
          usuario: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email_remetente: string
          id?: string
          nome_remetente: string
          porta?: number
          senha: string
          servidor_smtp: string
          updated_at?: string
          usar_ssl?: boolean
          user_id: string
          usuario: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email_remetente?: string
          id?: string
          nome_remetente?: string
          porta?: number
          senha?: string
          servidor_smtp?: string
          updated_at?: string
          usar_ssl?: boolean
          user_id?: string
          usuario?: string
        }
        Relationships: []
      }
      itens_servico: {
        Row: {
          created_at: string | null
          descricao: string
          id: string
          ordem_servico_id: string
          peca_id: string | null
          quantidade: number | null
          tipo_item: string | null
          tipo_servico_id: string | null
          updated_at: string | null
          user_id: string
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          created_at?: string | null
          descricao: string
          id?: string
          ordem_servico_id: string
          peca_id?: string | null
          quantidade?: number | null
          tipo_item?: string | null
          tipo_servico_id?: string | null
          updated_at?: string | null
          user_id: string
          valor_total: number
          valor_unitario: number
        }
        Update: {
          created_at?: string | null
          descricao?: string
          id?: string
          ordem_servico_id?: string
          peca_id?: string | null
          quantidade?: number | null
          tipo_item?: string | null
          tipo_servico_id?: string | null
          updated_at?: string | null
          user_id?: string
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_servico_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_servico_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_servico_tipo_servico_id_fkey"
            columns: ["tipo_servico_id"]
            isOneToOne: false
            referencedRelation: "tipos_servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_servico_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      manutencoes_ferramentas: {
        Row: {
          created_at: string | null
          custo: number | null
          data_manutencao: string
          descricao: string
          ferramenta_id: string
          fornecedor_servico: string | null
          id: string
          observacoes: string | null
          proxima_manutencao: string | null
          responsavel: string | null
          tipo_manutencao: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custo?: number | null
          data_manutencao: string
          descricao: string
          ferramenta_id: string
          fornecedor_servico?: string | null
          id?: string
          observacoes?: string | null
          proxima_manutencao?: string | null
          responsavel?: string | null
          tipo_manutencao: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          custo?: number | null
          data_manutencao?: string
          descricao?: string
          ferramenta_id?: string
          fornecedor_servico?: string | null
          id?: string
          observacoes?: string | null
          proxima_manutencao?: string | null
          responsavel?: string | null
          tipo_manutencao?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manutencoes_ferramentas_ferramenta_id_fkey"
            columns: ["ferramenta_id"]
            isOneToOne: false
            referencedRelation: "ferramentas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutencoes_ferramentas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_estoque: {
        Row: {
          created_at: string | null
          documento_referencia: string | null
          id: string
          motivo: string | null
          observacoes: string | null
          ordem_servico_id: string | null
          peca_id: string
          quantidade: number
          quantidade_anterior: number
          quantidade_atual: number
          tipo_movimentacao: string
          user_id: string
          valor_total: number | null
          valor_unitario: number | null
        }
        Insert: {
          created_at?: string | null
          documento_referencia?: string | null
          id?: string
          motivo?: string | null
          observacoes?: string | null
          ordem_servico_id?: string | null
          peca_id: string
          quantidade: number
          quantidade_anterior: number
          quantidade_atual: number
          tipo_movimentacao: string
          user_id: string
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Update: {
          created_at?: string | null
          documento_referencia?: string | null
          id?: string
          motivo?: string | null
          observacoes?: string | null
          ordem_servico_id?: string | null
          peca_id?: string
          quantidade?: number
          quantidade_anterior?: number
          quantidade_atual?: number
          tipo_movimentacao?: string
          user_id?: string
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          cliente_id: string
          codigo: string | null
          created_at: string | null
          data_entrada: string | null
          data_saida: string | null
          desconto: number | null
          diagnostico: string | null
          id: string
          km_entrada: number | null
          numero_os: string
          observacoes: string | null
          problema_relatado: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          valor_final: number | null
          valor_total: number | null
          veiculo_id: string
        }
        Insert: {
          cliente_id: string
          codigo?: string | null
          created_at?: string | null
          data_entrada?: string | null
          data_saida?: string | null
          desconto?: number | null
          diagnostico?: string | null
          id?: string
          km_entrada?: number | null
          numero_os: string
          observacoes?: string | null
          problema_relatado?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          valor_final?: number | null
          valor_total?: number | null
          veiculo_id: string
        }
        Update: {
          cliente_id?: string
          codigo?: string | null
          created_at?: string | null
          data_entrada?: string | null
          data_saida?: string | null
          desconto?: number | null
          diagnostico?: string | null
          id?: string
          km_entrada?: number | null
          numero_os?: string
          observacoes?: string | null
          problema_relatado?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          valor_final?: number | null
          valor_total?: number | null
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos_recebimentos: {
        Row: {
          conta_pagar_id: string | null
          conta_receber_id: string | null
          created_at: string | null
          data_operacao: string | null
          forma_pagamento: string
          id: string
          numero_documento: string | null
          observacoes: string | null
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string | null
          data_operacao?: string | null
          forma_pagamento: string
          id?: string
          numero_documento?: string | null
          observacoes?: string | null
          tipo: string
          user_id: string
          valor: number
        }
        Update: {
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string | null
          data_operacao?: string | null
          forma_pagamento?: string
          id?: string
          numero_documento?: string | null
          observacoes?: string | null
          tipo?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_recebimentos_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_recebimentos_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_recebimentos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pecas: {
        Row: {
          ativo: boolean | null
          categoria_id: string | null
          codigo: string
          codigo_fabricante: string | null
          codigo_original: string | null
          created_at: string | null
          descricao: string | null
          dimensoes: string | null
          fornecedor_id: string | null
          foto_url: string | null
          id: string
          localizacao_estoque: string | null
          marca: string | null
          margem_lucro: number | null
          modelo_aplicacao: string | null
          nome: string
          observacoes: string | null
          peso: number | null
          preco_custo: number | null
          preco_venda: number | null
          quantidade_atual: number | null
          quantidade_maxima: number | null
          quantidade_minima: number | null
          unidade_medida: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          categoria_id?: string | null
          codigo: string
          codigo_fabricante?: string | null
          codigo_original?: string | null
          created_at?: string | null
          descricao?: string | null
          dimensoes?: string | null
          fornecedor_id?: string | null
          foto_url?: string | null
          id?: string
          localizacao_estoque?: string | null
          marca?: string | null
          margem_lucro?: number | null
          modelo_aplicacao?: string | null
          nome: string
          observacoes?: string | null
          peso?: number | null
          preco_custo?: number | null
          preco_venda?: number | null
          quantidade_atual?: number | null
          quantidade_maxima?: number | null
          quantidade_minima?: number | null
          unidade_medida?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          categoria_id?: string | null
          codigo?: string
          codigo_fabricante?: string | null
          codigo_original?: string | null
          created_at?: string | null
          descricao?: string | null
          dimensoes?: string | null
          fornecedor_id?: string | null
          foto_url?: string | null
          id?: string
          localizacao_estoque?: string | null
          marca?: string | null
          margem_lucro?: number | null
          modelo_aplicacao?: string | null
          nome?: string
          observacoes?: string | null
          peso?: number | null
          preco_custo?: number | null
          preco_venda?: number | null
          quantidade_atual?: number | null
          quantidade_maxima?: number | null
          quantidade_minima?: number | null
          unidade_medida?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pecas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pecas_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pecas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cargo: string | null
          created_at: string | null
          email: string
          id: string
          nome: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          cargo?: string | null
          created_at?: string | null
          email: string
          id: string
          nome: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          cargo?: string | null
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_servicos: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          preco_base: number | null
          tempo_estimado: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          preco_base?: number | null
          tempo_estimado?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          preco_base?: number | null
          tempo_estimado?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tipos_servicos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      veiculos: {
        Row: {
          ano: number | null
          chassi: string | null
          cliente_id: string
          codigo: string | null
          combustivel: string | null
          cor: string | null
          created_at: string | null
          id: string
          km_atual: number | null
          marca: string
          modelo: string
          observacoes: string | null
          placa: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ano?: number | null
          chassi?: string | null
          cliente_id: string
          codigo?: string | null
          combustivel?: string | null
          cor?: string | null
          created_at?: string | null
          id?: string
          km_atual?: number | null
          marca: string
          modelo: string
          observacoes?: string | null
          placa?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ano?: number | null
          chassi?: string | null
          cliente_id?: string
          codigo?: string | null
          combustivel?: string | null
          cor?: string | null
          created_at?: string | null
          id?: string
          km_atual?: number | null
          marca?: string
          modelo?: string
          observacoes?: string | null
          placa?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "veiculos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "veiculos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

