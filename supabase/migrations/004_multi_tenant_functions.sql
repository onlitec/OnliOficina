-- Migração 004: Funções auxiliares e triggers para multi-tenancy
-- Esta migração adiciona funções de apoio, triggers de auditoria e validações

-- Função para validar limites do plano
CREATE OR REPLACE FUNCTION validate_tenant_limits(tenant_uuid UUID, resource_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    tenant_limits JSONB;
    current_count INTEGER;
    max_allowed INTEGER;
BEGIN
    -- Busca os limites do tenant
    SELECT limites INTO tenant_limits FROM tenants WHERE id = tenant_uuid;
    
    IF tenant_limits IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verifica limites específicos por tipo de recurso
    CASE resource_type
        WHEN 'usuarios' THEN
            SELECT COUNT(*) INTO current_count FROM tenant_users WHERE tenant_id = tenant_uuid AND status = 'ativo';
            max_allowed := (tenant_limits->>'max_usuarios')::INTEGER;
        WHEN 'clientes' THEN
            SELECT COUNT(*) INTO current_count FROM clientes WHERE tenant_id = tenant_uuid;
            max_allowed := (tenant_limits->>'max_clientes')::INTEGER;
        WHEN 'veiculos' THEN
            SELECT COUNT(*) INTO current_count FROM veiculos WHERE tenant_id = tenant_uuid;
            max_allowed := (tenant_limits->>'max_veiculos')::INTEGER;
        WHEN 'ordens_mes' THEN
            SELECT COUNT(*) INTO current_count 
            FROM ordens_servico 
            WHERE tenant_id = tenant_uuid 
            AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW());
            max_allowed := (tenant_limits->>'max_ordens_mes')::INTEGER;
        ELSE
            RETURN TRUE; -- Se não há limite definido, permite
    END CASE;
    
    RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se uma feature está habilitada
