/*
  # Fix Organizations RLS Policy

  1. Security Updates
    - Drop existing INSERT policy that uses incorrect uid() function
    - Create new INSERT policy using correct auth.uid() function
    - Ensure authenticated users can create organizations where they are the creator

  2. Changes
    - Replace uid() with auth.uid() in INSERT policy
    - Maintain existing functionality while fixing the authentication check
*/

-- Drop the existing INSERT policy that's causing issues
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;

-- Create a new INSERT policy with the correct auth.uid() function
CREATE POLICY "Users can create organizations"
  ON organizations
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = creator_id);

-- Also fix the SELECT policy to use auth.uid() consistently
DROP POLICY IF EXISTS "Users can view organizations they own or are members of" ON organizations;

CREATE POLICY "Users can view organizations they own or are members of"
  ON organizations
  FOR SELECT
  TO public
  USING (
    (creator_id = auth.uid()) OR 
    (EXISTS (
      SELECT 1
      FROM organization_members
      WHERE organization_members.organization_id = organizations.id 
      AND organization_members.user_id = auth.uid()
    ))
  );

-- Fix UPDATE policy
DROP POLICY IF EXISTS "Organization creators can update their organizations" ON organizations;

CREATE POLICY "Organization creators can update their organizations"
  ON organizations
  FOR UPDATE
  TO public
  USING (creator_id = auth.uid());

-- Fix DELETE policy  
DROP POLICY IF EXISTS "Organization creators can delete their organizations" ON organizations;

CREATE POLICY "Organization creators can delete their organizations"
  ON organizations
  FOR DELETE
  TO public
  USING (creator_id = auth.uid());