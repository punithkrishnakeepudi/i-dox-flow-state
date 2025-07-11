/*
  # Fix RLS infinite recursion - Final Solution
  
  The issue is that some policies still reference the same table they're applied to.
  We'll create the most minimal policies possible to eliminate all recursion.
*/

-- Drop ALL existing policies completely
DROP POLICY IF EXISTS "documents_select_own" ON documents;
DROP POLICY IF EXISTS "documents_select_public" ON documents;
DROP POLICY IF EXISTS "documents_select_shared" ON documents;
DROP POLICY IF EXISTS "documents_insert_own" ON documents;
DROP POLICY IF EXISTS "documents_update_own" ON documents;
DROP POLICY IF EXISTS "documents_update_shared" ON documents;
DROP POLICY IF EXISTS "documents_delete_own" ON documents;

DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can view public documents" ON documents;
DROP POLICY IF EXISTS "Users can view shared documents" ON documents;
DROP POLICY IF EXISTS "Users can create their own documents" ON documents;
DROP POLICY IF EXISTS "Document owners can update their documents" ON documents;
DROP POLICY IF EXISTS "Document editors can update shared documents" ON documents;
DROP POLICY IF EXISTS "Document owners can delete their documents" ON documents;

DROP POLICY IF EXISTS "collaborators_select_own" ON document_collaborators;
DROP POLICY IF EXISTS "collaborators_manage_as_owner" ON document_collaborators;
DROP POLICY IF EXISTS "Users can view their own collaborations" ON document_collaborators;
DROP POLICY IF EXISTS "Document owners can manage collaborators" ON document_collaborators;

DROP POLICY IF EXISTS "activity_select_own" ON document_activity;
DROP POLICY IF EXISTS "activity_insert_own" ON document_activity;
DROP POLICY IF EXISTS "Users can view activity of their documents" ON document_activity;
DROP POLICY IF EXISTS "Users can create activity entries" ON document_activity;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_manage_own" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create super simple policies with NO subqueries or references to the same table

-- Documents: Only owner can access (no sharing for now to avoid recursion)
CREATE POLICY "docs_owner_only" ON documents
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Collaborators: Only show if user is the collaborator
CREATE POLICY "collab_own_only" ON document_collaborators
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Activity: Only own activity
CREATE POLICY "activity_own_only" ON document_activity
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Profiles: Read all, manage own
CREATE POLICY "profiles_read_all" ON profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "profiles_own_only" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_delete_own" ON profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);