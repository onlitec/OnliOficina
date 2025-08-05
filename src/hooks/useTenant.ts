import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Tenant {
  id: string;
  name: string;
  description?: string;
  nome: string;
  slug: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  logo_url?: string;
  plano: 'basico' | 'premium' | 'enterprise';
  status: 'ativo' | 'suspenso' | 'cancelado';
  data_criacao: string;
  data_vencimento?: string;
  configuracoes: Record<string, any>;
  limites: {
    max_usuarios: number;
    max_clientes: number;
    max_veiculos: number;
    max_ordens_mes: number;
    features: string[];
  };
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  role: 'admin' | 'gerente' | 'funcionario';
  status: 'ativo' | 'inativo';
  permissoes: Record<string, string[]>;
  created_at: string;
  updated_at: string;
}

export interface TenantInvite {
  id: string;
  tenant_id: string;
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

export interface TenantStatistics {
  tenant_id: string;
  tenant_nome: string;
  plano: string;
  total_usuarios: number;
  total_clientes: number;
  total_veiculos: number;
  ordens_mes_atual: number;
  ordens_em_andamento: number;
  limites: Record<string, any>;
}

export const useTenant = () => {
  const { user } = useAuth();
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [userTenants, setUserTenants] = useState<Tenant[]>([]);
  const [currentTenantUser, setCurrentTenantUser] = useState<TenantUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar tenants do usuário
  const loadUserTenants = useCallback(async () => {
    if (!user) {
      setUserTenants([]);
      setCurrentTenant(null);
      setCurrentTenantUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar todos os tenants do usuário
      const { data: tenantUsers, error: tenantUsersError } = await supabase
        .from('tenant_users')
        .select(`
          *,
          tenant:tenants(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'ativo');

      if (tenantUsersError) throw tenantUsersError;

      const tenants = tenantUsers?.map(tu => tu.tenant).filter(Boolean) || [];
      setUserTenants(tenants);

      // Se não há tenant atual definido, usar o primeiro
      if (!currentTenant && tenants.length > 0) {
        await switchTenant(tenants[0].id);
      }
    } catch (err: any) {
      console.error('Erro ao carregar tenants:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, currentTenant]);

  // Trocar de tenant
  const switchTenant = useCallback(async (tenantId: string) => {
    try {
      setError(null);

      // Chamar função do banco para trocar contexto
      const { data, error } = await supabase.rpc('switch_tenant_context', {
        p_tenant_id: tenantId
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Buscar informações completas do tenant
      const { data: tenantInfo, error: tenantError } = await supabase.rpc('get_current_tenant_info');
      
      if (tenantError) throw tenantError;
      if (!tenantInfo.success) throw new Error(tenantInfo.error);

      const tenant = tenantInfo.tenant;
      setCurrentTenant({
        id: tenant.id,
        nome: tenant.nome,
        slug: tenant.slug,
        cnpj: tenant.cnpj,
        telefone: tenant.telefone,
        email: tenant.email,
        endereco: tenant.endereco,
        cidade: tenant.cidade,
        estado: tenant.estado,
        cep: tenant.cep,
        logo_url: tenant.logo_url,
        plano: tenant.plano,
        status: tenant.status,
        data_criacao: tenant.data_criacao,
        data_vencimento: tenant.data_vencimento,
        configuracoes: tenant.configuracoes,
        limites: tenant.limites,
        created_at: tenant.created_at,
        updated_at: tenant.updated_at
      });

      setCurrentTenantUser({
        id: tenant.id, // Será ajustado quando tivermos a estrutura correta
        tenant_id: tenant.id,
        user_id: user?.id || '',
        role: tenant.role,
        status: 'ativo',
        permissoes: tenant.permissoes,
        created_at: tenant.created_at,
        updated_at: tenant.updated_at
      });

      // Salvar no localStorage para persistir entre sessões
      localStorage.setItem('currentTenantId', tenantId);

    } catch (err: any) {
      console.error('Erro ao trocar tenant:', err);
      setError(err.message);
    }
  }, [user]);

  // Verificar permissão
  const hasPermission = useCallback((resource: string, action: string): boolean => {
    if (!currentTenantUser?.permissoes) return false;
    
    const resourcePermissions = currentTenantUser.permissoes[resource];
    if (!resourcePermissions) return false;
    
    return resourcePermissions.includes(action);
  }, [currentTenantUser]);

  // Verificar se tem feature
  const hasFeature = useCallback((feature: string): boolean => {
    if (!currentTenant?.limites?.features) return false;
    return currentTenant.limites.features.includes(feature);
  }, [currentTenant]);

  // Verificar se é admin
  const isAdmin = useCallback((): boolean => {
    return currentTenantUser?.role === 'admin';
  }, [currentTenantUser]);

  // Verificar se é gerente ou admin
  const isManager = useCallback((): boolean => {
    return currentTenantUser?.role === 'admin' || currentTenantUser?.role === 'gerente';
  }, [currentTenantUser]);

  // Criar convite
  const createInvite = useCallback(async (email: string, role: 'admin' | 'gerente' | 'funcionario') => {
    if (!currentTenant) throw new Error('Nenhum tenant selecionado');
    
    try {
      const { data, error } = await supabase.rpc('create_tenant_invite', {
        p_tenant_id: currentTenant.id,
        p_email: email,
        p_role: role
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data;
    } catch (err: any) {
      console.error('Erro ao criar convite:', err);
      throw err;
    }
  }, [currentTenant]);

  // Aceitar convite
  const acceptInvite = useCallback(async (token: string) => {
    try {
      const { data, error } = await supabase.rpc('accept_tenant_invite', {
        invite_token: token
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Recarregar tenants após aceitar convite
      await loadUserTenants();

      return data;
    } catch (err: any) {
      console.error('Erro ao aceitar convite:', err);
      throw err;
    }
  }, [loadUserTenants]);

  // Buscar estatísticas do tenant
  const getTenantStatistics = useCallback(async (): Promise<TenantStatistics | null> => {
    if (!currentTenant) return null;

    try {
      const { data, error } = await supabase
        .from('tenant_statistics')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Erro ao buscar estatísticas:', err);
      return null;
    }
  }, [currentTenant]);

  // Buscar convites pendentes
  const getPendingInvites = useCallback(async (): Promise<TenantInvite[]> => {
    if (!currentTenant) return [];

    try {
      const { data, error } = await supabase
        .from('tenant_invites')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('status', 'pendente')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Erro ao buscar convites:', err);
      return [];
    }
  }, [currentTenant]);

  // Buscar usuários do tenant
  const getTenantUsers = useCallback(async (): Promise<TenantUser[]> => {
    if (!currentTenant) return [];

    try {
      const { data, error } = await supabase
        .from('current_tenant_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Erro ao buscar usuários do tenant:', err);
      return [];
    }
  }, [currentTenant]);

  // Atualizar tenant
  const updateTenant = useCallback(async (updates: Partial<Tenant>) => {
    if (!currentTenant) throw new Error('Nenhum tenant selecionado');
    if (!isAdmin()) throw new Error('Apenas administradores podem atualizar o tenant');

    try {
      const { data, error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', currentTenant.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentTenant(prev => prev ? { ...prev, ...data } : null);
      return data;
    } catch (err: any) {
      console.error('Erro ao atualizar tenant:', err);
      throw err;
    }
  }, [currentTenant, isAdmin]);

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

  const createTenant = async (tenantData: { name: string; description?: string }) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('tenants')
      .insert({
        name: tenantData.name,
        description: tenantData.description,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Adicionar o usuário como owner do tenant
    await supabase
      .from('tenant_users')
      .insert({
        tenant_id: data.id,
        user_id: user.id,
        role: 'owner',
        permissions: ['all']
      });

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