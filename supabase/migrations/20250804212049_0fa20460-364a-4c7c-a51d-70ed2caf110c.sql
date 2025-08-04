-- Corrigir search_path para a função update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Corrigir search_path para a função generate_os_number
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';