-- Criar usuário admin diretamente confirmado
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_sent_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'alfreire@admin.com',
  crypt('*M3a74g20M', gen_salt('bf')),
  NOW(), -- Email já confirmado
  '{"provider":"email","providers":["email"]}',
  '{"name":"Administrador AlFreire"}',
  NOW(),
  NOW(),
  NOW()
);