-- Migração para implementar sistema de estoque, peças, insumos e ferramentas

-- Tabela de categorias de peças
CREATE TABLE IF NOT EXISTS categorias_pecas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    codigo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    cnpj TEXT,
    telefone TEXT,
    email TEXT,
    endereco TEXT,
    cidade TEXT,
    estado TEXT,
    cep TEXT,
    contato_responsavel TEXT,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de peças/produtos
CREATE TABLE IF NOT EXISTS pecas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES categorias_pecas(id),
    fornecedor_id UUID REFERENCES fornecedores(id),
    codigo TEXT NOT NULL,
    codigo_fabricante TEXT,
    codigo_original TEXT,
    nome TEXT NOT NULL,
    descricao TEXT,
    marca TEXT,
    modelo_aplicacao TEXT,
    unidade_medida TEXT DEFAULT 'UN',
    localizacao_estoque TEXT,
    quantidade_atual INTEGER DEFAULT 0,
    quantidade_minima INTEGER DEFAULT 0,
    quantidade_maxima INTEGER DEFAULT 0,
    preco_custo DECIMAL(10,2),
    preco_venda DECIMAL(10,2),
    margem_lucro DECIMAL(5,2),
    peso DECIMAL(8,3),
    dimensoes TEXT,
    ativo BOOLEAN DEFAULT true,
    foto_url TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de movimentações de estoque
CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    peca_id UUID NOT NULL REFERENCES pecas(id) ON DELETE CASCADE,
    ordem_servico_id UUID REFERENCES ordens_servico(id),
    tipo_movimentacao TEXT NOT NULL CHECK (tipo_movimentacao IN ('entrada', 'saida', 'ajuste', 'transferencia')),
    quantidade INTEGER NOT NULL,
    quantidade_anterior INTEGER NOT NULL,
    quantidade_atual INTEGER NOT NULL,
    valor_unitario DECIMAL(10,2),
    valor_total DECIMAL(10,2),
    motivo TEXT,
    documento_referencia TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de ferramentas
CREATE TABLE IF NOT EXISTS ferramentas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    marca TEXT,
    modelo TEXT,
    numero_serie TEXT,
    data_aquisicao DATE,
    valor_aquisicao DECIMAL(10,2),
    estado_conservacao TEXT CHECK (estado_conservacao IN ('novo', 'bom', 'regular', 'ruim', 'inutilizado')),
    localizacao TEXT,
    responsavel_atual TEXT,
    disponivel BOOLEAN DEFAULT true,
    requer_manutencao BOOLEAN DEFAULT false,
    proxima_manutencao DATE,
    intervalo_manutencao_dias INTEGER,
    foto_url TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de empréstimos de ferramentas
CREATE TABLE IF NOT EXISTS emprestimos_ferramentas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ferramenta_id UUID NOT NULL REFERENCES ferramentas(id) ON DELETE CASCADE,
    responsavel_emprestimo TEXT NOT NULL,
    data_emprestimo TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_devolucao_prevista DATE,
    data_devolucao_real TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'emprestado' CHECK (status IN ('emprestado', 'devolvido', 'atrasado')),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de manutenções de ferramentas
CREATE TABLE IF NOT EXISTS manutencoes_ferramentas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ferramenta_id UUID NOT NULL REFERENCES ferramentas(id) ON DELETE CASCADE,
    tipo_manutencao TEXT NOT NULL CHECK (tipo_manutencao IN ('preventiva', 'corretiva', 'calibracao')),
    data_manutencao DATE NOT NULL,
    descricao TEXT NOT NULL,
    responsavel TEXT,
    custo DECIMAL(10,2),
    fornecedor_servico TEXT,
    proxima_manutencao DATE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de contas a receber
