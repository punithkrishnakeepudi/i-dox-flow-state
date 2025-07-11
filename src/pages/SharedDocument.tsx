import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DocumentService } from "@/lib/documentService";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface Document {
  id: string;
  title: string;
  content: any;
  created_at: string;
  updated_at: string;
}

const SharedDocument = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadSharedDocument = async () => {
      if (!shareCode) return;

      try {
        const doc = await DocumentService.getDocumentByShareCode(shareCode);
        setDocument(doc);
      } catch (error) {
        toast({
          title: "Document not found",
          description: "The shared document could not be found or is no longer available.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadSharedDocument();
  }, [shareCode, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-semibold mb-2">Loading shared document...</h2>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Document Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The shared document you're looking for doesn't exist or is no longer available.
          </p>
          <Link to="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <span className="text-white font-bold text-sm">i</span>
                </div>
                <span className="text-xl font-bold gradient-text">dox</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-border"></div>
              <h1 className="text-lg font-medium text-foreground">
                {document.title} (Shared)
              </h1>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to App
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card className="bg-card rounded-2xl shadow-soft border border-border/50">
          <div className="p-6 border-b border-border/30 bg-gradient-card">
            <h2 className="text-2xl font-bold text-foreground">{document.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Shared document • Read-only view
            </p>
          </div>
          
          <div className="p-6">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: document.content?.html || '<p>This document appears to be empty.</p>' 
              }}
            />
          </div>
        </Card>
      </main>
    </div>
  );
};

export default SharedDocument;