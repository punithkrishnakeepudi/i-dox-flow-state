import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Clock, 
  Type, 
  Hash,
  Users,
  Eye,
  Download,
  Share2,
  Lock,
  UserPlus
} from "lucide-react";
import { DocumentService } from "@/lib/documentService";
import { useDocumentPresence } from "@/hooks/useDocumentPresence";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  title: string;
  content: any;
  created_at: string;
  updated_at: string;
}

interface StatsPanelProps {
  documents: Document[];
  currentDocument?: Document | null;
}

export function StatsPanel({ documents, currentDocument }: StatsPanelProps) {
  const [stats, setStats] = useState({
    wordCount: 0,
    charCount: 0,
    readingTime: 0,
    paragraphs: 0
  });
  
  const { activeUsers, viewers } = useDocumentPresence(currentDocument?.id || '');
  const { toast } = useToast();

  useEffect(() => {
    const updateStats = () => {
      let textContent = "";
      
      // Try to get content from current document or localStorage
      if (currentDocument?.content?.html) {
        textContent = currentDocument.content.html.replace(/<[^>]*>/g, ""); // Strip HTML tags
      } else if (documents.length > 0) {
        const firstDoc = documents[0];
        if (firstDoc?.content?.html) {
          textContent = firstDoc.content.html.replace(/<[^>]*>/g, ""); // Strip HTML tags
        }
      }
      
      // Fallback to localStorage
      if (!textContent) {
        const content = localStorage.getItem("idox-document-content") || "";
        textContent = content.replace(/<[^>]*>/g, ""); // Strip HTML tags
      }
      
      const metrics = DocumentService.calculateMetrics(textContent);
      const paragraphs = textContent.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

      setStats({
        wordCount: metrics.wordCount,
        charCount: metrics.characterCount,
        readingTime: metrics.readingTime,
        paragraphs
      });
    };

    // Update stats initially
    updateStats();

    // Update stats every 2 seconds
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, [documents, currentDocument]);

  const statItems = [
    {
      icon: Type,
      label: "Words",
      value: stats.wordCount.toLocaleString(),
      color: "bg-gradient-primary"
    },
    {
      icon: Hash,
      label: "Characters",
      value: stats.charCount.toLocaleString(),
      color: "bg-accent"
    },
    {
      icon: Clock,
      label: "Reading Time",
      value: `${stats.readingTime} min`,
      color: "bg-success"
    },
    {
      icon: FileText,
      label: "Paragraphs",
      value: stats.paragraphs.toString(),
      color: "bg-warning"
    }
  ];

  const handleExportPDF = async () => {
    if (!currentDocument) {
      toast({
        title: "No document selected",
        description: "Please select a document to export.",
        variant: "destructive"
      });
      return;
    }

    try {
      await DocumentService.exportToPDF(currentDocument);
      toast({
        title: "Exported successfully",
        description: "Document exported as PDF.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not export document.",
        variant: "destructive"
      });
    }
  };

  const handleCopyShareLink = async () => {
    if (!currentDocument) {
      toast({
        title: "No document selected",
        description: "Please select a document to share.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { shareLink } = await DocumentService.generateShareLink(currentDocument.id);
      await navigator.clipboard.writeText(shareLink);
      toast({
        title: "Link copied",
        description: "Share link copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Failed to copy link",
        description: "Could not generate or copy share link.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <Card className="p-4 bg-gradient-card border-border/50 hover-lift">
        <h3 className="text-lg font-semibold mb-4 gradient-text">Document Stats</h3>
        <div className="space-y-3">
          {statItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center`}>
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
              </div>
              <Badge variant="secondary" className="font-mono">
                {item.value}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Collaboration Panel */}
      <Card className="p-4 bg-gradient-card border-border/50 hover-lift">
        <h3 className="text-lg font-semibold mb-4 gradient-text">Collaboration</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Active Users</span>
            </div>
            <Badge variant="secondary" className="font-mono">{activeUsers.length}</Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Viewers</span>
            </div>
            <Badge variant="secondary" className="font-mono">{viewers}</Badge>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-4 bg-gradient-card border-border/50 hover-lift">
        <h3 className="text-lg font-semibold mb-4 gradient-text">Quick Actions</h3>
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start p-3 h-auto rounded-xl bg-muted/30 hover:bg-muted/50"
            onClick={handleExportPDF}
            disabled={!currentDocument}
          >
            <Download className="w-4 h-4 mr-3" />
            Export as PDF
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start p-3 h-auto rounded-xl bg-muted/30 hover:bg-muted/50"
            onClick={handleCopyShareLink}
            disabled={!currentDocument}
          >
            <Share2 className="w-4 h-4 mr-3" />
            Copy Share Link
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start p-3 h-auto rounded-xl bg-muted/30 hover:bg-muted/50"
            disabled={!currentDocument}
          >
            <Lock className="w-4 h-4 mr-3" />
            Set Password
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start p-3 h-auto rounded-xl bg-muted/30 hover:bg-muted/50"
            disabled={!currentDocument}
          >
            <UserPlus className="w-4 h-4 mr-3" />
            Invite Collaborators
          </Button>
        </div>
      </Card>
    </div>
  );
}