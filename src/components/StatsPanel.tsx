import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Clock, 
  Type, 
  Hash,
  Users,
  Eye
} from "lucide-react";
import { calculateReadingTime, getWordCount, getCharacterCount } from "@/lib/utils";

export function StatsPanel() {
  const [stats, setStats] = useState({
    wordCount: 0,
    charCount: 0,
    readingTime: 0,
    paragraphs: 0
  });

  useEffect(() => {
    const updateStats = () => {
      const content = localStorage.getItem("idox-document-content") || "";
      const textContent = content.replace(/<[^>]*>/g, ""); // Strip HTML tags
      
      const wordCount = getWordCount(textContent);
      const charCount = getCharacterCount(textContent);
      const readingTime = calculateReadingTime(textContent);
      const paragraphs = textContent.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

      setStats({
        wordCount,
        charCount,
        readingTime,
        paragraphs
      });
    };

    // Update stats initially
    updateStats();

    // Update stats every 2 seconds
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, []);

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
            <Badge variant="secondary" className="font-mono">1</Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Viewers</span>
            </div>
            <Badge variant="secondary" className="font-mono">0</Badge>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-4 bg-gradient-card border-border/50 hover-lift">
        <h3 className="text-lg font-semibold mb-4 gradient-text">Quick Actions</h3>
        <div className="space-y-2">
          <button className="w-full p-3 text-sm font-medium text-left rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
            📤 Export as PDF
          </button>
          <button className="w-full p-3 text-sm font-medium text-left rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
            📋 Copy Share Link
          </button>
          <button className="w-full p-3 text-sm font-medium text-left rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
            🔒 Set Password
          </button>
          <button className="w-full p-3 text-sm font-medium text-left rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
            👥 Invite Collaborators
          </button>
        </div>
      </Card>
    </div>
  );
}