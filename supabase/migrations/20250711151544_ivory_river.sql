/*
  # Fix RLS infinite recursion with minimal policies

  This migration completely removes all existing RLS policies and recreates them
  with the simplest possible structure to eliminate circular dependencies.

  1. Drop all existing policies
  2. Create minimal, non-recursive policies
  3. Ensure no circular references between tables
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "documents_select_own" ON documents;
DROP POLICY IF EXISTS "documents_select_public" ON documents;
DROP POLICY IF EXISTS "documents_select_shared" ON documents;
DROP POLICY IF EXISTS "documents_insert_own" ON documents;
DROP POLICY IF EXISTS "documents_update_own" ON documents;
DROP POLICY IF EXISTS "documents_update_shared" ON documents;
DROP POLICY IF EXISTS "documents_delete_own" ON documents;

DROP POLICY IF EXISTS "collaborators_select_own" ON document_collaborators;
DROP POLICY IF EXISTS "collaborators_insert_as_owner" ON document_collaborators;
DROP POLICY IF EXISTS "collaborators_update_as_owner" ON document_collaborators;
DROP POLICY IF EXISTS "collaborators_delete_as_owner" ON document_collaborators;

DROP POLICY IF EXISTS "activity_select_related" ON document_activity;
DROP POLICY IF EXISTS "activity_insert_own" ON document_activity;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Create minimal policies for documents table
-- Only allow users to see their own documents
CREATE POLICY "documents_select_own" ON documents
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

-- Allow users to insert documents they own
CREATE POLICY "documents_insert_own" ON documents
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Allow users to update their own documents
CREATE POLICY "documents_update_own" ON documents
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Allow users to delete their own documents
CREATE POLICY "documents_delete_own" ON documents
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- Create minimal policies for document_collaborators table
-- Users can see collaborations they are part of
CREATE POLICY "collaborators_select_own" ON document_collaborators
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Document owners can manage collaborators (simplified check)
CREATE POLICY "collaborators_manage_as_owner" ON document_collaborators
  FOR ALL TO authenticated
  USING (auth.uid() IN (
    SELECT owner_id FROM documents WHERE id = document_id
  ))
  WITH CHECK (auth.uid() IN (
    SELECT owner_id FROM documents WHERE id = document_id
  ));

-- Create minimal policies for document_activity table
-- Users can see their own activity
CREATE POLICY "activity_select_own" ON document_activity
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own activity
CREATE POLICY "activity_insert_own" ON document_activity
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create minimal policies for profiles table
-- All authenticated users can read profiles
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT TO authenticated
  USING (true);

-- Users can manage their own profile
CREATE POLICY "profiles_manage_own" ON profiles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);