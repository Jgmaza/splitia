-- Seed for SplitIA MVP: Jose Maza, categories, friends, expenses
-- Run once. DEMO_USER_ID must be: a1b2c3d4-e5f6-4789-a012-000000000001

-- 1. User: Jose Maza
INSERT INTO public.users (id, name, email, created_at)
VALUES (
  'a1b2c3d4-e5f6-4789-a012-000000000001',
  'Jose Maza',
  'jose@example.com',
  now()
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;

-- 2. Categories (comida, transporte, suscripciones)
INSERT INTO public.categories (id, user_id, name, icon, created_at)
VALUES
  ('a1b2c3d4-e5f6-4789-a012-000000000002', 'a1b2c3d4-e5f6-4789-a012-000000000001', 'comida', 'food', now()),
  ('a1b2c3d4-e5f6-4789-a012-000000000003', 'a1b2c3d4-e5f6-4789-a012-000000000001', 'transporte', 'transport', now()),
  ('a1b2c3d4-e5f6-4789-a012-000000000004', 'a1b2c3d4-e5f6-4789-a012-000000000001', 'suscripciones', 'subscriptions', now())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

-- 3. Friends (Jesu, Isabella, Miguel)
INSERT INTO public.friends (id, user_id, name, email, created_at)
VALUES
  ('a1b2c3d4-e5f6-4789-a012-000000000005', 'a1b2c3d4-e5f6-4789-a012-000000000001', 'Jesu', 'jesu@example.com', now()),
  ('a1b2c3d4-e5f6-4789-a012-000000000006', 'a1b2c3d4-e5f6-4789-a012-000000000001', 'Isabella', 'isabella@example.com', now()),
  ('a1b2c3d4-e5f6-4789-a012-000000000007', 'a1b2c3d4-e5f6-4789-a012-000000000001', 'Miguel', 'miguel@example.com', now())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;

-- 4. Personal expenses (is_shared = false)
INSERT INTO public.expenses (id, user_id, amount, merchant, description, category_id, currency, date, is_shared, created_at)
VALUES
  ('a1b2c3d4-e5f6-4789-a012-000000000011', 'a1b2c3d4-e5f6-4789-a012-000000000001', 25000, 'Didi', 'Viaje Didi', 'a1b2c3d4-e5f6-4789-a012-000000000003', 'COP', now(), false, now()),
  ('a1b2c3d4-e5f6-4789-a012-000000000012', 'a1b2c3d4-e5f6-4789-a012-000000000001', 20000, 'OpenAI', 'Suscripción OpenAI ~5 USD', 'a1b2c3d4-e5f6-4789-a012-000000000004', 'COP', now(), false, now()),
  ('a1b2c3d4-e5f6-4789-a012-000000000013', 'a1b2c3d4-e5f6-4789-a012-000000000001', 15000, 'Café', 'Café de la tarde', 'a1b2c3d4-e5f6-4789-a012-000000000002', 'COP', now(), false, now()),
  ('a1b2c3d4-e5f6-4789-a012-000000000014', 'a1b2c3d4-e5f6-4789-a012-000000000001', 16900, 'Spotify', 'Premium mensual', 'a1b2c3d4-e5f6-4789-a012-000000000004', 'COP', now(), false, now())
ON CONFLICT (id) DO NOTHING;

-- 5. Shared expenses (is_shared = true)
INSERT INTO public.expenses (id, user_id, amount, merchant, description, category_id, currency, date, is_shared, created_at)
VALUES
  ('a1b2c3d4-e5f6-4789-a012-000000000021', 'a1b2c3d4-e5f6-4789-a012-000000000001', 85000, 'Restaurante', 'Almuerzo compartido', 'a1b2c3d4-e5f6-4789-a012-000000000002', 'COP', now(), true, now()),
  ('a1b2c3d4-e5f6-4789-a012-000000000022', 'a1b2c3d4-e5f6-4789-a012-000000000001', 45000, 'Cine', 'Entradas cine', 'a1b2c3d4-e5f6-4789-a012-000000000002', 'COP', now(), true, now())
ON CONFLICT (id) DO NOTHING;

-- 6. Expense participants (who shared the expense)
INSERT INTO public.expense_participants (id, expense_id, friend_id, share_amount, paid_by_user)
VALUES
  (gen_random_uuid(), 'a1b2c3d4-e5f6-4789-a012-000000000021', 'a1b2c3d4-e5f6-4789-a012-000000000005', 28334, true),
  (gen_random_uuid(), 'a1b2c3d4-e5f6-4789-a012-000000000021', 'a1b2c3d4-e5f6-4789-a012-000000000006', 28333, true),
  (gen_random_uuid(), 'a1b2c3d4-e5f6-4789-a012-000000000022', 'a1b2c3d4-e5f6-4789-a012-000000000007', 22500, true);

-- 7. Email expenses (mock "detected" for chat flow; processed = false)
INSERT INTO public.email_expenses (id, user_id, merchant, amount, email_subject, email_date, processed)
VALUES
  (gen_random_uuid(), 'a1b2c3d4-e5f6-4789-a012-000000000001', 'Uber', 45000, 'Compra por $45.000 en Uber', now(), false),
  (gen_random_uuid(), 'a1b2c3d4-e5f6-4789-a012-000000000001', 'DANNYS BURGER', 120000, 'Payment $120000 DANNYS BURGER', now(), false),
  (gen_random_uuid(), 'a1b2c3d4-e5f6-4789-a012-000000000001', 'Netflix', 26900, 'Cobro $26.900 Netflix', now(), false);
