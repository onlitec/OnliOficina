-- Criar função para atualizar totais da ordem automaticamente
CREATE OR REPLACE FUNCTION public.update_ordem_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  ordem_id uuid;
  valor_total_calc numeric;
  desconto_atual numeric;
  valor_final_calc numeric;
BEGIN
  -- Determinar o ID da ordem baseado na operação
  IF TG_OP = 'DELETE' THEN
    ordem_id := OLD.ordem_servico_id;
  ELSE
    ordem_id := NEW.ordem_servico_id;
  END IF;

  -- Calcular o total dos itens
  SELECT COALESCE(SUM(valor_total), 0)
  INTO valor_total_calc
  FROM public.itens_servico
  WHERE ordem_servico_id = ordem_id;

  -- Buscar o desconto atual da ordem
  SELECT COALESCE(desconto, 0)
  INTO desconto_atual
  FROM public.ordens_servico
  WHERE id = ordem_id;

  -- Calcular valor final
  valor_final_calc := valor_total_calc - desconto_atual;

  -- Atualizar a ordem com os novos totais
  UPDATE public.ordens_servico
  SET 
    valor_total = valor_total_calc,
    valor_final = valor_final_calc,
    updated_at = now()
  WHERE id = ordem_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Criar triggers para atualizar totais automaticamente
DROP TRIGGER IF EXISTS trigger_update_ordem_totals_insert ON public.itens_servico;
DROP TRIGGER IF EXISTS trigger_update_ordem_totals_update ON public.itens_servico;
DROP TRIGGER IF EXISTS trigger_update_ordem_totals_delete ON public.itens_servico;

CREATE TRIGGER trigger_update_ordem_totals_insert
  AFTER INSERT ON public.itens_servico
  FOR EACH ROW EXECUTE FUNCTION public.update_ordem_totals();

CREATE TRIGGER trigger_update_ordem_totals_update
  AFTER UPDATE ON public.itens_servico
  FOR EACH ROW EXECUTE FUNCTION public.update_ordem_totals();

CREATE TRIGGER trigger_update_ordem_totals_delete
  AFTER DELETE ON public.itens_servico
  FOR EACH ROW EXECUTE FUNCTION public.update_ordem_totals();