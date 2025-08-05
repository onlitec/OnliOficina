import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Interfaces simplificadas para compatibilidade com o schema atual
export interface TenantConfiguracoes {
  tema?: string;
  idioma?: string;
  moeda?: string;
  fuso_horario?: string;
  notificacoes_email?: boolean;
  backup_automatico?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface TenantLimites {
  max_usuarios: number;
  max_clientes: number;
  max_veiculos: number;
  max_ordens_mes: number;
  features: string[];
  [key: string]: number | string[];
}

// Interface baseada na tabela configuracao_empresa existente
export interface Tenant {
  id: string;
  nome_empresa: string;
  cnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  logo_url?: string | null;
  site?: string | null;
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
}

// Interface simplificada para usuário atual
export interface TenantUser {
  id: string;
  user_id: string;
  role: 'admin' | 'gerente' | 'funcionario';
  status: 'ativo' | 'inativo';
  permissoes: Record<string, string[]>;
  created_at: string;
  updated_at: string;
}

// Interface placeholder para convites (não implementado no schema atual)
export interface TenantInvite {
  id: string;
  email: string;
  role: 'admin' | 'gerente' | 'funcionario';
  token: string;
  status: 'pendente' | 'aceito' | 'expirado' | 'cancelado';
  invited_by: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}

// Interface para estatísticas baseada em dados reais
export interface TenantStatistics {
  total_clientes: number;
  total_veiculos: number;
  total_pecas: number;
  total_ordens: number;
}

export const useTenant = () => {
  const { user } = useAuth();
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [userTenants, setUserTenants] = useState<Tenant[]>([]);
  const [currentTenantUser, setCurrentTenantUser] = useState<TenantUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Alternar tenant (implementação simplificada)
  const switchTenant = useCallback(async (tenantId: string) => {
    if (!user) return;

    try {
      // Buscar dados da empresa (usando configuracao_empresa como base)
      const { data, error } = await supabase
        .from('configuracao_empresa')
        .select('*')
        .eq('id', tenantId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setCurrentTenant(data);
        // Simular usuário tenant atual
        setCurrentTenantUser({
          id: user.id,
          user_id: user.id,
          role: 'admin',
          status: 'ativo',
          permissoes: {
            all: ['create', 'read', 'update', 'delete']
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao alternar tenant';
      console.error('Erro ao alternar tenant:', errorMessage);
      setError(errorMessage);
    }
  }, [user]);

  // Carregar tenants do usuário (baseado em configuracao_empresa)
  const loadUserTenants = useCallback(async () => {
    if (!user) {
      setTenants([]);
      setCurrentTenant(null);
      setCurrentTenantUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar configurações de empresa do usuário
      const { data: empresas, error: empresasError } = await supabase
        .from('configuracao_empresa')
        .select('*')
        .eq('user_id', user.id);

      if (empresasError) throw empresasError;

      setTenants(empresas || []);

      // Se não há tenant atual, selecionar o primeiro
      if (empresas && empresas.length > 0 && !currentTenant) {
        await switchTenant(empresas[0].id);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao carregar tenants';
      console.error('Erro ao carregar tenants:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, currentTenant, switchTenant]);

  // Verificar permissão (implementação simplificada)
  const hasPermission = useCallback((resource: string, action: string) => {
    if (!currentTenantUser) return false;
    
    const permissions = currentTenantUser.permissoes[resource] || currentTenantUser.permissoes['all'];
    return permissions?.includes(action) || permissions?.includes('all');
  }, [currentTenantUser]);

  // Verificar se tem feature (sempre true para implementação simplificada)
  const hasFeature = useCallback((feature: string) => {
    return true; // Todas as features disponíveis na versão simplificada
  }, []);

  // Verificar se é admin
  const isAdmin = useCallback(() => {
    return currentTenantUser?.role === 'admin';
  }, [currentTenantUser]);

  // Verificar se é gerente ou admin
  const isManager = useCallback((): boolean => {
    return currentTenantUser?.role === 'admin' || currentTenantUser?.role === 'gerente';
  }, [currentTenantUser]);

  // Criar convite (placeholder - não implementado)
  const createInvite = useCallback(async (email: string, role: 'admin' | 'gerente' | 'funcionario') => {
    throw new Error('Funcionalidade de convites não implementada na versão atual');
  }, []);

  // Aceitar convite (placeholder - não implementado)
  const acceptInvite = useCallback(async (token: string) => {
    throw new Error('Funcionalidade de convites não implementada na versão atual');
  }, []);

  // Obter estatísticas do tenant (baseado em dados reais)
  const getTenantStatistics = useCallback(async (): Promise<TenantStatistics | null> => {
    if (!user) return null;

    try {
      // Buscar estatísticas reais das tabelas existentes
      const [clientesResult, veiculosResult, pecasResult] = await Promise.all([
        supabase.from('clientes').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('veiculos').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('pecas').select('id', { count: 'exact' }).eq('user_id', user.id)
      ]);

      return {
        total_clientes: clientesResult.count || 0,
        total_veiculos: veiculosResult.count || 0,
        total_pecas: pecasResult.count || 0,
        total_ordens: 0 // Placeholder
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao obter estatísticas';
      console.error('Erro ao obter estatísticas:', errorMessage);
      return null;
    }
  }, [user]);

  // Obter convites pendentes (placeholder)
  const getPendingInvites = useCallback(async (): Promise<TenantInvite[]> => {
    return []; // Não implementado
  }, []);

  // Obter usuários do tenant (placeholder)
  const getTenantUsers = useCallback(async (): Promise<TenantUser[]> => {
    if (!currentTenantUser) return [];
    return [currentTenantUser]; // Retorna apenas o usuário atual
  }, [currentTenantUser]);

  // Atualizar tenant (baseado em configuracao_empresa)
  const updateTenant = useCallback(async (updates: Partial<Tenant>) => {
    if (!currentTenant || !user) throw new Error('Tenant ou usuário não encontrado');

    try {
      const { data, error } = await supabase
        .from('configuracao_empresa')
        .update(updates)
        .eq('id', currentTenant.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCurrentTenant(data);
        return { success: true, data };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao atualizar tenant';
      console.error('Erro ao atualizar tenant:', errorMessage);
      throw new Error(errorMessage);
    }
  }, [currentTenant, user]);

  // Carregar tenant do localStorage na inicialização
  useEffect(() => {
    if (user && userTenants.length > 0 && !currentTenant) {
      const savedTenantId = localStorage.getItem('currentTenantId');
      if (savedTenantId) {
        const savedTenant = userTenants.find(t => t.id === savedTenantId);
        if (savedTenant) {
          switchTenant(savedTenantId);
        }
      }
    }
  }, [user, userTenants, currentTenant, switchTenant]);

  // Carregar tenants quando o usuário muda
  useEffect(() => {
    loadUserTenants();
  }, [loadUserTenants]);

  // Criar novo tenant (baseado em configuracao_empresa)
  const createTenant = async (tenantData: { nome_empresa: string; cnpj?: string }) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('configuracao_empresa')
      .insert({
        nome_empresa: tenantData.nome_empresa,
        cnpj: tenantData.cnpj,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Recarregar tenants
    await loadUserTenants();
    
    // Alternar para o novo tenant
    await switchTenant(data.id);

    return data;
  };

  return {
    // Estado
    currentTenant,
    userTenants,
    currentTenantUser,
    loading,
    error,
    
    // Ações
    switchTenant,
    loadUserTenants,
    createTenant,
    createInvite,
    acceptInvite,
    updateTenant,
    
    // Consultas
    getTenantStatistics,
    getPendingInvites,
    getTenantUsers,
    
    // Verificações
    hasPermission,
    hasFeature,
    isAdmin,
    isManager
  };
};

export default useTenant;