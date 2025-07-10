import { Button } from "@/components/ui/button";
import { Share2, Settings, Moon, Sun, Download } from "lucide-react";
import { useState, useEffect } from "react";

interface HeaderProps {
  userId: string;
  documentTitle: string;
}

export function Header({ userId, documentTitle }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);

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

  return (
    <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Logo & Document Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">i</span>
              </div>
              <span className="text-xl font-bold gradient-text">dox</span>
            </div>
            
            <div className="hidden sm:block h-4 w-px bg-border"></div>
            
            <h1 className="text-lg font-medium text-foreground truncate max-w-xs">
              {documentTitle}
            </h1>
          </div>

          {/* Right: User ID & Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span className="text-sm font-mono text-muted-foreground">
                ID: {userId}
              </span>
            </div>

            <Button variant="ghost" size="sm" className="hover-lift">
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Share</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={toggleTheme} className="hover-lift">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            <Button variant="ghost" size="sm" className="hover-lift">
              <Download className="w-4 h-4" />
            </Button>

            <Button variant="ghost" size="sm" className="hover-lift">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}