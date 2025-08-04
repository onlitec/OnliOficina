-- Atualizar configuração para não exigir confirmação de email (apenas para ambiente de desenvolvimento)
UPDATE auth.config 
SET value = 'false' 
WHERE parameter = 'DISABLE_SIGNUP';