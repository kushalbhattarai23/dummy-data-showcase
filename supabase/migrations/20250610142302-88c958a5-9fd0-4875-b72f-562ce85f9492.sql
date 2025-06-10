
-- Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create organization members table for multi-user organizations
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Create inventory items table
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  category TEXT,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  quantity_in_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock_level INTEGER DEFAULT 0,
  maximum_stock_level INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stock movements table to track inventory changes
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC,
  reference TEXT,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update existing wallets table to support organizations
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Update existing transactions table to support organizations
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Update existing categories table to support organizations
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.categories(id) ON DELETE CASCADE;

-- Enable RLS on all new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS policies for organizations
CREATE POLICY "Users can view organizations they own or are members of"
  ON public.organizations
  FOR SELECT
  USING (
    creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organizations"
  ON public.organizations
  FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Organization creators can update their organizations"
  ON public.organizations
  FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "Organization creators can delete their organizations"
  ON public.organizations
  FOR DELETE
  USING (creator_id = auth.uid());

-- RLS policies for organization members
CREATE POLICY "Users can view organization members for organizations they belong to"
  ON public.organization_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_id AND (
        o.creator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.organization_members om
          WHERE om.organization_id = o.id AND om.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Organization creators can manage members"
  ON public.organization_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id AND creator_id = auth.uid()
    )
  );

-- RLS policies for inventory items
CREATE POLICY "Users can view inventory items for their organizations"
  ON public.inventory_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_id AND (
        o.creator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.organization_members om
          WHERE om.organization_id = o.id AND om.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can manage inventory items for their organizations"
  ON public.inventory_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_id AND (
        o.creator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.organization_members om
          WHERE om.organization_id = o.id AND om.user_id = auth.uid()
        )
      )
    )
  );

-- RLS policies for stock movements
CREATE POLICY "Users can view stock movements for their organizations"
  ON public.stock_movements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_id AND (
        o.creator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.organization_members om
          WHERE om.organization_id = o.id AND om.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create stock movements for their organizations"
  ON public.stock_movements
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_id AND (
        o.creator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.organization_members om
          WHERE om.organization_id = o.id AND om.user_id = auth.uid()
        )
      )
    )
  );

-- Add triggers for updated_at
CREATE TRIGGER handle_updated_at_organizations
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_inventory_items
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_organizations_creator_id ON public.organizations(creator_id);
CREATE INDEX idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_inventory_items_org_id ON public.inventory_items(organization_id);
CREATE INDEX idx_stock_movements_org_id ON public.stock_movements(organization_id);
CREATE INDEX idx_stock_movements_item_id ON public.stock_movements(inventory_item_id);
CREATE INDEX idx_wallets_org_id ON public.wallets(organization_id);
CREATE INDEX idx_transactions_org_id ON public.transactions(organization_id);
CREATE INDEX idx_categories_org_id ON public.categories(organization_id);
