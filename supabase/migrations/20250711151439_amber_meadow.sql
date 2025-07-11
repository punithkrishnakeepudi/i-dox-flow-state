/*
  # Rebuild RLS policies to fix infinite recursion

  1. Problem
    - Current RLS policies on documents table are causing infinite recursion
    - Policies are referencing the documents table within their own conditions
    - This creates circular dependencies that PostgreSQL cannot resolve

  2. Solution
    - Drop all existing policies on documents and related tables
    - Recreate simple, non-recursive policies
    - Use direct auth.uid() comparisons instead of subqueries
    - Ensure policies don't reference their own table in conditions

  3. New Policy Structure
    - Documents: Simple owner-based and public access policies
    - Document Collaborators: Direct user_id and document ownership checks
    - Document Activity: Simple user-based policies
    - Profiles: Basic read/write policies
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can view public documents" ON documents;
DROP POLICY IF EXISTS "Users can view shared documents" ON documents;
DROP POLICY IF EXISTS "Users can create their own documents" ON documents;
DROP POLICY IF EXISTS "Document owners can update their documents" ON documents;
DROP POLICY IF EXISTS "Document editors can update shared documents" ON documents;
DROP POLICY IF EXISTS "Document owners can delete their documents" ON documents;

DROP POLICY IF EXISTS "Users can view their own collaborations" ON document_collaborators;
DROP POLICY IF EXISTS "Document owners can manage collaborators" ON document_collaborators;

DROP POLICY IF EXISTS "Users can view activity of their documents" ON document_activity;
DROP POLICY IF EXISTS "Users can create activity entries" ON document_activity;

DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create simple, non-recursive policies for documents table
CREATE POLICY "documents_select_own"
  ON documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "documents_select_public"
  ON documents
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "documents_insert_own"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "documents_update_own"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "documents_delete_own"
  ON documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Create policies for document_collaborators table
CREATE POLICY "collaborators_select_own"
  ON document_collaborators
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "collaborators_insert_as_owner"
  ON document_collaborators
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT owner_id FROM documents WHERE id = document_id
    )
  );

CREATE POLICY "collaborators_update_as_owner"
  ON document_collaborators
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT owner_id FROM documents WHERE id = document_id
    )
  );

CREATE POLICY "collaborators_delete_as_owner"
  ON document_collaborators
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT owner_id FROM documents WHERE id = document_id
    )
  );

-- Create policies for document_activity table
CREATE POLICY "activity_select_related"
  ON document_activity
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT owner_id FROM documents WHERE id = document_id
    )
  );

CREATE POLICY "activity_insert_own"
  ON document_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for profiles table
CREATE POLICY "profiles_select_all"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_insert_own"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add a policy for shared documents access via collaborators
CREATE POLICY "documents_select_shared"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT document_id 
      FROM document_collaborators 
      WHERE user_id = auth.uid()
    )
  );

-- Add policy for collaborative editing
CREATE POLICY "documents_update_shared"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT document_id 
      FROM document_collaborators 
      WHERE user_id = auth.uid() 
      AND permission IN ('edit', 'admin')
    )
  )
  WITH CHECK (
    id IN (
      SELECT document_id 
      FROM document_collaborators 
      WHERE user_id = auth.uid() 
      AND permission IN ('edit', 'admin')
    )
  );