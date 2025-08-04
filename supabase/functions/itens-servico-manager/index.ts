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

    const { method } = req;
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    console.log(`Itens Service Manager - Action: ${action}, Method: ${method}`);

    switch (action) {
      case 'add_item':
        return await addItemServico(supabaseClient, await req.json());
      
      case 'update_item':
        return await updateItemServico(supabaseClient, await req.json());
      
      case 'remove_item':
        return await removeItemServico(supabaseClient, await req.json());
      
      case 'get_items':
        const ordemId = url.searchParams.get('ordem_id');
        return await getItensServico(supabaseClient, ordemId);
      
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

async function addItemServico(supabase: any, data: any) {
  console.log('Adicionando item de serviço:', data);
  
  // Validações
  if (!data.ordem_servico_id || !data.descricao || !data.valor_unitario) {
    throw new Error('Ordem, descrição e valor são obrigatórios');
  }

  const quantidade = data.quantidade || 1;
  const valorTotal = quantidade * data.valor_unitario;

  const { data: item, error } = await supabase
    .from('itens_servico')
    .insert({
      ordem_servico_id: data.ordem_servico_id,
      tipo_servico_id: data.tipo_servico_id,
      descricao: data.descricao,
      quantidade: quantidade,
      valor_unitario: data.valor_unitario,
      valor_total: valorTotal,
      user_id: data.user_id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao adicionar item: ${error.message}`);
  }

  // Recalcular total da ordem
  await recalculateOrderTotal(supabase, data.ordem_servico_id);

  return new Response(
    JSON.stringify({ success: true, item }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateItemServico(supabase: any, data: any) {
  console.log('Atualizando item de serviço:', data);

  const quantidade = data.quantidade || 1;
  const valorTotal = quantidade * data.valor_unitario;

  const { data: item, error } = await supabase
    .from('itens_servico')
    .update({
      tipo_servico_id: data.tipo_servico_id,
      descricao: data.descricao,
      quantidade: quantidade,
      valor_unitario: data.valor_unitario,
      valor_total: valorTotal,
    })
    .eq('id', data.item_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar item: ${error.message}`);
  }

  // Recalcular total da ordem
  await recalculateOrderTotal(supabase, item.ordem_servico_id);

  return new Response(
    JSON.stringify({ success: true, item }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function removeItemServico(supabase: any, data: any) {
  console.log('Removendo item de serviço:', data);

  // Buscar o item primeiro para pegar o ordem_servico_id
  const { data: item, error: fetchError } = await supabase
    .from('itens_servico')
    .select('ordem_servico_id')
    .eq('id', data.item_id)
    .single();

  if (fetchError) {
    throw new Error(`Item não encontrado: ${fetchError.message}`);
  }

  const { error } = await supabase
    .from('itens_servico')
    .delete()
    .eq('id', data.item_id);

  if (error) {
    throw new Error(`Erro ao remover item: ${error.message}`);
  }

  // Recalcular total da ordem
  await recalculateOrderTotal(supabase, item.ordem_servico_id);

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getItensServico(supabase: any, ordemId: string | null) {
  if (!ordemId) {
    throw new Error('ID da ordem é obrigatório');
  }

  console.log('Buscando itens da ordem:', ordemId);

  const { data: itens, error } = await supabase
    .from('itens_servico')
    .select(`
      *,
      tipo_servico:tipos_servicos(nome, preco_base, tempo_estimado)
    `)
    .eq('ordem_servico_id', ordemId)
    .order('created_at');

  if (error) {
    throw new Error(`Erro ao buscar itens: ${error.message}`);
  }

  return new Response(
    JSON.stringify({ success: true, itens }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function recalculateOrderTotal(supabase: any, ordemId: string) {
  // Buscar todos os itens da ordem
  const { data: itens, error: itensError } = await supabase
    .from('itens_servico')
    .select('valor_total')
    .eq('ordem_servico_id', ordemId);

  if (itensError) {
    console.error('Erro ao buscar itens para recálculo:', itensError);
    return;
  }

  const valorTotal = itens.reduce((sum: number, item: any) => sum + (item.valor_total || 0), 0);

  // Buscar desconto da ordem
  const { data: ordem, error: ordemError } = await supabase
    .from('ordens_servico')
    .select('desconto')
    .eq('id', ordemId)
    .single();

  if (ordemError) {
    console.error('Erro ao buscar ordem para recálculo:', ordemError);
    return;
  }

  const desconto = ordem.desconto || 0;
  const valorFinal = valorTotal - desconto;

  // Atualizar ordem com os valores
  const { error: updateError } = await supabase
    .from('ordens_servico')
    .update({
      valor_total: valorTotal,
      valor_final: valorFinal,
    })
    .eq('id', ordemId);

  if (updateError) {
    console.error('Erro ao atualizar totais da ordem:', updateError);
  }

  console.log(`Ordem ${ordemId} recalculada: Total=${valorTotal}, Final=${valorFinal}`);
}