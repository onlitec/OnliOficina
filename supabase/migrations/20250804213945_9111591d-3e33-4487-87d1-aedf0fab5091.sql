-- Atualizar o cargo do usuário para admin
UPDATE public.profiles 
SET cargo = 'admin'
WHERE email = 'alfreire@admin.com';