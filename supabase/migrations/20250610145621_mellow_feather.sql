/*
  # Add RLS policies for inventory_items table

  1. Security
    - Enable RLS on `inventory_items` table (if not already enabled)
    - Add policy for organization members to view inventory items
    - Add policy for organization members to insert inventory items
    - Add policy for organization members to update inventory items
    - Add policy for organization members to delete inventory items

  2. Changes
    - Users can only access inventory items for organizations they are members of
    - Organization creators automatically have access to their organization's inventory
*/

-- Enable RLS on inventory_items table
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT: Users can view inventory items for organizations they are members of or own
CREATE POLICY "Users can view inventory items for their organizations"
  ON inventory_items
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations 
      WHERE creator_id = auth.uid()
      UNION
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy for INSERT: Users can create inventory items for organizations they are members of or own
CREATE POLICY "Users can create inventory items for their organizations"
  ON inventory_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations 
      WHERE creator_id = auth.uid()
      UNION
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy for UPDATE: Users can update inventory items for organizations they are members of or own
CREATE POLICY "Users can update inventory items for their organizations"
  ON inventory_items
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations 
      WHERE creator_id = auth.uid()
      UNION
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy for DELETE: Users can delete inventory items for organizations they are members of or own
CREATE POLICY "Users can delete inventory items for their organizations"
  ON inventory_items
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations 
      WHERE creator_id = auth.uid()
      UNION
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );