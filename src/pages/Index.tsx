import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { DocumentEditor } from "@/components/DocumentEditor";
import { StatsPanel } from "@/components/StatsPanel";
import { generateUserId } from "@/lib/utils";

const Index = () => {
  const [userId, setUserId] = useState<string>("");
  const [currentDocument, setCurrentDocument] = useState<string>("");

  useEffect(() => {
    // Get or generate user ID
    let storedUserId = localStorage.getItem("idox-user-id");
    if (!storedUserId) {
      storedUserId = generateUserId();
      localStorage.setItem("idox-user-id", storedUserId);
    }
    setUserId(storedUserId);

    // Initialize with a default document
    setCurrentDocument("Untitled Document");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header userId={userId} documentTitle={currentDocument} />
      
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-3">
            <DocumentEditor 
              userId={userId}
              documentTitle={currentDocument}
              onTitleChange={setCurrentDocument}
            />
          </div>
          
          {/* Stats Panel */}
          <div className="lg:col-span-1">
            <StatsPanel />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