CREATE OR REPLACE FUNCTION tenant_has_feature(tenant_uuid UUID, feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    tenant_limits JSONB;
    features JSONB;
BEGIN
    SELECT limites INTO tenant_limits FROM tenants WHERE id = tenant_uuid;
    
    IF tenant_limits IS NULL THEN
        RETURN FALSE;
    END IF;
    
    features := tenant_limits->'features';
    
    RETURN features ? feature_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar auditoria
CREATE OR REPLACE FUNCTION log_tenant_audit(
    p_tenant_id UUID,
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO tenant_audit_log (
        tenant_id,
        user_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        ip_address,
        user_agent
    ) VALUES (
        p_tenant_id,
        auth.uid(),
        p_action,
        p_resource_type,
        p_resource_id,
        p_old_values,
        p_new_values,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Log de auditoria não deve falhar a operação principal
        NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para aceitar convite
CREATE OR REPLACE FUNCTION accept_tenant_invite(invite_token TEXT)
RETURNS JSONB AS $$
DECLARE
    invite_record RECORD;
    result JSONB;
BEGIN
    -- Busca o convite válido
    SELECT * INTO invite_record
    FROM tenant_invites
    WHERE token = invite_token
    AND status = 'pendente'
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Convite inválido ou expirado'
        );
    END IF;
    
    -- Verifica se o usuário atual tem o mesmo email do convite
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND email = invite_record.email
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Email do usuário não confere com o convite'
        );
    END IF;
    
    -- Verifica se o usuário já pertence ao tenant
    IF EXISTS (
        SELECT 1 FROM tenant_users
        WHERE tenant_id = invite_record.tenant_id
        AND user_id = auth.uid()
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Usuário já pertence a este tenant'
        );
    END IF;
    
    -- Verifica limites do tenant
    IF NOT validate_tenant_limits(invite_record.tenant_id, 'usuarios') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Limite de usuários do plano atingido'
        );
    END IF;
    
    -- Adiciona o usuário ao tenant
    INSERT INTO tenant_users (
        tenant_id,
        user_id,
        role,
        status,
        permissoes
    ) VALUES (
        invite_record.tenant_id,
        auth.uid(),
        invite_record.role,
        'ativo',
        CASE invite_record.role
            WHEN 'admin' THEN '{
                "clientes": ["create", "read", "update", "delete"],
                "veiculos": ["create", "read", "update", "delete"],
                "ordens_servico": ["create", "read", "update", "delete"],
                "estoque": ["create", "read", "update", "delete"],
                "financeiro": ["create", "read", "update", "delete"],
                "relatorios": ["read"],
                "configuracoes": ["create", "read", "update", "delete"]
            }'::JSONB
            WHEN 'gerente' THEN '{
                "clientes": ["create", "read", "update", "delete"],
                "veiculos": ["create", "read", "update", "delete"],
                "ordens_servico": ["create", "read", "update", "delete"],
                "estoque": ["create", "read", "update"],
                "financeiro": ["read", "update"],
                "relatorios": ["read"],
                "configuracoes": ["read", "update"]
            }'::JSONB
            ELSE '{
                "clientes": ["create", "read", "update"],
                "veiculos": ["create", "read", "update"],
                "ordens_servico": ["create", "read", "update"],
                "estoque": ["read"],
                "financeiro": ["read"],
                "relatorios": ["read"],
                "configuracoes": []
            }'::JSONB
        END
    );
    
    -- Atualiza o status do convite
    UPDATE tenant_invites
    SET status = 'aceito',
        accepted_at = NOW()
    WHERE id = invite_record.id;
    
    -- Log de auditoria
    PERFORM log_tenant_audit(
        invite_record.tenant_id,
        'accept_invite',
        'tenant_user',
        auth.uid(),
        NULL,
        jsonb_build_object('role', invite_record.role, 'email', invite_record.email)
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'tenant_id', invite_record.tenant_id,
        'role', invite_record.role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar convite
CREATE OR REPLACE FUNCTION create_tenant_invite(
    p_tenant_id UUID,
    p_email TEXT,
    p_role TEXT DEFAULT 'funcionario'
)
RETURNS JSONB AS $$
DECLARE
    invite_token TEXT;
    result JSONB;
BEGIN
    -- Verifica se o usuário atual pode criar convites
    IF NOT EXISTS (
        SELECT 1 FROM tenant_users
        WHERE tenant_id = p_tenant_id
        AND user_id = auth.uid()
        AND role IN ('admin', 'gerente')
        AND status = 'ativo'
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Sem permissão para criar convites'
        );
    END IF;
    
    -- Verifica limites do tenant
    IF NOT validate_tenant_limits(p_tenant_id, 'usuarios') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Limite de usuários do plano atingido'
        );
    END IF;
    
    -- Verifica se já existe convite pendente para este email
    IF EXISTS (
        SELECT 1 FROM tenant_invites
        WHERE tenant_id = p_tenant_id
        AND email = p_email
        AND status = 'pendente'
        AND expires_at > NOW()
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Já existe convite pendente para este email'
        );
    END IF;
    
    -- Verifica se o usuário já pertence ao tenant
    IF EXISTS (
        SELECT 1 FROM tenant_users tu
        JOIN auth.users u ON u.id = tu.user_id
        WHERE tu.tenant_id = p_tenant_id
        AND u.email = p_email
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Usuário já pertence a este tenant'
        );
    END IF;
    
    -- Gera token único
    invite_token := encode(gen_random_bytes(32), 'hex');
    
    -- Cria o convite
    INSERT INTO tenant_invites (
        tenant_id,
        email,
        role,
        token,
        invited_by
    ) VALUES (
        p_tenant_id,
        p_email,
        p_role,
        invite_token,
        auth.uid()
    );
    
    -- Log de auditoria
    PERFORM log_tenant_audit(
        p_tenant_id,
        'create_invite',
        'tenant_invite',
        NULL,
        NULL,
        jsonb_build_object('email', p_email, 'role', p_role)
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'token', invite_token,
        'expires_at', (NOW() + INTERVAL '7 days')::TEXT
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para trocar de tenant (contexto)
CREATE OR REPLACE FUNCTION switch_tenant_context(p_tenant_id UUID)
RETURNS JSONB AS $$
BEGIN
    -- Verifica se o usuário pertence ao tenant
    IF NOT EXISTS (
        SELECT 1 FROM tenant_users
        WHERE tenant_id = p_tenant_id
        AND user_id = auth.uid()
        AND status = 'ativo'
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Usuário não pertence a este tenant'
        );
    END IF;
    
    -- Define o tenant atual na sessão
    PERFORM set_config('app.current_tenant_id', p_tenant_id::TEXT, true);
    
    -- Log de auditoria
    PERFORM log_tenant_audit(
        p_tenant_id,
        'switch_context',
        'tenant',
        p_tenant_id,
        NULL,
        NULL
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'tenant_id', p_tenant_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter informações do tenant atual
CREATE OR REPLACE FUNCTION get_current_tenant_info()
RETURNS JSONB AS $$
DECLARE
    tenant_info RECORD;
    user_info RECORD;
BEGIN
    -- Busca informações do tenant
    SELECT t.*, tu.role, tu.permissoes
    INTO tenant_info
    FROM tenants t
    JOIN tenant_users tu ON tu.tenant_id = t.id
    WHERE t.id = get_current_tenant_id()
    AND tu.user_id = auth.uid()
    AND tu.status = 'ativo';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Tenant não encontrado'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'tenant', row_to_json(tenant_info)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers de auditoria para tabelas principais

-- Trigger para clientes
CREATE OR REPLACE FUNCTION audit_clientes_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_tenant_audit(
            NEW.tenant_id,
            'create',
            'cliente',
            NEW.id,
            NULL,
            row_to_json(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_tenant_audit(
            NEW.tenant_id,
            'update',
            'cliente',
            NEW.id,
            row_to_json(OLD),
            row_to_json(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_tenant_audit(
            OLD.tenant_id,
            'delete',
            'cliente',
            OLD.id,
            row_to_json(OLD),
            NULL
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_clientes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON clientes
    FOR EACH ROW EXECUTE FUNCTION audit_clientes_changes();

-- Trigger para ordens de serviço
CREATE OR REPLACE FUNCTION audit_ordens_servico_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_tenant_audit(
            NEW.tenant_id,
            'create',
            'ordem_servico',
            NEW.id,
            NULL,
            row_to_json(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_tenant_audit(
            NEW.tenant_id,
            'update',
            'ordem_servico',
            NEW.id,
            row_to_json(OLD),
            row_to_json(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_tenant_audit(
            OLD.tenant_id,
            'delete',
            'ordem_servico',
            OLD.id,
            row_to_json(OLD),
            NULL
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_ordens_servico_trigger
    AFTER INSERT OR UPDATE OR DELETE ON ordens_servico
    FOR EACH ROW EXECUTE FUNCTION audit_ordens_servico_changes();

-- Trigger para validar limites antes de inserir
CREATE OR REPLACE FUNCTION validate_tenant_limits_trigger()
RETURNS TRIGGER AS $$
DECLARE
    resource_type TEXT;
BEGIN
    -- Determina o tipo de recurso baseado na tabela
    CASE TG_TABLE_NAME
        WHEN 'clientes' THEN resource_type := 'clientes';
        WHEN 'veiculos' THEN resource_type := 'veiculos';
        WHEN 'ordens_servico' THEN resource_type := 'ordens_mes';
        WHEN 'tenant_users' THEN resource_type := 'usuarios';
        ELSE RETURN NEW;
    END CASE;
    
    -- Valida limites apenas para INSERT
    IF TG_OP = 'INSERT' THEN
        IF NOT validate_tenant_limits(NEW.tenant_id, resource_type) THEN
            RAISE EXCEPTION 'Limite do plano atingido para %', resource_type;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de validação de limites
CREATE TRIGGER validate_clientes_limits_trigger
    BEFORE INSERT ON clientes
    FOR EACH ROW EXECUTE FUNCTION validate_tenant_limits_trigger();

CREATE TRIGGER validate_veiculos_limits_trigger
    BEFORE INSERT ON veiculos
    FOR EACH ROW EXECUTE FUNCTION validate_tenant_limits_trigger();

CREATE TRIGGER validate_ordens_servico_limits_trigger
    BEFORE INSERT ON ordens_servico
    FOR EACH ROW EXECUTE FUNCTION validate_tenant_limits_trigger();

CREATE TRIGGER validate_tenant_users_limits_trigger
    BEFORE INSERT ON tenant_users
    FOR EACH ROW EXECUTE FUNCTION validate_tenant_limits_trigger();

-- Trigger para auto-definir tenant_id baseado no contexto atual
CREATE OR REPLACE FUNCTION auto_set_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Se tenant_id não foi definido, usa o contexto atual
    IF NEW.tenant_id IS NULL THEN
        NEW.tenant_id := get_current_tenant_id();
    END IF;
    
    -- Verifica se o tenant_id é válido para o usuário
    IF NOT user_belongs_to_tenant(auth.uid(), NEW.tenant_id) THEN
        RAISE EXCEPTION 'Usuário não pertence ao tenant especificado';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de auto-definição de tenant_id
CREATE TRIGGER auto_set_tenant_id_clientes
    BEFORE INSERT ON clientes
    FOR EACH ROW EXECUTE FUNCTION auto_set_tenant_id();

CREATE TRIGGER auto_set_tenant_id_veiculos
    BEFORE INSERT ON veiculos
    FOR EACH ROW EXECUTE FUNCTION auto_set_tenant_id();

CREATE TRIGGER auto_set_tenant_id_ordens_servico
    BEFORE INSERT ON ordens_servico
    FOR EACH ROW EXECUTE FUNCTION auto_set_tenant_id();

CREATE TRIGGER auto_set_tenant_id_tipos_servicos
    BEFORE INSERT ON tipos_servicos
    FOR EACH ROW EXECUTE FUNCTION auto_set_tenant_id();

CREATE TRIGGER auto_set_tenant_id_itens_servico
    BEFORE INSERT ON itens_servico
    FOR EACH ROW EXECUTE FUNCTION auto_set_tenant_id();

-- Views para facilitar consultas

-- View para usuários do tenant atual
CREATE OR REPLACE VIEW current_tenant_users AS
SELECT 
    tu.*,
    u.email,
    p.nome as nome_completo
FROM tenant_users tu
JOIN auth.users u ON u.id = tu.user_id
LEFT JOIN profiles p ON p.id = tu.user_id AND p.tenant_id = tu.tenant_id
WHERE tu.tenant_id = get_current_tenant_id()
AND tu.status = 'ativo';

-- View para estatísticas do tenant
CREATE OR REPLACE VIEW tenant_statistics AS
SELECT 
    t.id as tenant_id,
    t.nome as tenant_nome,
    t.plano,
    (
        SELECT COUNT(*) FROM tenant_users tu 
        WHERE tu.tenant_id = t.id AND tu.status = 'ativo'
    ) as total_usuarios,
    (
        SELECT COUNT(*) FROM clientes c 
        WHERE c.tenant_id = t.id
    ) as total_clientes,
    (
        SELECT COUNT(*) FROM veiculos v 
        WHERE v.tenant_id = t.id
    ) as total_veiculos,
    (
        SELECT COUNT(*) FROM ordens_servico os 
        WHERE os.tenant_id = t.id
        AND DATE_TRUNC('month', os.created_at) = DATE_TRUNC('month', NOW())
    ) as ordens_mes_atual,
    (
        SELECT COUNT(*) FROM ordens_servico os 
        WHERE os.tenant_id = t.id
        AND os.status = 'em_andamento'
    ) as ordens_em_andamento,
    t.limites
FROM tenants t
WHERE t.id = get_current_tenant_id();

-- Comentários finais
-- Esta migração adiciona:
-- 1. Funções de validação de limites e features
-- 2. Sistema completo de convites
-- 3. Auditoria automática de mudanças
-- 4. Triggers para validação e auto-definição de tenant_id
-- 5. Views para facilitar consultas
-- 6. Funções para troca de contexto de tenant

-- O sistema agora está pronto para:
-- - Validar limites automaticamente
-- - Registrar todas as ações importantes
-- - Gerenciar convites de usuários
-- - Trabalhar com múltiplos tenants por usuário
-- - Manter isolamento completo de dados