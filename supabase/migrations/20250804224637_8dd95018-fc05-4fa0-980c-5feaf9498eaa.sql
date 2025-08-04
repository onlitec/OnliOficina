-- Adicionar campos de código às tabelas existentes
ALTER TABLE public.clientes ADD COLUMN codigo TEXT;
ALTER TABLE public.veiculos ADD COLUMN codigo TEXT;
ALTER TABLE public.ordens_servico ADD COLUMN codigo TEXT;

-- Criar bucket de storage para fotos dos veículos
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle-photos', 'vehicle-photos', true);

-- Função para gerar código de cliente (CLI-XXXXX) com reset anual
CREATE OR REPLACE FUNCTION public.generate_cliente_codigo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  next_number INTEGER;
  formatted_code TEXT;
  current_year TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Busca o próximo número baseado no ano atual
  SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 9) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.clientes
  WHERE codigo LIKE 'CLI-' || current_year || '%';
  
  -- Formata o código: CLI-YYYY-XXXXX
  formatted_code := 'CLI-' || current_year || '-' || LPAD(next_number::TEXT, 5, '0');
  
  NEW.codigo := formatted_code;
  RETURN NEW;
END;
$function$;

-- Função para gerar código de veículo (VEI-XXXXX) com reset anual
CREATE OR REPLACE FUNCTION public.generate_veiculo_codigo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  next_number INTEGER;
  formatted_code TEXT;
  current_year TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Busca o próximo número baseado no ano atual
  SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 9) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.veiculos
  WHERE codigo LIKE 'VEI-' || current_year || '%';
  
  -- Formata o código: VEI-YYYY-XXXXX
  formatted_code := 'VEI-' || current_year || '-' || LPAD(next_number::TEXT, 5, '0');
  
  NEW.codigo := formatted_code;
  RETURN NEW;
END;
$function$;

-- Função para gerar código de ordem de serviço (OS-XXXX) com reset anual
CREATE OR REPLACE FUNCTION public.generate_ordem_codigo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  next_number INTEGER;
  formatted_code TEXT;
  current_year TEXT;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Busca o próximo número baseado no ano atual
  SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 8) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.ordens_servico
  WHERE codigo LIKE 'OS-' || current_year || '%';
  
  -- Formata o código: OS-YYYY-XXXX
  formatted_code := 'OS-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  
  NEW.codigo := formatted_code;
  RETURN NEW;
END;
$function$;

-- Criar triggers para gerar códigos automaticamente
CREATE TRIGGER generate_cliente_codigo_trigger
BEFORE INSERT ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.generate_cliente_codigo();

CREATE TRIGGER generate_veiculo_codigo_trigger
BEFORE INSERT ON public.veiculos
FOR EACH ROW
EXECUTE FUNCTION public.generate_veiculo_codigo();

CREATE TRIGGER generate_ordem_codigo_trigger
BEFORE INSERT ON public.ordens_servico
FOR EACH ROW
EXECUTE FUNCTION public.generate_ordem_codigo();

-- Políticas de storage para fotos dos veículos
CREATE POLICY "Usuários podem visualizar fotos dos veículos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'vehicle-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem upload fotos dos veículos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'vehicle-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem atualizar fotos dos veículos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'vehicle-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem deletar fotos dos veículos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'vehicle-photos' AND auth.uid()::text = (storage.foldername(name))[1]);