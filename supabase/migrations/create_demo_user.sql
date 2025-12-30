-- Create a demo user for testing OAuth flow
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/qfyomvwcugkqlbskhzhu/sql/new

-- Insert demo user into auth.users
INSERT INTO auth.users (
    id,
    instance_id,
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
)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'demo@testing.local',
    '$2a$10$demo.password.hash.for.testing.only',
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Demo User"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
)
ON CONFLICT (id) DO NOTHING;

-- Verify the user was created
SELECT id, email FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001';
