-- Confirmar email do usuário admin existente
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    confirmation_token = ''
WHERE email = 'alfreire@admin.com';