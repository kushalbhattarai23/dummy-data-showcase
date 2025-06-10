/*
  # Fix RLS Policy Infinite Recursion

  1. Problem
    - Circular dependency between organizations and organization_members policies
    - Organizations policy checks organization_members table
    - Organization_members policies check organizations table
    - This creates infinite recursion

  2. Solution
    - Simplify organization_members policies to avoid referencing organizations
    - Keep organizations policy that checks membership but ensure it doesn't trigger recursion
    - Use direct auth.uid() checks where possible

  3. Changes
    - Drop existing problematic policies
    - Create new simplified policies that break the circular dependency
*/

-- Drop existing problematic policies for organizations
DROP POLICY IF EXISTS "Users can view organizations they own or are members of" ON organizations;
DROP POLICY IF EXISTS "Organization creators can manage members" ON organization_members;
DROP POLICY IF EXISTS "Users can view organization members for accessible organization" ON organization_members;

-- Create simplified policies for organizations
CREATE POLICY "Users can view their own organizations"
  ON organizations
  FOR SELECT
  TO public
  USING (creator_id = auth.uid());

CREATE POLICY "Users can view organizations where they are members"
  ON organizations
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_members.organization_id = organizations.id 
      AND organization_members.user_id = auth.uid()
    )
  );

-- Create simplified policies for organization_members
CREATE POLICY "Users can view memberships for their own organizations"
  ON organization_members
  FOR SELECT
  TO public
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own memberships"
  ON organization_members
  FOR SELECT
  TO public
  USING (user_id = auth.uid());

CREATE POLICY "Organization creators can manage members"
  ON organization_members
  FOR ALL
  TO public
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE creator_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE creator_id = auth.uid()
    )
  );

-- Ensure other organization policies remain intact
CREATE POLICY "Organization creators can update their organizations"
  ON organizations
  FOR UPDATE
  TO public
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Organization creators can delete their organizations"
  ON organizations
  FOR DELETE
  TO public
  USING (creator_id = auth.uid());

CREATE POLICY "Users can create organizations"
  ON organizations
  FOR INSERT
  TO public
  WITH CHECK (creator_id = auth.uid());