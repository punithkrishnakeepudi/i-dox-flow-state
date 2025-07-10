import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Link,
  Image,
  Type
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentEditorProps {
  userId: string;
  documentTitle: string;
  onTitleChange: (title: string) => void;
}

export function DocumentEditor({ userId, documentTitle, onTitleChange }: DocumentEditorProps) {
  const [content, setContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load document content from localStorage
    const savedContent = localStorage.getItem("idox-document-content");
    if (savedContent) {
      setContent(savedContent);
      if (editorRef.current) {
        editorRef.current.innerHTML = savedContent;
      }
    }
  }, []);

  const saveContent = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setContent(newContent);
      localStorage.setItem("idox-document-content", newContent);
    }
  };

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    saveContent();
  };

  const handleTitleEdit = () => {
    setIsEditing(true);
    setTimeout(() => titleRef.current?.focus(), 0);
  };

  const handleTitleSave = () => {
    if (titleRef.current) {
      onTitleChange(titleRef.current.value || "Untitled Document");
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-soft border border-border/50 overflow-hidden hover-lift">
      {/* Document Title */}
      <div className="p-6 border-b border-border/30 bg-gradient-card">
        {isEditing ? (
          <input
            ref={titleRef}
            type="text"
            defaultValue={documentTitle}
            onBlur={handleTitleSave}
            onKeyDown={handleKeyDown}
            className="text-2xl font-bold bg-transparent border-none outline-none w-full text-foreground"
            placeholder="Document title..."
          />
        ) : (
          <h2 
            onClick={handleTitleEdit}
            className="text-2xl font-bold cursor-pointer text-foreground hover:text-primary transition-colors"
          >
            {documentTitle}
          </h2>
        )}
      </div>

      {/* Toolbar */}
      <div className="p-4 border-b border-border/30 bg-muted/20">
        <div className="flex items-center gap-1 flex-wrap">
          {/* Text Formatting */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFormat("bold")}
            className="hover-lift"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFormat("italic")}
            className="hover-lift"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFormat("underline")}
            className="hover-lift"
          >
            <Underline className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Alignment */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFormat("justifyLeft")}
            className="hover-lift"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFormat("justifyCenter")}
            className="hover-lift"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFormat("justifyRight")}
            className="hover-lift"
          >
            <AlignRight className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Lists */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFormat("insertUnorderedList")}
            className="hover-lift"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFormat("insertOrderedList")}
            className="hover-lift"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Media & Links */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = prompt("Enter URL:");
              if (url) handleFormat("createLink", url);
            }}
            className="hover-lift"
          >
            <Link className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = prompt("Enter image URL:");
              if (url) handleFormat("insertImage", url);
            }}
            className="hover-lift"
          >
            <Image className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Headings */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleFormat("formatBlock", e.target.value);
                e.target.value = "";
              }
            }}
            className="px-3 py-1 text-sm bg-background border border-border rounded-md hover-lift"
          >
            <option value="">Heading</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="p">Paragraph</option>
          </select>
        </div>
      </div>

      {/* Editor */}
      <div className="p-6 min-h-[500px]">
        <div
          ref={editorRef}
          contentEditable
          onInput={saveContent}
          className={cn(
            "min-h-[400px] outline-none text-base leading-relaxed",
            "prose prose-lg max-w-none",
            "focus:ring-2 focus:ring-primary/20 rounded-lg p-4",
            "transition-all duration-200"
          )}
          style={{
            fontSize: "16px",
            lineHeight: "1.6",
            color: "hsl(var(--foreground))"
          }}
          data-placeholder="Start writing your document..."
          suppressContentEditableWarning={true}
        >
          {!content && (
            <p className="text-muted-foreground">
              Start writing your document here... Use the toolbar above for formatting options.
            </p>
          )}
        </div>
      </div>

      {/* Real-time Collaboration Indicator */}
      <div className="px-6 py-3 border-t border-border/30 bg-muted/10">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-muted-foreground">Auto-saved</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Type className="w-4 h-4" />
            <span>You're editing as {userId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}