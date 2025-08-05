# Plano de Implementação Multi-Tenant para OnliOficina

## Análise da Situação Atual

A aplicação OnliOficina atualmente utiliza um modelo **single-tenant** onde:
- Cada usuário (`auth.users`) tem seus próprios dados isolados via RLS (Row Level Security)
- Todas as tabelas possuem `user_id` para isolamento de dados
- Políticas RLS garantem que usuários só acessem seus próprios dados

## Estratégia Multi-Tenant Proposta

### Modelo Híbrido: Tenant + User

Implementaremos um modelo onde:
1. **Tenants (Empresas)** - Cada oficina será um tenant
2. **Users** - Usuários dentro de cada tenant (funcionários da oficina)
3. **Roles** - Diferentes níveis de acesso dentro do tenant

## Fases de Implementação

### Fase 1: Estrutura Base Multi-Tenant

#### 1.1 Nova Tabela de Tenants
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- para URLs amigáveis
    cnpj TEXT,
    plano TEXT DEFAULT 'basico' CHECK (plano IN ('basico', 'premium', 'enterprise')),
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'suspenso', 'cancelado')),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_vencimento DATE,
    configuracoes JSONB DEFAULT '{}',
    limites JSONB DEFAULT '{}', -- limites por plano
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 1.2 Tabela de Usuários do Tenant
```sql
CREATE TABLE tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'funcionario' CHECK (role IN ('admin', 'gerente', 'funcionario')),
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    permissoes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);
```

#### 1.3 Migração das Tabelas Existentes
- Adicionar `tenant_id` em todas as tabelas existentes
- Manter `user_id` para auditoria e controle granular
- Atualizar políticas RLS para considerar tenant

### Fase 2: Sistema de Convites e Onboarding

#### 2.1 Tabela de Convites
```sql
CREATE TABLE tenant_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'funcionario',
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceito', 'expirado')),
    invited_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2.2 Fluxo de Cadastro
1. **Novo Tenant**: Criação de oficina + primeiro usuário admin
2. **Convite de Usuários**: Admin pode convidar funcionários
3. **Aceitação**: Usuário aceita convite e é vinculado ao tenant

### Fase 3: Controle de Acesso e Permissões

#### 3.1 Sistema de Roles
- **Admin**: Acesso total, gerencia usuários e configurações
- **Gerente**: Acesso a relatórios e operações principais
- **Funcionário**: Acesso limitado às operações do dia a dia

#### 3.2 Permissões Granulares
```json
{
  "clientes": ["create", "read", "update", "delete"],
  "veiculos": ["create", "read", "update"],
  "ordens_servico": ["create", "read", "update"],
  "estoque": ["read"],
  "financeiro": ["read"],
  "relatorios": ["read"],
  "configuracoes": []
}
```

### Fase 4: Interface Multi-Tenant

#### 4.1 Seletor de Tenant
- Usuários podem pertencer a múltiplos tenants
- Interface para alternar entre tenants
- Context API para gerenciar tenant ativo

#### 4.2 Componentes Atualizados
- Header com informações do tenant ativo
- Sidebar com permissões baseadas no role
- Formulários com validação de limites do plano

### Fase 5: Planos e Limitações

#### 5.1 Estrutura de Planos
```json
{
  "basico": {
    "max_usuarios": 3,
    "max_clientes": 100,
    "max_veiculos": 200,
    "max_ordens_mes": 50,
    "features": ["clientes", "veiculos", "ordens_servico"]
  },
  "premium": {
    "max_usuarios": 10,
    "max_clientes": 500,
    "max_veiculos": 1000,
    "max_ordens_mes": 200,
    "features": ["clientes", "veiculos", "ordens_servico", "estoque", "financeiro"]
  },
  "enterprise": {
    "max_usuarios": -1,
    "max_clientes": -1,
    "max_veiculos": -1,
    "max_ordens_mes": -1,
    "features": ["all"]
  }
}
```

#### 5.2 Middleware de Validação
- Verificar limites antes de criar registros
- Bloquear funcionalidades não disponíveis no plano
- Notificações de upgrade de plano

## Cronograma de Implementação

### Semana 1-2: Fase 1 - Estrutura Base
- [ ] Criar migração para tabelas de tenant
- [ ] Atualizar tabelas existentes com tenant_id
- [ ] Migrar dados existentes
- [ ] Atualizar políticas RLS

### Semana 3: Fase 2 - Sistema de Convites
- [ ] Implementar tabela de convites
- [ ] Criar fluxo de onboarding
- [ ] Interface de convites

### Semana 4: Fase 3 - Controle de Acesso
- [ ] Sistema de roles e permissões
- [ ] Middleware de autorização
- [ ] Atualizar componentes com verificação de permissões

### Semana 5: Fase 4 - Interface Multi-Tenant
- [ ] Context API para tenant
- [ ] Seletor de tenant
- [ ] Atualizar header e navegação

### Semana 6: Fase 5 - Planos e Limitações
- [ ] Sistema de planos
- [ ] Middleware de validação de limites
- [ ] Interface de upgrade

## Considerações Técnicas

### Segurança
- RLS em todas as tabelas considerando tenant_id
- Validação de acesso em todas as operações
- Auditoria de ações por usuário e tenant

### Performance
- Índices otimizados para queries multi-tenant
- Cache de permissões e configurações
- Paginação eficiente

### Backup e Migração
- Backup por tenant
- Migração de dados entre tenants
- Exportação de dados

## Riscos e Mitigações

### Riscos
1. **Complexidade**: Aumento significativo da complexidade
2. **Performance**: Queries mais complexas
3. **Migração**: Risco na migração de dados existentes

### Mitigações
1. **Testes**: Cobertura extensiva de testes
2. **Rollback**: Plano de rollback para cada fase
3. **Monitoramento**: Logs detalhados e monitoramento

## Próximos Passos

1. **Aprovação do Plano**: Revisar e aprovar estratégia
2. **Ambiente de Teste**: Configurar ambiente para testes
3. **Backup**: Backup completo antes de iniciar
4. **Implementação Fase 1**: Iniciar com estrutura base

---

**Observação**: Este plano mantém compatibilidade com a estrutura atual, permitindo migração gradual e rollback se necessário.