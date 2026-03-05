
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'agent', 'customer');
CREATE TYPE public.order_status AS ENUM ('pending', 'processing', 'delivered', 'cancelled');
CREATE TYPE public.payout_status AS ENUM ('pending', 'processing', 'paid', 'failed');
CREATE TYPE public.transaction_type AS ENUM ('C2B', 'B2C');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE public.agent_tier AS ENUM ('Bronze', 'Silver', 'Gold', 'Platinum');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Agent details table
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tier agent_tier NOT NULL DEFAULT 'Bronze',
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 8.00,
  mpesa_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  total_sales INTEGER NOT NULL DEFAULT 0,
  total_earned NUMERIC(12,2) NOT NULL DEFAULT 0,
  pending_earnings NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id),
  price NUMERIC(12,2) NOT NULL,
  original_price NUMERIC(12,2),
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  emoji TEXT DEFAULT '📦',
  badge TEXT CHECK (badge IN ('Hot', 'Sale', 'New', NULL)),
  rating NUMERIC(2,1) DEFAULT 0,
  total_sold INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES auth.users(id),
  customer_name TEXT,
  customer_phone TEXT,
  agent_id UUID REFERENCES public.agents(id),
  total_amount NUMERIC(12,2) NOT NULL,
  commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status order_status NOT NULL DEFAULT 'pending',
  mpesa_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_ref TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES public.orders(id),
  agent_id UUID REFERENCES public.agents(id),
  amount NUMERIC(12,2) NOT NULL,
  type transaction_type NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',
  mpesa_ref TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payouts table
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_ref TEXT NOT NULL UNIQUE,
  agent_id UUID REFERENCES public.agents(id) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status payout_status NOT NULL DEFAULT 'pending',
  mpesa_ref TEXT,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_agent ON public.orders(agent_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_agent ON public.transactions(agent_id);
CREATE INDEX idx_payouts_agent ON public.payouts(agent_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON public.payouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), NEW.phone);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'PLI-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_order_number BEFORE INSERT ON public.orders
  FOR EACH ROW WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION public.generate_order_number();

-- RLS Policies
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Agents can manage own products" ON public.products FOR INSERT WITH CHECK (auth.uid() = created_by AND public.has_role(auth.uid(), 'agent'));
CREATE POLICY "Agents can update own products" ON public.products FOR UPDATE USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all products" ON public.products FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view own data" ON public.agents FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage agents" ON public.agents FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Customers can view own orders" ON public.orders FOR SELECT USING (auth.uid() = customer_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Agents can view assigned orders" ON public.orders FOR SELECT USING (agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()));
CREATE POLICY "Authenticated users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR order_id IN (SELECT id FROM public.orders WHERE agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()))
);
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (
  agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "System can insert transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Agents can view own payouts" ON public.payouts FOR SELECT USING (
  agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Agents can request payouts" ON public.payouts FOR INSERT WITH CHECK (
  agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can update payouts" ON public.payouts FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Insert default categories
INSERT INTO public.categories (name) VALUES ('Electronics'), ('Fashion'), ('Home'), ('Health'), ('Sports');
