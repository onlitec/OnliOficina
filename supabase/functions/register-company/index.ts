// Edge Function para registro de empresas no OnliFicina
// Ambiente: Supabase Edge Functions (Deno)

interface CompanyData {
  nome: string
  cnpj?: string
  telefone?: string
  endereco?: string
  plano: 'basico' | 'profissional' | 'empresarial'
}

interface AdminData {
  nome: string
  email: string
  senha: string
  telefone?: string
}

interface RequestBody {
  empresa: CompanyData
  admin: AdminData
}

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Função para lidar com CORS
function handleCors(): Response {
  return new Response('ok', { headers: corsHeaders })
}

// Função principal da Edge Function
const handler = async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return handleCors()
  }

  try {
    // Verificar API Key
    const apiKey = req.headers.get('x-api-key')
    const expectedApiKey = (globalThis as any).Deno?.env?.get('EXTERNAL_API_KEY')
    
    if (!apiKey || apiKey !== expectedApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'API Key inválida ou não fornecida' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verificar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Método não permitido' 
        }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse do body
    const body: RequestBody = await req.json()
    
    // Validação dos dados obrigatórios
    if (!body.empresa?.nome || !body.admin?.email || !body.admin?.senha) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Dados obrigatórios: empresa.nome, admin.email, admin.senha' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validação do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.admin.email)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email inválido' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Configurar cliente Supabase com service role
    const supabaseUrl = (globalThis as any).Deno?.env?.get('SUPABASE_URL')
    const supabaseServiceKey = (globalThis as any).Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Configuração do Supabase não encontrada' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Criar cliente Supabase (será resolvido em runtime)
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 1. Verificar se o email já existe
    const { data: existingUser } = await supabase.auth.admin.listUsers()
    const emailExists = existingUser?.users?.some((user: any) => user.email === body.admin.email)
    
    if (emailExists) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email já cadastrado no sistema' 
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 2. Verificar se o CNPJ já existe (se fornecido)
    if (body.empresa.cnpj) {
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('cnpj', body.empresa.cnpj)
        .single()
      
      if (existingTenant) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'CNPJ já cadastrado no sistema' 
          }),
          { 
            status: 409, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // 3. Criar usuário no Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: body.admin.email,
      password: body.admin.senha,
      email_confirm: true,
      user_metadata: {
        nome: body.admin.nome,
        telefone: body.admin.telefone,
        role: 'admin'
      }
    })

    if (authError || !authUser.user) {
      console.error('Erro ao criar usuário:', authError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao criar usuário: ' + authError?.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 4. Definir limites do plano
    const planLimits = {
      basico: {
        max_users: 3,
        max_vehicles: 100,
        max_customers: 500,
        features: ['basic_reports', 'customer_management', 'vehicle_tracking']
      },
      profissional: {
        max_users: 10,
        max_vehicles: 500,
        max_customers: 2000,
        features: ['advanced_reports', 'inventory_management', 'financial_reports', 'api_access']
      },
      empresarial: {
        max_users: 50,
        max_vehicles: -1, // ilimitado
        max_customers: -1, // ilimitado
        features: ['all_features', 'custom_integrations', 'priority_support', 'white_label']
      }
    }

    const selectedPlan = planLimits[body.empresa.plano] || planLimits.basico

    // 5. Criar tenant (empresa)
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: body.empresa.nome,
        cnpj: body.empresa.cnpj,
        phone: body.empresa.telefone,
        address: body.empresa.endereco,
        plan: body.empresa.plano,
        plan_limits: selectedPlan,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (tenantError || !tenant) {
      console.error('Erro ao criar tenant:', tenantError)
      
      // Cleanup: deletar usuário criado
      await supabase.auth.admin.deleteUser(authUser.user.id)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao criar empresa: ' + tenantError?.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 6. Vincular usuário ao tenant
    const { error: userTenantError } = await supabase
      .from('user_tenants')
      .insert({
        user_id: authUser.user.id,
        tenant_id: tenant.id,
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString()
      })

    if (userTenantError) {
      console.error('Erro ao vincular usuário ao tenant:', userTenantError)
      
      // Cleanup: deletar tenant e usuário criados
      await supabase.from('tenants').delete().eq('id', tenant.id)
      await supabase.auth.admin.deleteUser(authUser.user.id)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao vincular usuário à empresa: ' + userTenantError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 7. Resposta de sucesso
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Empresa e usuário administrador criados com sucesso',
        data: {
          tenant_id: tenant.id,
          user_id: authUser.user.id,
          admin_email: body.admin.email,
          company_name: body.empresa.nome,
          plan: body.empresa.plano,
          plan_limits: selectedPlan
        }
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro inesperado:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

// Exportar handler para Supabase Edge Functions
;(globalThis as any).serve?.(handler) || console.log('Edge Function loaded')