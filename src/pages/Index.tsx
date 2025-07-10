import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { DocumentEditor } from "@/components/DocumentEditor";
import { StatsPanel } from "@/components/StatsPanel";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Document {
  id: string;
  title: string;
  content: any;
  created_at: string;
  updated_at: string;
}

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  const loadDocuments = async () => {
    if (!user) return;
    
    setLoadingDocs(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading documents:', error);
        return;
      }

      setDocuments(data || []);
      
      // If no documents, create a default one
      if (!data || data.length === 0) {
        await createNewDocument();
      } else {
        setCurrentDocument(data[0]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const createNewDocument = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          title: 'Untitled Document',
          content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }] },
          owner_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating document:', error);
        return;
      }

      setDocuments(prev => [data, ...prev]);
      setCurrentDocument(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Show loading screen while checking auth
  if (loading || loadingDocs) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <FileText className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
              <h2 className="text-2xl font-semibold mb-2">Loading your documents...</h2>
              <Skeleton className="w-64 h-4 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no user after loading, don't render anything (redirect will happen)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header 
        user={user} 
        currentDocument={currentDocument}
        onCreateDocument={createNewDocument}
      />
      
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-3">
            {currentDocument ? (
              <DocumentEditor 
                document={currentDocument}
                onDocumentUpdate={setCurrentDocument}
              />
            ) : (
              <div className="bg-card rounded-2xl shadow-soft border border-border/50 p-12 text-center">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No documents yet</h3>
                <p className="text-muted-foreground mb-6">Create your first document to get started</p>
                <Button onClick={createNewDocument} className="hover-lift">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Document
                </Button>
              </div>
            )}
          </div>
          
          {/* Stats Panel */}
          <div className="lg:col-span-1">
            <StatsPanel documents={documents} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
