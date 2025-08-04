-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  cargo TEXT DEFAULT 'funcionario',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Usuários podem ver seu próprio perfil"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seu próprio perfil"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Tabela de clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf_cnpj TEXT UNIQUE,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  observacoes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela clientes
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para clientes
CREATE POLICY "Usuários podem ver seus clientes"
ON public.clientes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar clientes"
ON public.clientes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus clientes"
ON public.clientes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus clientes"
ON public.clientes
FOR DELETE
USING (auth.uid() = user_id);

-- Tabela de veículos
CREATE TABLE public.veiculos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  ano INTEGER,
  placa TEXT UNIQUE,
  cor TEXT,
  combustivel TEXT,
  chassi TEXT,
  km_atual INTEGER DEFAULT 0,
  observacoes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela veiculos
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para veiculos
CREATE POLICY "Usuários podem ver seus veículos"
ON public.veiculos
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar veículos"
ON public.veiculos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus veículos"
ON public.veiculos
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus veículos"
ON public.veiculos
FOR DELETE
USING (auth.uid() = user_id);

-- Tabela de tipos de serviços
CREATE TABLE public.tipos_servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_base DECIMAL(10,2) DEFAULT 0,
  tempo_estimado INTEGER DEFAULT 60, -- em minutos
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela tipos_servicos
ALTER TABLE public.tipos_servicos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tipos_servicos
CREATE POLICY "Usuários podem ver seus tipos de serviços"
ON public.tipos_servicos
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar tipos de serviços"
ON public.tipos_servicos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus tipos de serviços"
ON public.tipos_servicos
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus tipos de serviços"
ON public.tipos_servicos
FOR DELETE
USING (auth.uid() = user_id);

-- Tabela de ordens de serviço
CREATE TABLE public.ordens_servico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_os TEXT NOT NULL UNIQUE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  veiculo_id UUID NOT NULL REFERENCES public.veiculos(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'em_andamento', 'concluido', 'cancelado')),
  data_entrada TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_saida TIMESTAMP WITH TIME ZONE,
  km_entrada INTEGER,
  problema_relatado TEXT,
  diagnostico TEXT,
  observacoes TEXT,
  valor_total DECIMAL(10,2) DEFAULT 0,
  desconto DECIMAL(10,2) DEFAULT 0,
  valor_final DECIMAL(10,2) DEFAULT 0,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela ordens_servico
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para ordens_servico
CREATE POLICY "Usuários podem ver suas ordens de serviço"
ON public.ordens_servico
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar ordens de serviço"
ON public.ordens_servico
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas ordens de serviço"
ON public.ordens_servico
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas ordens de serviço"
ON public.ordens_servico
FOR DELETE
USING (auth.uid() = user_id);

-- Tabela de itens de serviço (serviços realizados em cada OS)
CREATE TABLE public.itens_servico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ordem_servico_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  tipo_servico_id UUID REFERENCES public.tipos_servicos(id),
  descricao TEXT NOT NULL,
  quantidade DECIMAL(10,2) DEFAULT 1,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela itens_servico
ALTER TABLE public.itens_servico ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para itens_servico
CREATE POLICY "Usuários podem ver seus itens de serviço"
ON public.itens_servico
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar itens de serviço"
ON public.itens_servico
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus itens de serviço"
ON public.itens_servico
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus itens de serviço"
ON public.itens_servico
FOR DELETE
USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_veiculos_updated_at
  BEFORE UPDATE ON public.veiculos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tipos_servicos_updated_at
  BEFORE UPDATE ON public.tipos_servicos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ordens_servico_updated_at
  BEFORE UPDATE ON public.ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_itens_servico_updated_at
  BEFORE UPDATE ON public.itens_servico
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Índices para melhor performance
CREATE INDEX idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX idx_veiculos_user_id ON public.veiculos(user_id);
CREATE INDEX idx_veiculos_cliente_id ON public.veiculos(cliente_id);
CREATE INDEX idx_ordens_servico_user_id ON public.ordens_servico(user_id);
CREATE INDEX idx_ordens_servico_cliente_id ON public.ordens_servico(cliente_id);
CREATE INDEX idx_ordens_servico_status ON public.ordens_servico(status);
CREATE INDEX idx_itens_servico_ordem_id ON public.itens_servico(ordem_servico_id);

-- Função para gerar número de OS automaticamente
CREATE OR REPLACE FUNCTION public.generate_os_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  formatted_number TEXT;
BEGIN
  -- Busca o próximo número baseado no ano atual
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_os FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.ordens_servico
  WHERE numero_os LIKE TO_CHAR(CURRENT_DATE, 'YYYY') || '%';
  
  -- Formata o número: YYYY0001, YYYY0002, etc.
  formatted_number := TO_CHAR(CURRENT_DATE, 'YYYY') || LPAD(next_number::TEXT, 4, '0');
  
  NEW.numero_os := formatted_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar número de OS automaticamente
CREATE TRIGGER generate_os_number_trigger
  BEFORE INSERT ON public.ordens_servico
  FOR EACH ROW
  WHEN (NEW.numero_os IS NULL OR NEW.numero_os = '')
  EXECUTE FUNCTION public.generate_os_number();