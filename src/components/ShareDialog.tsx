import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DocumentService } from "@/lib/documentService";
import { Copy, Mail, Link, Lock } from "lucide-react";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    title: string;
    share_code?: string;
  } | null;
}

export function ShareDialog({ open, onOpenChange, document }: ShareDialogProps) {
  const [shareLink, setShareLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const { toast } = useToast();

  const generateShareLink = async () => {
    if (!document) return;

    setLoading(true);
    try {
      const { shareLink } = await DocumentService.generateShareLink(document.id);
      setShareLink(shareLink);
      toast({
        title: "Share link generated",
        description: "Your document is now publicly accessible via the link.",
      });
    } catch (error) {
      toast({
        title: "Failed to generate share link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      toast({
        title: "Link copied",
        description: "Share link copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const inviteCollaborator = async () => {
    if (!document || !collaboratorEmail) return;

    setLoading(true);
    try {
      await DocumentService.addCollaborator(document.id, collaboratorEmail, 'edit');
      toast({
        title: "Collaborator invited",
        description: `${collaboratorEmail} has been added as a collaborator.`,
      });
      setCollaboratorEmail("");
      setInviteMessage("");
    } catch (error) {
      toast({
        title: "Failed to invite collaborator",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Share "{document?.title}"
          </DialogTitle>
          <DialogDescription>
            Share this document with others or invite collaborators.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Generate Share Link */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Public Share Link</Label>
            {shareLink ? (
              <div className="flex items-center space-x-2">
                <Input value={shareLink} readOnly className="flex-1" />
                <Button
                  type="button"
                  size="sm"
                  onClick={copyToClipboard}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={generateShareLink}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                <Link className="w-4 h-4 mr-2" />
                Generate Share Link
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view the document.
            </p>
          </div>

          {/* Invite Collaborators */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Invite Collaborators</Label>
            <div className="space-y-2">
              <Input
                placeholder="Enter email address"
                value={collaboratorEmail}
                onChange={(e) => setCollaboratorEmail(e.target.value)}
              />
              <Textarea
                placeholder="Add a message (optional)"
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                rows={3}
              />
              <Button
                onClick={inviteCollaborator}
                disabled={loading || !collaboratorEmail}
                className="w-full"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Invitation
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Collaborators can edit the document and see changes in real-time.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}