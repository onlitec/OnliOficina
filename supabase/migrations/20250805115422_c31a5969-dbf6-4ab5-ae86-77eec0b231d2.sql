-- Create table for email configuration
CREATE TABLE public.configuracao_email (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  servidor_smtp TEXT NOT NULL,
  porta INTEGER NOT NULL DEFAULT 587,
  usuario TEXT NOT NULL,
  senha TEXT NOT NULL,
  email_remetente TEXT NOT NULL,
  nome_remetente TEXT NOT NULL,
  usar_ssl BOOLEAN NOT NULL DEFAULT true,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.configuracao_email ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Usuários podem ver suas configurações de email" 
ON public.configuracao_email 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas configurações de email" 
ON public.configuracao_email 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas configurações de email" 
ON public.configuracao_email 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas configurações de email" 
ON public.configuracao_email 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_configuracao_email_updated_at
BEFORE UPDATE ON public.configuracao_email
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();