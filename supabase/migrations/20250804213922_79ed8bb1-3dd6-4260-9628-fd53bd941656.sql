-- Inserir usuário administrador diretamente na tabela auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'alfreire@admin.com',
  crypt('*M3a74g20M', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Administrador AlFreire"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Criar perfil admin para este usuário
INSERT INTO public.profiles (
  id,
  nome, 
  email,
  cargo
) 
SELECT 
  id,
  'Administrador AlFreire',
  'alfreire@admin.com',
  'admin'
FROM auth.users 
WHERE email = 'alfreire@admin.com';