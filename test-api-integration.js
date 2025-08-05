/**
 * Script de teste para a API de integração do OnliFicina
 * 
 * Este script demonstra como uma plataforma externa de vendas
 * pode registrar empresas e usuários administradores no OnliFicina
 */

const SUPABASE_URL = 'https://seu-projeto.supabase.co'; // Substitua pela sua URL
const SUPABASE_ANON_KEY = 'sua_anon_key_aqui'; // Substitua pela sua anon key
const API_KEY = 'sua_chave_api_aqui'; // Substitua pela sua API key

/**
 * Função para registrar uma nova empresa no OnliFicina
 */
async function registerCompany(companyData, adminData) {
  try {
    console.log('🚀 Iniciando registro da empresa:', companyData.nome);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/register-company`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        empresa: companyData,
        admin: adminData
      })
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Empresa registrada com sucesso!');
      console.log('📊 Dados retornados:', result.data);
      return result.data;
    } else {
      console.error('❌ Erro ao registrar empresa:', result.error);
      throw new Error(result.error || 'Erro desconhecido');
    }
  } catch (error) {
    console.error('🔥 Erro na requisição:', error.message);
    throw error;
  }
}

/**
 * Exemplos de dados para teste
 */
const exemploEmpresa1 = {
  nome: 'Auto Center Silva',
  cnpj: '12.345.678/0001-90',
  telefone: '(11) 99999-9999',
  email: 'contato@autocentrosilva.com',
  endereco: 'Rua das Oficinas, 123',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01234-567',
  plano: 'premium'
};

const exemploAdmin1 = {
  nome: 'Carlos Silva',
  email: 'carlos@autocentrosilva.com',
  senha: 'MinhaSenh@123',
  telefone: '(11) 88888-8888'
};

const exemploEmpresa2 = {
  nome: 'Oficina do João',
  cnpj: '98.765.432/0001-10',
  telefone: '(21) 77777-7777',
  email: 'contato@oficinadojoao.com',
  endereco: 'Av. dos Mecânicos, 456',
  cidade: 'Rio de Janeiro',
  estado: 'RJ',
  cep: '20000-000',
  plano: 'basico'
};

const exemploAdmin2 = {
  nome: 'João Santos',
  email: 'joao@oficinadojoao.com',
  senha: 'OutraSenh@456',
  telefone: '(21) 66666-6666'
};

const exemploEmpresa3 = {
  nome: 'MegaOficina Enterprise',
  cnpj: '11.222.333/0001-44',
  telefone: '(31) 55555-5555',
  email: 'contato@megaoficina.com',
  endereco: 'Complexo Industrial, 789',
  cidade: 'Belo Horizonte',
  estado: 'MG',
  cep: '30000-000',
  plano: 'enterprise'
};

const exemploAdmin3 = {
  nome: 'Maria Oliveira',
  email: 'maria@megaoficina.com',
  senha: 'SuperSenh@789',
  telefone: '(31) 44444-4444'
};

/**
 * Função principal para executar os testes
 */
async function executarTestes() {
  console.log('🧪 Iniciando testes da API de integração OnliFicina\n');
  
  const empresasParaTestar = [
    { empresa: exemploEmpresa1, admin: exemploAdmin1 },
    { empresa: exemploEmpresa2, admin: exemploAdmin2 },
    { empresa: exemploEmpresa3, admin: exemploAdmin3 }
  ];
  
  for (let i = 0; i < empresasParaTestar.length; i++) {
    const { empresa, admin } = empresasParaTestar[i];
    
    console.log(`\n--- Teste ${i + 1}/3 ---`);
    
    try {
      const resultado = await registerCompany(empresa, admin);
      
      console.log(`✅ Teste ${i + 1} concluído com sucesso!`);
      console.log(`   Empresa ID: ${resultado.tenant_id}`);
      console.log(`   Usuário ID: ${resultado.user_id}`);
      console.log(`   Email Admin: ${resultado.admin_email}`);
      console.log(`   Nome Empresa: ${resultado.company_name}`);
      
    } catch (error) {
      console.log(`❌ Teste ${i + 1} falhou:`, error.message);
    }
    
    // Aguardar um pouco entre os testes
    if (i < empresasParaTestar.length - 1) {
      console.log('⏳ Aguardando 2 segundos antes do próximo teste...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n🏁 Testes concluídos!');
}

/**
 * Função para testar apenas uma empresa (útil para desenvolvimento)
 */
async function testeUnico() {
  console.log('🧪 Executando teste único\n');
  
  try {
    const resultado = await registerCompany(exemploEmpresa1, exemploAdmin1);
    console.log('✅ Teste único concluído com sucesso!', resultado);
  } catch (error) {
    console.log('❌ Teste único falhou:', error.message);
  }
}

/**
 * Função para validar configurações antes de executar testes
 */
function validarConfiguracoes() {
  const configuracoes = [
    { nome: 'SUPABASE_URL', valor: SUPABASE_URL },
    { nome: 'SUPABASE_ANON_KEY', valor: SUPABASE_ANON_KEY },
    { nome: 'API_KEY', valor: API_KEY }
  ];
  
  console.log('🔍 Validando configurações...');
  
  for (const config of configuracoes) {
    if (!config.valor || config.valor.includes('seu-') || config.valor.includes('sua_')) {
      console.error(`❌ ${config.nome} não está configurada corretamente!`);
      console.error(`   Valor atual: ${config.valor}`);
      return false;
    }
  }
  
  console.log('✅ Todas as configurações estão válidas!');
  return true;
}

// Verificar se o script está sendo executado diretamente
if (typeof require !== 'undefined' && require.main === module) {
  // Executar validação e testes
  if (validarConfiguracoes()) {
    console.log('\n🚀 Escolha o tipo de teste:');
    console.log('1. Teste único (recomendado para desenvolvimento)');
    console.log('2. Todos os testes (3 empresas)');
    
    // Para Node.js, você pode usar readline para interação
    // Por simplicidade, vamos executar o teste único
    testeUnico();
    
    // Para executar todos os testes, descomente a linha abaixo:
    // executarTestes();
  } else {
    console.log('\n📝 Para configurar:');
    console.log('1. Substitua as variáveis no topo do arquivo');
    console.log('2. Configure a API key no Supabase');
    console.log('3. Faça o deploy da Edge Function register-company');
  }
}

// Exportar funções para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    registerCompany,
    executarTestes,
    testeUnico,
    validarConfiguracoes
  };
}