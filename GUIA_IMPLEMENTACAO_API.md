# Guia de Implementação - API de Integração OnliFicina

## 📋 Visão Geral

Este guia fornece instruções passo a passo para implementar a integração entre sua plataforma de vendas e o OnliFicina, permitindo o registro automático de empresas e usuários administradores.

## 🎯 Objetivo

Permitir que clientes da sua plataforma de vendas:
1. Se cadastrem na sua plataforma
2. Tenham automaticamente uma conta criada no OnliFicina
3. Recebam credenciais de administrador da empresa
4. Acessem o sistema com isolamento completo de dados

## 🛠️ Pré-requisitos

- [ ] Projeto Supabase configurado
- [ ] Supabase CLI instalado
- [ ] Conhecimento básico de APIs REST
- [ ] Acesso ao código da sua plataforma de vendas

## 📦 Passo 1: Configuração do Ambiente

### 1.1 Instalar Supabase CLI

```bash
# Via npm
npm install -g supabase

# Via Homebrew (macOS)
brew install supabase/tap/supabase
```

### 1.2 Configurar Variáveis de Ambiente

1. Copie o arquivo de exemplo:
```bash
cp supabase/.env.example supabase/.env
```

2. Edite o arquivo `supabase/.env`:
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_anon_key_real
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_real
EXTERNAL_API_KEY=gere_uma_chave_super_secreta_aqui
```

**⚠️ IMPORTANTE**: 
- Substitua todos os valores de exemplo
- A `EXTERNAL_API_KEY` deve ser uma string longa e aleatória
- Nunca exponha essas chaves publicamente

### 1.3 Gerar API Key Segura

```bash
# Linux/macOS
openssl rand -hex 32

# Ou use um gerador online confiável
# Exemplo: https://www.uuidgenerator.net/api/version4
```

## 🚀 Passo 2: Deploy da Edge Function

### 2.1 Fazer Login no Supabase

```bash
supabase login
```

### 2.2 Linkar o Projeto

```bash
supabase link --project-ref seu-project-ref
```

### 2.3 Deploy da Function

```bash
supabase functions deploy register-company
```

### 2.4 Configurar Secrets

```bash
# Configurar a API key como secret
supabase secrets set EXTERNAL_API_KEY=sua_chave_api_super_secreta

# Verificar se foi configurada
supabase secrets list
```

## 🧪 Passo 3: Testar a API

### 3.1 Configurar o Script de Teste

1. Edite o arquivo `test-api-integration.js`
2. Substitua as variáveis no topo:

```javascript
const SUPABASE_URL = 'https://seu-projeto-real.supabase.co';
const SUPABASE_ANON_KEY = 'sua_anon_key_real';
const API_KEY = 'sua_chave_api_real';
```

### 3.2 Executar o Teste

```bash
# Instalar dependências (se necessário)
npm install node-fetch

# Executar teste
node test-api-integration.js
```

### 3.3 Verificar Resultados

Se tudo estiver funcionando, você verá:
```
✅ Empresa registrada com sucesso!
📊 Dados retornados: {
  tenant_id: "uuid-da-empresa",
  user_id: "uuid-do-usuario",
  admin_email: "email@empresa.com",
  company_name: "Nome da Empresa"
}
```

## 🔗 Passo 4: Integração na Sua Plataforma

### 4.1 Estrutura Básica

```javascript
// Exemplo para Node.js/Express
const express = require('express');
const app = express();

