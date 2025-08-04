import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { method, body } = req;
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    console.log(`Ordem Service Manager - Action: ${action}, Method: ${method}`);

    switch (action) {
      case 'create_ordem':
        return await createOrdemServico(supabaseClient, await req.json());
      
      case 'update_ordem':
        return await updateOrdemServico(supabaseClient, await req.json());
      
      case 'calculate_total':
        return await calculateOrderTotal(supabaseClient, await req.json());
      
      case 'get_dashboard_stats':
        return await getDashboardStats(supabaseClient);
      
      case 'generate_report':
        return await generateReport(supabaseClient, url.searchParams);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Ação não encontrada' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createOrdemServico(supabase: any, data: any) {
  console.log('Criando ordem de serviço:', data);
  
  // Validações
  if (!data.cliente_id || !data.veiculo_id) {
    throw new Error('Cliente e veículo são obrigatórios');
  }

  // Verificar se o veículo pertence ao cliente
  const { data: veiculo, error: veiculoError } = await supabase
    .from('veiculos')
    .select('cliente_id')
    .eq('id', data.veiculo_id)
    .single();

  if (veiculoError || veiculo.cliente_id !== data.cliente_id) {
    throw new Error('Veículo não pertence ao cliente selecionado');
  }

  // Inserir ordem de serviço
  const { data: ordem, error: ordemError } = await supabase
    .from('ordens_servico')
    .insert({
      cliente_id: data.cliente_id,
      veiculo_id: data.veiculo_id,
      problema_relatado: data.problema_relatado,
      diagnostico: data.diagnostico,
      observacoes: data.observacoes,
      km_entrada: data.km_entrada,
      status: data.status || 'aguardando',
      user_id: data.user_id,
    })
    .select()
    .single();

  if (ordemError) {
    throw new Error(`Erro ao criar ordem: ${ordemError.message}`);
  }

  // Se há itens de serviço, inseri-los
  if (data.itens && data.itens.length > 0) {
    const itensData = data.itens.map((item: any) => ({
      ordem_servico_id: ordem.id,
      tipo_servico_id: item.tipo_servico_id,
      descricao: item.descricao,
      quantidade: item.quantidade || 1,
      valor_unitario: item.valor_unitario,
      valor_total: (item.quantidade || 1) * item.valor_unitario,
      user_id: data.user_id,
    }));

    const { error: itensError } = await supabase
      .from('itens_servico')
      .insert(itensData);

    if (itensError) {
      console.error('Erro ao inserir itens:', itensError);
    }

    // Calcular total da ordem
    await calculateAndUpdateTotal(supabase, ordem.id);
  }

  return new Response(
    JSON.stringify({ success: true, ordem }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateOrdemServico(supabase: any, data: any) {
  console.log('Atualizando ordem de serviço:', data);

  const { data: ordem, error } = await supabase
    .from('ordens_servico')
    .update({
      problema_relatado: data.problema_relatado,
      diagnostico: data.diagnostico,
      observacoes: data.observacoes,
      status: data.status,
      data_saida: data.status === 'entregue' ? new Date().toISOString() : null,
      desconto: data.desconto || 0,
    })
    .eq('id', data.ordem_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar ordem: ${error.message}`);
  }

  // Recalcular total se necessário
  if (data.recalculate_total) {
    await calculateAndUpdateTotal(supabase, data.ordem_id);
  }

  return new Response(
    JSON.stringify({ success: true, ordem }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function calculateOrderTotal(supabase: any, data: any) {
  const { ordem_id } = data;
  
  const total = await calculateAndUpdateTotal(supabase, ordem_id);
  
  return new Response(
    JSON.stringify({ success: true, total }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function calculateAndUpdateTotal(supabase: any, ordemId: string) {
  // Buscar todos os itens da ordem
  const { data: itens, error: itensError } = await supabase
    .from('itens_servico')
    .select('valor_total')
    .eq('ordem_servico_id', ordemId);

  if (itensError) {
    console.error('Erro ao buscar itens:', itensError);
    return 0;
  }

  const valorTotal = itens.reduce((sum: number, item: any) => sum + (item.valor_total || 0), 0);

  // Buscar desconto da ordem
  const { data: ordem, error: ordemError } = await supabase
    .from('ordens_servico')
    .select('desconto')
    .eq('id', ordemId)
    .single();

  if (ordemError) {
    console.error('Erro ao buscar ordem:', ordemError);
    return valorTotal;
  }

  const desconto = ordem.desconto || 0;
  const valorFinal = valorTotal - desconto;

  // Atualizar ordem com os valores
  await supabase
    .from('ordens_servico')
    .update({
      valor_total: valorTotal,
      valor_final: valorFinal,
    })
    .eq('id', ordemId);

  return { valorTotal, valorFinal, desconto };
}

async function getDashboardStats(supabase: any) {
  console.log('Buscando estatísticas do dashboard');

  // Buscar estatísticas gerais
  const [clientesResult, veiculosResult, ordensResult, servicosResult] = await Promise.all([
    supabase.from('clientes').select('id', { count: 'exact' }),
    supabase.from('veiculos').select('id', { count: 'exact' }),
    supabase.from('ordens_servico').select('id, status, valor_final', { count: 'exact' }),
    supabase.from('tipos_servicos').select('id', { count: 'exact' }),
  ]);

  // Estatísticas por status
  const ordensData = ordensResult.data || [];
  const statusStats = {
    aguardando: ordensData.filter((o: any) => o.status === 'aguardando').length,
    em_andamento: ordensData.filter((o: any) => o.status === 'em_andamento').length,
    finalizado: ordensData.filter((o: any) => o.status === 'finalizado').length,
    entregue: ordensData.filter((o: any) => o.status === 'entregue').length,
  };

  // Faturamento
  const faturamentoTotal = ordensData
    .filter((o: any) => o.status === 'entregue')
    .reduce((sum: number, o: any) => sum + (o.valor_final || 0), 0);

  const stats = {
    total_clientes: clientesResult.count || 0,
    total_veiculos: veiculosResult.count || 0,
    total_ordens: ordensResult.count || 0,
    total_servicos: servicosResult.count || 0,
    status_stats: statusStats,
    faturamento_total: faturamentoTotal,
  };

  return new Response(
    JSON.stringify({ success: true, stats }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function generateReport(supabase: any, params: URLSearchParams) {
  const reportType = params.get('type') || 'monthly';
  const startDate = params.get('start_date');
  const endDate = params.get('end_date');

  console.log(`Gerando relatório: ${reportType}`, { startDate, endDate });

  let query = supabase
    .from('ordens_servico')
    .select(`
      *,
      cliente:clientes(nome, telefone),
      veiculo:veiculos(marca, modelo, placa),
      itens:itens_servico(*)
    `);

  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data: ordens, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Erro ao gerar relatório: ${error.message}`);
  }

  // Processar dados para o relatório
  const report = {
    periodo: { inicio: startDate, fim: endDate },
    total_ordens: ordens.length,
    faturamento_total: ordens
      .filter((o: any) => o.status === 'entregue')
      .reduce((sum: number, o: any) => sum + (o.valor_final || 0), 0),
    ordens_por_status: {
      aguardando: ordens.filter((o: any) => o.status === 'aguardando').length,
      em_andamento: ordens.filter((o: any) => o.status === 'em_andamento').length,
      finalizado: ordens.filter((o: any) => o.status === 'finalizado').length,
      entregue: ordens.filter((o: any) => o.status === 'entregue').length,
    },
    ordens: ordens,
  };

  return new Response(
    JSON.stringify({ success: true, report }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}