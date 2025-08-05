# API de Integração - OnliFicina

## Visão Geral

Esta API permite que plataformas externas de vendas registrem automaticamente empresas e usuários administradores no sistema OnliFicina. A integração é feita através de Edge Functions do Supabase com autenticação via API Key.

## Configuração

### 1. Variáveis de Ambiente

No arquivo `.env` do Supabase, adicione:

```env
EXTERNAL_API_KEY=sua_chave_api_super_secreta_aqui
SUPABASE_URL=sua_url_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

### 2. Deploy da Edge Function

```bash
# No diretório do projeto
supabase functions deploy register-company
```

## Endpoints

### POST /functions/v1/register-company

Registra uma nova empresa e cria o usuário administrador.

#### Headers
```
Content-Type: application/json
x-api-key: sua_chave_api_aqui
Authorization: Bearer sua_anon_key_do_supabase
```

#### Body
```json
{
  "empresa": {
    "nome": "Oficina do João",
    "cnpj": "12.345.678/0001-90",
    "telefone": "(11) 99999-9999",
    "email": "contato@oficinadojoao.com",
    "endereco": "Rua das Flores, 123",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01234-567",
    "plano": "premium"
  },
  "admin": {
    "nome": "João Silva",
    "email": "joao@oficinadojoao.com",
    "senha": "senha123",
    "telefone": "(11) 88888-8888"
  }
}
```

#### Campos Obrigatórios
- `empresa.nome`
- `empresa.plano` (basico, premium, enterprise)
- `admin.nome`
- `admin.email`
- `admin.senha`

#### Response - Sucesso (200)
```json
{
  "success": true,
  "data": {
    "tenant_id": "uuid-da-empresa",
    "user_id": "uuid-do-usuario",
    "admin_email": "joao@oficinadojoao.com",
    "company_name": "Oficina do João"
  }
}
```

#### Response - Erro (400/401/500)
```json
{
  "success": false,
  "error": "Descrição do erro"
}
```

## Planos Disponíveis

### Básico
- Máximo 3 usuários
- Máximo 100 clientes
- Máximo 200 veículos
- Máximo 50 ordens de serviço por mês
- Funcionalidades: clientes, veículos, ordens de serviço

### Premium
- Máximo 10 usuários
- Máximo 500 clientes
- Máximo 1000 veículos
- Máximo 200 ordens de serviço por mês
- Funcionalidades: clientes, veículos, ordens de serviço, estoque, financeiro

### Enterprise
- Usuários ilimitados
- Clientes ilimitados
- Veículos ilimitados
- Ordens de serviço ilimitadas
- Todas as funcionalidades

## Exemplo de Integração

### JavaScript/Node.js

```javascript
const registerCompany = async (companyData, adminData) => {
  try {
    const response = await fetch('https://sua-url-supabase.supabase.co/functions/v1/register-company', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'sua_chave_api_aqui',
        'Authorization': 'Bearer sua_anon_key_do_supabase'
      },
      body: JSON.stringify({
        empresa: {
          nome: companyData.nome,
          cnpj: companyData.cnpj,
          telefone: companyData.telefone,
          email: companyData.email,
          endereco: companyData.endereco,
          cidade: companyData.cidade,
          estado: companyData.estado,
          cep: companyData.cep,
          plano: companyData.plano || 'basico'
        },
        admin: {
          nome: adminData.nome,
          email: adminData.email,
          senha: adminData.senha,
          telefone: adminData.telefone
        }
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Empresa registrada com sucesso:', result.data);
      return result.data;
    } else {
      console.error('Erro ao registrar empresa:', result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
    throw error;
  }
};

// Exemplo de uso
const novaEmpresa = {
  nome: 'Oficina do João',
  cnpj: '12.345.678/0001-90',
  telefone: '(11) 99999-9999',
  email: 'contato@oficinadojoao.com',
  endereco: 'Rua das Flores, 123',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01234-567',
  plano: 'premium'
};

const adminData = {
  nome: 'João Silva',
  email: 'joao@oficinadojoao.com',
  senha: 'senha123',
  telefone: '(11) 88888-8888'
};

registerCompany(novaEmpresa, adminData)
  .then(data => {
    console.log('Registro concluído:', data);
  })
  .catch(error => {
    console.error('Falha no registro:', error);
  });
```

### PHP

```php
<?php
function registerCompany($companyData, $adminData) {
    $url = 'https://sua-url-supabase.supabase.co/functions/v1/register-company';
    
    $data = [
        'empresa' => [
            'nome' => $companyData['nome'],
            'cnpj' => $companyData['cnpj'] ?? null,
            'telefone' => $companyData['telefone'] ?? null,
            'email' => $companyData['email'] ?? null,
            'endereco' => $companyData['endereco'] ?? null,
            'cidade' => $companyData['cidade'] ?? null,
            'estado' => $companyData['estado'] ?? null,
            'cep' => $companyData['cep'] ?? null,
            'plano' => $companyData['plano'] ?? 'basico'
        ],
        'admin' => [
            'nome' => $adminData['nome'],
            'email' => $adminData['email'],
            'senha' => $adminData['senha'],
            'telefone' => $adminData['telefone'] ?? null
        ]
    ];
    
    $options = [
        'http' => [
            'header' => [
                'Content-Type: application/json',
                'x-api-key: sua_chave_api_aqui',
                'Authorization: Bearer sua_anon_key_do_supabase'
            ],
            'method' => 'POST',
            'content' => json_encode($data)
        ]
    ];
    
    $context = stream_context_create($options);
    $response = file_get_contents($url, false, $context);
    
    if ($response === FALSE) {
        throw new Exception('Erro na requisição');
    }
    
    $result = json_decode($response, true);
    
    if ($result['success']) {
        return $result['data'];
    } else {
        throw new Exception($result['error']);
    }
}

// Exemplo de uso
$novaEmpresa = [
    'nome' => 'Oficina do João',
    'cnpj' => '12.345.678/0001-90',
    'telefone' => '(11) 99999-9999',
    'email' => 'contato@oficinadojoao.com',
    'endereco' => 'Rua das Flores, 123',
    'cidade' => 'São Paulo',
    'estado' => 'SP',
    'cep' => '01234-567',
    'plano' => 'premium'
];

$adminData = [
    'nome' => 'João Silva',
    'email' => 'joao@oficinadojoao.com',
    'senha' => 'senha123',
    'telefone' => '(11) 88888-8888'
];

try {
    $resultado = registerCompany($novaEmpresa, $adminData);
    echo "Empresa registrada com sucesso: " . json_encode($resultado);
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage();
}
?>
```

## Segurança

1. **API Key**: Mantenha a API key segura e nunca a exponha em código client-side
2. **HTTPS**: Sempre use HTTPS para as requisições
3. **Rate Limiting**: Implemente rate limiting na sua plataforma de vendas
4. **Logs**: Monitore os logs das Edge Functions para detectar tentativas de acesso não autorizado

## Tratamento de Erros

### Códigos de Erro Comuns

- **401**: API Key inválida ou não fornecida
- **400**: Dados obrigatórios ausentes ou inválidos
- **409**: Email já cadastrado no sistema
- **500**: Erro interno do servidor

### Retry Logic

Implemente retry logic para erros temporários (500), mas não para erros de validação (400) ou autenticação (401).

## Monitoramento

Para monitorar o uso da API:

1. Acesse o dashboard do Supabase
2. Vá para "Edge Functions"
3. Selecione "register-company"
4. Visualize logs, métricas e erros

## Suporte

Para suporte técnico ou dúvidas sobre a integração, entre em contato com a equipe de desenvolvimento do OnliFicina.