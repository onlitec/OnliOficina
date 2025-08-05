-- Verificar se já existe o usuário admin
DO $$
DECLARE
    admin_user_id uuid := '550e8400-e29b-41d4-a716-446655440000';
BEGIN
    -- Inserir o perfil admin se não existir
    INSERT INTO public.profiles (
        id,
        nome,
        email,
        cargo,
        telefone,
        created_at,
        updated_at
    ) 
    SELECT 
        admin_user_id,
        'Administrador do Sistema',
        'admin@oficina.com',
        'admin',
        '(11) 99999-9999',
        NOW(),
        NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = admin_user_id
    );
END $$;