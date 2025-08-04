-- Remover usuário admin problemático
DELETE FROM public.profiles WHERE email = 'alfreire@admin.com';
DELETE FROM auth.users WHERE email = 'alfreire@admin.com';