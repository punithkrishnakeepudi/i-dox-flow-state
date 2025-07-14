-- Create a profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create a documents table for storing documents
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content JSONB NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":""}]}]}',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_code TEXT UNIQUE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create a document_collaborators table for sharing
CREATE TABLE public.document_collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(document_id, user_id)
);

-- Create a document_activity table for tracking changes
CREATE TABLE public.document_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'shared', 'viewed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_activity ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for documents
CREATE POLICY "Users can view their own documents" ON public.documents 
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can view shared documents" ON public.documents 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.document_collaborators 
      WHERE document_id = documents.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view public documents" ON public.documents 
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create their own documents" ON public.documents 
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Document owners can update their documents" ON public.documents 
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Document editors can update shared documents" ON public.documents 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.document_collaborators 
      WHERE document_id = documents.id 
        AND user_id = auth.uid() 
        AND permission IN ('edit', 'admin')
    )
  );

CREATE POLICY "Document owners can delete their documents" ON public.documents 
  FOR DELETE USING (auth.uid() = owner_id);

-- Create policies for document_collaborators
CREATE POLICY "Users can view collaborators of their documents" ON public.document_collaborators 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE id = document_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own collaborations" ON public.document_collaborators 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Document owners can manage collaborators" ON public.document_collaborators 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE id = document_id AND owner_id = auth.uid()
    )
  );

-- Create policies for document_activity
CREATE POLICY "Users can view activity of their documents" ON public.document_activity 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE id = document_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.document_collaborators 
      WHERE document_id = document_activity.document_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create activity entries" ON public.document_activity 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate share codes
CREATE OR REPLACE FUNCTION public.generate_share_code()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(6), 'base64')::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate share codes
CREATE OR REPLACE FUNCTION public.handle_new_document()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.share_code IS NULL THEN
    NEW.share_code = public.generate_share_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_document_created
  BEFORE INSERT ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_document();

-- Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN email TEXT;

-- Update handle_new_user function to store email
DROP FUNCTION IF EXISTS public.handle_new_user();
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for all tables
ALTER TABLE public.documents REPLICA IDENTITY FULL;
ALTER TABLE public.document_collaborators REPLICA IDENTITY FULL;
ALTER TABLE public.document_activity REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_collaborators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Add password_hash column for optional document password protection
ALTER TABLE public.documents ADD COLUMN password_hash TEXT;