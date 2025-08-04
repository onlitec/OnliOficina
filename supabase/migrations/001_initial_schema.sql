-- Criação das tabelas principais do sistema de oficina

-- Tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT,
    cargo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    cpf_cnpj TEXT,
    telefone TEXT,
    email TEXT,
    endereco TEXT,
    cidade TEXT,
    estado TEXT,
    cep TEXT,
    codigo TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de veículos
CREATE TABLE IF NOT EXISTS veiculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    ano INTEGER,
    placa TEXT,
    chassi TEXT,
    cor TEXT,
    combustivel TEXT,
    km_atual INTEGER,
    codigo TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de tipos de serviços
CREATE TABLE IF NOT EXISTS tipos_servicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    preco_base DECIMAL(10,2),
    tempo_estimado INTEGER, -- em minutos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de ordens de serviço
CREATE TABLE IF NOT EXISTS ordens_servico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    veiculo_id UUID NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
    numero_os TEXT NOT NULL,
    codigo TEXT,
    data_entrada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_saida TIMESTAMP WITH TIME ZONE,
    km_entrada INTEGER,
    problema_relatado TEXT,
    diagnostico TEXT,
    observacoes TEXT,
    status TEXT DEFAULT 'aberta',
    valor_total DECIMAL(10,2),
    desconto DECIMAL(10,2),
    valor_final DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens de serviço
CREATE TABLE IF NOT EXISTS itens_servico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ordem_servico_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
    tipo_servico_id UUID REFERENCES tipos_servicos(id),
    descricao TEXT NOT NULL,
    quantidade INTEGER DEFAULT 1,
    valor_unitario DECIMAL(10,2) NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_user_id ON veiculos(user_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_cliente_id ON veiculos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_user_id ON ordens_servico(user_id);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_cliente_id ON ordens_servico(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ordens_servico_veiculo_id ON ordens_servico(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_itens_servico_ordem_servico_id ON itens_servico(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_tipos_servicos_user_id ON tipos_servicos(user_id);

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_veiculos_updated_at BEFORE UPDATE ON veiculos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tipos_servicos_updated_at BEFORE UPDATE ON tipos_servicos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ordens_servico_updated_at BEFORE UPDATE ON ordens_servico FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_itens_servico_updated_at BEFORE UPDATE ON itens_servico FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_servico ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para clientes
CREATE POLICY "Users can view own clientes" ON clientes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clientes" ON clientes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clientes" ON clientes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clientes" ON clientes FOR DELETE USING (auth.uid() = user_id);

-- Políticas para veículos
CREATE POLICY "Users can view own veiculos" ON veiculos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own veiculos" ON veiculos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own veiculos" ON veiculos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own veiculos" ON veiculos FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tipos_servicos
CREATE POLICY "Users can view own tipos_servicos" ON tipos_servicos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tipos_servicos" ON tipos_servicos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tipos_servicos" ON tipos_servicos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tipos_servicos" ON tipos_servicos FOR DELETE USING (auth.uid() = user_id);

-- Políticas para ordens_servico
CREATE POLICY "Users can view own ordens_servico" ON ordens_servico FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ordens_servico" ON ordens_servico FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ordens_servico" ON ordens_servico FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ordens_servico" ON ordens_servico FOR DELETE USING (auth.uid() = user_id);

-- Políticas para itens_servico
CREATE POLICY "Users can view own itens_servico" ON itens_servico FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own itens_servico" ON itens_servico FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own itens_servico" ON itens_servico FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own itens_servico" ON itens_servico FOR DELETE USING (auth.uid() = user_id);