/*
# Fix infinite recursion in RLS policies

1. Changes
   - Remove the "Users can view collaborators of their documents" policy from document_collaborators table
   - This policy was causing circular dependency by querying documents table while documents policies were being evaluated

2. Security Impact
   - Users can still view documents they own or collaborate on
   - Users can still view their own collaboration entries
   - Document owners can still manage collaborators through the existing policy
   - The removed policy was causing infinite recursion when documents policies tried to check collaborators
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view collaborators of their documents" ON public.document_collaborators;