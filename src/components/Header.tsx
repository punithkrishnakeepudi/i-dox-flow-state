import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Moon, Sun, Download, Plus, LogOut, User } from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ShareDialog } from "@/components/ShareDialog";
import { DocumentService } from "@/lib/documentService";

interface Document {
  id: string;
  title: string;
  content: any;
  created_at: string;
  updated_at: string;
}

interface HeaderProps {
  user: SupabaseUser;
  currentDocument: Document | null;
  onCreateDocument: () => Promise<void>;
  showLoginButton?: boolean;
}

export function Header({ user, currentDocument, onCreateDocument, showLoginButton }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const { signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    setIsDark(theme === "dark");
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    setIsDark(!isDark);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Signed out", description: "You have been successfully signed out." });
    } catch (error) {
      toast({ title: "Error signing out", description: "Please try again.", variant: "destructive" });
    }
  };

  const handleDownload = async () => {
    if (!currentDocument) {
      toast({ title: "No document", description: "Please select a document to download.", variant: "destructive" });
      return;
    }
    try {
      await DocumentService.exportToPDF(currentDocument);
      toast({ title: "Downloaded", description: "Document downloaded successfully." });
    } catch (error) {
      toast({ title: "Download failed", description: "Could not download the document.", variant: "destructive" });
    }
  };

  return (
    <>
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
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
              <h1 className="text-lg font-medium text-foreground truncate max-w-xs">
                {currentDocument?.title || "No document selected"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full">
                    <User className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {user.email?.split("@")[0]}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover-lift"
                    onClick={async () => {
                      try {
                        await onCreateDocument();
                      } catch (error) {
                        toast({ title: "Error", description: "Failed to create document.", variant: "destructive" });
                      }
                    }}
                    disabled={!user}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">New</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover-lift"
                    onClick={() => setShareDialogOpen(true)}
                    disabled={!currentDocument}
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Share</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={toggleTheme} className="hover-lift">
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover-lift"
                    onClick={handleDownload}
                    disabled={!currentDocument}
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Download</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover-lift"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Sign Out</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover-lift"
                    onClick={() => (window.location.href = "/auth")}
                  >
                    Log In
                  </Button>
                  <Button variant="ghost" size="sm" onClick={toggleTheme} className="hover-lift">
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        document={currentDocument}
      />
    </>
  );
}