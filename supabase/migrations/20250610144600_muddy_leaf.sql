-- First, drop the problematic RLS policies that are causing infinite recursion
DROP POLICY IF EXISTS "Users can view organization members for organizations they belong to" ON public.organization_members;
DROP POLICY IF EXISTS "Organization creators can manage members" ON public.organization_members;

-- Drop the security definer function as it's causing the circular dependency
DROP FUNCTION IF EXISTS public.get_user_organization_access(uuid);

-- Update RLS policies for organization_members to break the circular dependency
CREATE POLICY "Users can view organization members for accessible organizations"
  ON public.organization_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_id AND o.creator_id = auth.uid()
    ) OR user_id = auth.uid()
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

-- Fix the categories table foreign key reference (it was referencing itself)
ALTER TABLE public.categories 
DROP CONSTRAINT IF EXISTS categories_organization_id_fkey;

ALTER TABLE public.categories 
ADD CONSTRAINT categories_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;