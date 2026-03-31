
-- Enum for order status
CREATE TYPE public.order_status_enum AS ENUM ('novo', 'processando', 'enviado', 'entregue', 'cancelado');

-- Add tracking_code and order_status to orders
ALTER TABLE public.orders ADD COLUMN tracking_code text DEFAULT '';
ALTER TABLE public.orders ADD COLUMN order_status order_status_enum DEFAULT 'novo';

-- Admin users table
CREATE TABLE public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Daily visits table
CREATE TABLE public.daily_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_date date NOT NULL DEFAULT CURRENT_DATE UNIQUE,
  visit_count integer NOT NULL DEFAULT 1
);
ALTER TABLE public.daily_visits ENABLE ROW LEVEL SECURITY;