// Configurações
const ONLIFICINA_API_URL = 'https://seu-projeto.supabase.co/functions/v1/register-company';
const ONLIFICINA_API_KEY = process.env.ONLIFICINA_API_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Endpoint para processar compra/assinatura
app.post('/processar-compra', async (req, res) => {
  try {
    const { empresa, admin, plano } = req.body;
    
    // 1. Processar pagamento (sua lógica existente)
    const pagamentoAprovado = await processarPagamento(req.body);
    
    if (pagamentoAprovado) {
      // 2. Registrar no OnliFicina
      const resultadoOnliFicina = await registrarNoOnliFicina({
        empresa: { ...empresa, plano },
        admin
      });
      
      // 3. Enviar credenciais por email
      await enviarCredenciais(admin.email, {
        email: admin.email,
        senha: admin.senha, // ou gerar uma temporária
        linkAcesso: 'https://seu-onlificina.com',
        empresaId: resultadoOnliFicina.tenant_id
      });
      
      res.json({
        success: true,
        message: 'Compra processada e conta criada com sucesso!',
        onliFicina: resultadoOnliFicina
      });
    }
  } catch (error) {
    console.error('Erro ao processar compra:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

async function registrarNoOnliFicina(dados) {
  const response = await fetch(ONLIFICINA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ONLIFICINA_API_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify(dados)
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result.data;
}
```

### 4.2 Tratamento de Erros

```javascript
const tratarErroOnliFicina = (error) => {
  // Log do erro para monitoramento
  console.error('Erro OnliFicina:', error);
  
  // Mapear erros para mensagens amigáveis
  const mensagensErro = {
    'Email já cadastrado': 'Este email já possui uma conta no sistema.',
    'CNPJ já cadastrado': 'Esta empresa já está registrada.',
    'Dados obrigatórios': 'Alguns dados obrigatórios estão faltando.',
    'API Key inválida': 'Erro de configuração. Contate o suporte.'
  };
  
  for (const [chave, mensagem] of Object.entries(mensagensErro)) {
    if (error.message.includes(chave)) {
      return mensagem;
    }
  }
  
  return 'Erro temporário. Tente novamente em alguns minutos.';
};
```

### 4.3 Retry Logic

```javascript
const registrarComRetry = async (dados, maxTentativas = 3) => {
  for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
    try {
      return await registrarNoOnliFicina(dados);
    } catch (error) {
      // Não fazer retry para erros de validação
      if (error.message.includes('obrigatórios') || 
          error.message.includes('já cadastrado')) {
        throw error;
      }
      
      // Último tentativa
      if (tentativa === maxTentativas) {
        throw error;
      }
      
      // Aguardar antes da próxima tentativa
      await new Promise(resolve => 
        setTimeout(resolve, tentativa * 1000)
      );
    }
  }
};
```

## 📧 Passo 5: Notificação ao Cliente

### 5.1 Template de Email

```html
<!DOCTYPE html>
<html>
<head>
    <title>Bem-vindo ao OnliFicina</title>
</head>
<body>
    <h1>🎉 Sua conta OnliFicina foi criada!</h1>
    
    <p>Olá {{nome_admin}},</p>
    
    <p>Sua empresa <strong>{{nome_empresa}}</strong> foi registrada com sucesso no OnliFicina!</p>
    
    <h2>📋 Seus dados de acesso:</h2>
    <ul>
        <li><strong>Email:</strong> {{email_admin}}</li>
        <li><strong>Senha:</strong> {{senha_temporaria}}</li>
        <li><strong>Plano:</strong> {{plano_contratado}}</li>
    </ul>
    
    <p>
        <a href="{{link_acesso}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            🚀 Acessar OnliFicina
        </a>
    </p>
    
    <h3>📚 Próximos passos:</h3>
    <ol>
        <li>Acesse sua conta usando o link acima</li>
        <li>Altere sua senha no primeiro login</li>
        <li>Configure os dados da sua empresa</li>
        <li>Convide outros usuários da sua equipe</li>
        <li>Comece a cadastrar seus clientes e veículos</li>
    </ol>
    
    <p>Em caso de dúvidas, nossa equipe de suporte está disponível!</p>
    
    <p>Atenciosamente,<br>Equipe OnliFicina</p>
</body>
</html>
```

## 🔒 Passo 6: Segurança e Monitoramento

### 6.1 Configurações de Segurança

```javascript
// Rate limiting
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 registros por IP
  message: 'Muitas tentativas. Tente novamente em 15 minutos.'
});

app.use('/processar-compra', apiLimiter);
```

### 6.2 Logs e Monitoramento

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'onlificina-integration.log' })
  ]
});

// Log de todas as tentativas de registro
app.post('/processar-compra', (req, res, next) => {
  logger.info('Tentativa de registro OnliFicina', {
    ip: req.ip,
    empresa: req.body.empresa?.nome,
    email: req.body.admin?.email,
    timestamp: new Date().toISOString()
  });
  next();
});
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Erro 401 - API Key inválida
```
❌ Solução:
- Verificar se a API key está configurada corretamente
- Confirmar que a secret foi definida no Supabase
- Verificar se não há espaços extras na chave
```

#### 2. Erro 400 - Dados obrigatórios
```
❌ Solução:
- Verificar se empresa.nome está preenchido
- Verificar se admin.email está preenchido
- Verificar se admin.senha está preenchido
- Validar formato do email
```

#### 3. Erro 500 - Erro interno
```
❌ Solução:
- Verificar logs da Edge Function no Supabase
- Confirmar que as migrações foram executadas
- Verificar se o service role key está correto
```

#### 4. Function não encontrada
```
❌ Solução:
- Confirmar que o deploy foi feito: supabase functions deploy register-company
- Verificar se a URL está correta
- Confirmar que o projeto está linkado corretamente
```

### Comandos Úteis para Debug

```bash
# Verificar status do projeto
supabase status

# Ver logs da function
supabase functions logs register-company

# Testar function localmente
supabase functions serve register-company

# Verificar secrets
supabase secrets list
```

## 📈 Monitoramento em Produção

### Dashboard do Supabase
1. Acesse o dashboard do seu projeto
2. Vá para "Edge Functions"
3. Selecione "register-company"
4. Monitore:
   - Número de invocações
   - Tempo de resposta
   - Taxa de erro
   - Logs de erro

### Alertas Recomendados
- Taxa de erro > 5%
- Tempo de resposta > 5 segundos
- Mais de 10 falhas consecutivas

## 🎯 Próximos Passos

Após a implementação básica:

1. **Webhook de Status**: Implementar webhook para notificar mudanças de status da conta
2. **Sincronização de Planos**: Sincronizar upgrades/downgrades de plano
3. **SSO (Single Sign-On)**: Implementar login único entre as plataformas
4. **API de Consulta**: Criar endpoints para consultar status da conta
5. **Dashboard de Integração**: Painel para monitorar integrações

## 📞 Suporte

Para dúvidas ou problemas:
- 📧 Email: suporte@onlificina.com
- 📱 WhatsApp: (11) 99999-9999
- 🌐 Documentação: https://docs.onlificina.com

---

**✅ Checklist Final**

- [ ] Variáveis de ambiente configuradas
- [ ] Edge Function deployada
- [ ] API Key configurada como secret
- [ ] Teste básico executado com sucesso
- [ ] Integração implementada na plataforma
- [ ] Template de email configurado
- [ ] Logs e monitoramento implementados
- [ ] Tratamento de erros implementado
- [ ] Documentação da integração criada
- [ ] Equipe treinada para suporte