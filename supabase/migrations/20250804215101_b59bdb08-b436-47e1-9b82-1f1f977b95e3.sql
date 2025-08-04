-- Criar perfil para o usuário admin
INSERT INTO public.profiles (id, nome, email, cargo)
SELECT 
  id,
  'Administrador AlFreire',
  'alfreire@admin.com',
  'admin'
FROM auth.users 
WHERE email = 'alfreire@admin.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE email = 'alfreire@admin.com'
);