CREATE TABLE IF NOT EXISTS contas_receber (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ordem_servico_id UUID REFERENCES ordens_servico(id),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    numero_documento TEXT,
    descricao TEXT NOT NULL,
    valor_original DECIMAL(10,2) NOT NULL,
    valor_pago DECIMAL(10,2) DEFAULT 0,
    valor_pendente DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')),
    forma_pagamento TEXT,
    juros DECIMAL(10,2) DEFAULT 0,
    multa DECIMAL(10,2) DEFAULT 0,
    desconto DECIMAL(10,2) DEFAULT 0,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de contas a pagar
CREATE TABLE IF NOT EXISTS contas_pagar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fornecedor_id UUID REFERENCES fornecedores(id),
    numero_documento TEXT,
    descricao TEXT NOT NULL,
    categoria_despesa TEXT,
    valor_original DECIMAL(10,2) NOT NULL,
    valor_pago DECIMAL(10,2) DEFAULT 0,
    valor_pendente DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')),
    forma_pagamento TEXT,
    juros DECIMAL(10,2) DEFAULT 0,
    multa DECIMAL(10,2) DEFAULT 0,
    desconto DECIMAL(10,2) DEFAULT 0,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pagamentos/recebimentos
CREATE TABLE IF NOT EXISTS pagamentos_recebimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conta_receber_id UUID REFERENCES contas_receber(id),
    conta_pagar_id UUID REFERENCES contas_pagar(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('recebimento', 'pagamento')),
    valor DECIMAL(10,2) NOT NULL,
    data_operacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    forma_pagamento TEXT NOT NULL,
    numero_documento TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de fluxo de caixa
CREATE TABLE IF NOT EXISTS fluxo_caixa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pagamento_recebimento_id UUID REFERENCES pagamentos_recebimentos(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    categoria TEXT NOT NULL,
    descricao TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_operacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    forma_pagamento TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações da empresa
CREATE TABLE IF NOT EXISTS configuracao_empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_empresa TEXT NOT NULL,
    cnpj TEXT,
    endereco TEXT,
    cidade TEXT,
    estado TEXT,
    cep TEXT,
    telefone TEXT,
    email TEXT,
    site TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações de email
CREATE TABLE IF NOT EXISTS configuracao_email (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    servidor_smtp TEXT,
    porta INTEGER,
    usuario TEXT,
    senha TEXT,
    usar_ssl BOOLEAN DEFAULT true,
    email_remetente TEXT,
    nome_remetente TEXT,
    ativo BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações de notificações
CREATE TABLE IF NOT EXISTS configuracao_notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notificar_estoque_baixo BOOLEAN DEFAULT true,
    notificar_vencimento_contas BOOLEAN DEFAULT true,
    notificar_manutencao_ferramentas BOOLEAN DEFAULT true,
    notificar_os_vencidas BOOLEAN DEFAULT true,
    dias_antecedencia_vencimento INTEGER DEFAULT 3,
    email_notificacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS configuracao_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chave TEXT NOT NULL,
    valor TEXT,
    descricao TEXT,
    tipo TEXT DEFAULT 'string' CHECK (tipo IN ('string', 'number', 'boolean', 'json')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Atualizar tabela de itens_servico para incluir peças
ALTER TABLE itens_servico ADD COLUMN IF NOT EXISTS peca_id UUID REFERENCES pecas(id);
ALTER TABLE itens_servico ADD COLUMN IF NOT EXISTS tipo_item TEXT DEFAULT 'servico' CHECK (tipo_item IN ('servico', 'peca'));

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_categorias_pecas_user_id ON categorias_pecas(user_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_user_id ON fornecedores(user_id);
CREATE INDEX IF NOT EXISTS idx_pecas_user_id ON pecas(user_id);
CREATE INDEX IF NOT EXISTS idx_pecas_categoria_id ON pecas(categoria_id);
CREATE INDEX IF NOT EXISTS idx_pecas_fornecedor_id ON pecas(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_pecas_codigo ON pecas(codigo);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_peca_id ON movimentacoes_estoque(peca_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_user_id ON movimentacoes_estoque(user_id);
CREATE INDEX IF NOT EXISTS idx_ferramentas_user_id ON ferramentas(user_id);
CREATE INDEX IF NOT EXISTS idx_ferramentas_codigo ON ferramentas(codigo);
CREATE INDEX IF NOT EXISTS idx_emprestimos_ferramentas_ferramenta_id ON emprestimos_ferramentas(ferramenta_id);
CREATE INDEX IF NOT EXISTS idx_manutencoes_ferramentas_ferramenta_id ON manutencoes_ferramentas(ferramenta_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_cliente_id ON contas_receber(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_user_id ON contas_receber(user_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_fornecedor_id ON contas_pagar(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_user_id ON contas_pagar(user_id);
CREATE INDEX IF NOT EXISTS idx_fluxo_caixa_user_id ON fluxo_caixa(user_id);
CREATE INDEX IF NOT EXISTS idx_itens_servico_peca_id ON itens_servico(peca_id);

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_categorias_pecas_updated_at BEFORE UPDATE ON categorias_pecas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON fornecedores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pecas_updated_at BEFORE UPDATE ON pecas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ferramentas_updated_at BEFORE UPDATE ON ferramentas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_emprestimos_ferramentas_updated_at BEFORE UPDATE ON emprestimos_ferramentas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_manutencoes_ferramentas_updated_at BEFORE UPDATE ON manutencoes_ferramentas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contas_receber_updated_at BEFORE UPDATE ON contas_receber FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contas_pagar_updated_at BEFORE UPDATE ON contas_pagar FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracao_empresa_updated_at BEFORE UPDATE ON configuracao_empresa FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracao_email_updated_at BEFORE UPDATE ON configuracao_email FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracao_notificacoes_updated_at BEFORE UPDATE ON configuracao_notificacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracao_sistema_updated_at BEFORE UPDATE ON configuracao_sistema FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar estoque automaticamente
CREATE OR REPLACE FUNCTION atualizar_estoque_peca()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar quantidade atual da peça
    UPDATE pecas 
    SET quantidade_atual = NEW.quantidade_atual
    WHERE id = NEW.peca_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_estoque_peca
    AFTER INSERT ON movimentacoes_estoque
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_estoque_peca();

-- Trigger para atualizar status de ferramentas emprestadas
CREATE OR REPLACE FUNCTION atualizar_status_ferramenta()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'emprestado' THEN
        UPDATE ferramentas 
        SET disponivel = false, responsavel_atual = NEW.responsavel_emprestimo
        WHERE id = NEW.ferramenta_id;
    ELSIF NEW.status = 'devolvido' THEN
        UPDATE ferramentas 
        SET disponivel = true, responsavel_atual = NULL
        WHERE id = NEW.ferramenta_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_status_ferramenta
    AFTER INSERT OR UPDATE ON emprestimos_ferramentas
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_status_ferramenta();

-- Políticas RLS (Row Level Security)
ALTER TABLE categorias_pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE ferramentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE emprestimos_ferramentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE manutencoes_ferramentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos_recebimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fluxo_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracao_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracao_email ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracao_notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracao_sistema ENABLE ROW LEVEL SECURITY;

-- Políticas para categorias_pecas
CREATE POLICY "Users can view own categorias_pecas" ON categorias_pecas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categorias_pecas" ON categorias_pecas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categorias_pecas" ON categorias_pecas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categorias_pecas" ON categorias_pecas FOR DELETE USING (auth.uid() = user_id);

-- Políticas para fornecedores
CREATE POLICY "Users can view own fornecedores" ON fornecedores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fornecedores" ON fornecedores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fornecedores" ON fornecedores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fornecedores" ON fornecedores FOR DELETE USING (auth.uid() = user_id);

-- Políticas para pecas
CREATE POLICY "Users can view own pecas" ON pecas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pecas" ON pecas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pecas" ON pecas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pecas" ON pecas FOR DELETE USING (auth.uid() = user_id);

-- Políticas para movimentacoes_estoque
CREATE POLICY "Users can view own movimentacoes_estoque" ON movimentacoes_estoque FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own movimentacoes_estoque" ON movimentacoes_estoque FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para ferramentas
CREATE POLICY "Users can view own ferramentas" ON ferramentas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ferramentas" ON ferramentas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ferramentas" ON ferramentas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ferramentas" ON ferramentas FOR DELETE USING (auth.uid() = user_id);

-- Políticas para emprestimos_ferramentas
CREATE POLICY "Users can view own emprestimos_ferramentas" ON emprestimos_ferramentas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own emprestimos_ferramentas" ON emprestimos_ferramentas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own emprestimos_ferramentas" ON emprestimos_ferramentas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own emprestimos_ferramentas" ON emprestimos_ferramentas FOR DELETE USING (auth.uid() = user_id);

-- Políticas para manutencoes_ferramentas
CREATE POLICY "Users can view own manutencoes_ferramentas" ON manutencoes_ferramentas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own manutencoes_ferramentas" ON manutencoes_ferramentas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own manutencoes_ferramentas" ON manutencoes_ferramentas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own manutencoes_ferramentas" ON manutencoes_ferramentas FOR DELETE USING (auth.uid() = user_id);

-- Políticas para contas_receber
CREATE POLICY "Users can view own contas_receber" ON contas_receber FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contas_receber" ON contas_receber FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contas_receber" ON contas_receber FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contas_receber" ON contas_receber FOR DELETE USING (auth.uid() = user_id);

-- Políticas para contas_pagar
CREATE POLICY "Users can view own contas_pagar" ON contas_pagar FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contas_pagar" ON contas_pagar FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contas_pagar" ON contas_pagar FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contas_pagar" ON contas_pagar FOR DELETE USING (auth.uid() = user_id);

-- Políticas para pagamentos_recebimentos
CREATE POLICY "Users can view own pagamentos_recebimentos" ON pagamentos_recebimentos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pagamentos_recebimentos" ON pagamentos_recebimentos FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para fluxo_caixa
CREATE POLICY "Users can view own fluxo_caixa" ON fluxo_caixa FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fluxo_caixa" ON fluxo_caixa FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para configuracao_empresa
CREATE POLICY "Users can view own configuracao_empresa" ON configuracao_empresa FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own configuracao_empresa" ON configuracao_empresa FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own configuracao_empresa" ON configuracao_empresa FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para configuracao_email
CREATE POLICY "Users can view own configuracao_email" ON configuracao_email FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own configuracao_email" ON configuracao_email FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own configuracao_email" ON configuracao_email FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para configuracao_notificacoes
CREATE POLICY "Users can view own configuracao_notificacoes" ON configuracao_notificacoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own configuracao_notificacoes" ON configuracao_notificacoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own configuracao_notificacoes" ON configuracao_notificacoes FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para configuracao_sistema
CREATE POLICY "Users can view own configuracao_sistema" ON configuracao_sistema FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own configuracao_sistema" ON configuracao_sistema FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own configuracao_sistema" ON configuracao_sistema FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own configuracao_sistema" ON configuracao_sistema FOR DELETE USING (auth.uid() = user_id);

-- Configurações padrão do sistema serão inseridas via aplicação após autenticação