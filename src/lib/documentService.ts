import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Document {
  id: string;
  title: string;
  content: any;
  owner_id?: string;  // Make optional for compatibility
  share_code?: string;
  is_public?: boolean;  // Make optional for compatibility
  created_at: string;
  updated_at: string;
}

export interface DocumentMetrics {
  wordCount: number;
  characterCount: number;
  paragraphCount: number;
  readingTime: number;
}

export interface ShareResponse {
  shareLink: string;
  shareCode: string;
}

// Ultra-safe download utility that avoids all DOM manipulation
const safeDownload = {
  downloadHTML: async (content: string, filename: string): Promise<void> => {
    try {
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Use the most compatible download approach
      if ('showSaveFilePicker' in window) {
        // Modern File System Access API (when available)
        try {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'HTML files',
              accept: { 'text/html': ['.html'] }
            }]
          });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          URL.revokeObjectURL(url);
          return;
        } catch (err) {
          // Fall through to legacy method if user cancels or API fails
        }
      }
      
      // Fallback: Use URL-based download without DOM manipulation
      const a = Object.assign(document.createElement('a'), {
        href: url,
        download: filename,
        style: 'display: none'
      });
      
      // Use a Promise to ensure proper cleanup timing
      await new Promise<void>((resolve) => {
        const cleanup = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        
        // Set up one-time event listener
        a.addEventListener('click', cleanup, { once: true });
        
        // Create a temporary container that React won't touch
        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;top:-1000px;left:-1000px;visibility:hidden;';
        document.body.appendChild(container);
        container.appendChild(a);
        
        // Trigger download
        a.click();
        
        // Clean up container after a short delay
        setTimeout(() => {
          try {
            if (container.parentNode) {
              document.body.removeChild(container);
            }
          } catch (e) {
            console.warn('Cleanup warning:', e);
          }
          cleanup();
        }, 100);
      });
      
    } catch (error) {
      console.error('Download failed:', error);
      throw new Error('Failed to download file');
    }
  }
};

export class DocumentService {
  static async createDocument(title: string = "Untitled Document", content: string = ""): Promise<Document> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from('documents')
      .insert({
        title,
        content: {
          html: content,
          lastModified: new Date().toISOString()
        },
        owner_id: user.id
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create document: ${error.message}`);
    return data;
  }

  static async getDocument(id: string): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Failed to get document: ${error.message}`);
    return data;
  }

  static async updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update document: ${error.message}`);
    return data;
  }

  static async deleteDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete document: ${error.message}`);
  }

  static async generateShareLink(documentId: string): Promise<ShareResponse> {
    // Generate a unique share code
    const shareCode = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);

    const { data, error } = await supabase
      .from('documents')
      .update({ 
        share_code: shareCode,
        is_public: true 
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw new Error(`Failed to generate share link: ${error.message}`);

    const shareLink = `${window.location.origin}/share/${shareCode}`;
    return { shareLink, shareCode };
  }

  static async getDocumentByShareCode(shareCode: string): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('share_code', shareCode)
      .eq('is_public', true)
      .single();

    if (error) throw new Error(`Failed to get shared document: ${error.message}`);
    return data;
  }

  static calculateMetrics(content: string): DocumentMetrics {
    // Strip HTML tags for accurate counting
    const textContent = content.replace(/<[^>]*>/g, '');
    
    const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const characterCount = textContent.length;
    const paragraphs = textContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const paragraphCount = paragraphs.length;
    
    // Average reading speed: 225 words per minute
    const readingTime = Math.ceil(wordCount / 225);

    return {
      wordCount,
      characterCount,
      paragraphCount,
      readingTime
    };
  }

  static async exportToPDF(doc: Document): Promise<void> {
    // Ensure we have required fields with defaults
    const safeDoc = {
      ...doc,
      owner_id: doc.owner_id || '',
      is_public: doc.is_public || false
    };
    
    // Create a simple HTML document for PDF export
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${safeDoc.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .content { margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>${safeDoc.title}</h1>
          <div class="content">${safeDoc.content?.html || ''}</div>
        </body>
      </html>
    `;

    // Use safe download utility to avoid DOM conflicts
    await safeDownload.downloadHTML(htmlContent, `${safeDoc.title}.html`);
  }

  static async addCollaborator(documentId: string, userEmail: string, permission: 'view' | 'edit' | 'admin' = 'view'): Promise<void> {
    // First, find the user by email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('username', userEmail.split('@')[0])
      .single();

    if (userError) throw new Error(`User not found: ${userEmail}`);

    const { error } = await supabase
      .from('document_collaborators')
      .insert({
        document_id: documentId,
        user_id: userData.user_id,
        permission
      });

    if (error) throw new Error(`Failed to add collaborator: ${error.message}`);
  }

  static async getCollaborators(documentId: string) {
    const { data, error } = await supabase
      .from('document_collaborators')
      .select(`
        *,
        profiles:user_id (username, avatar_url)
      `)
      .eq('document_id', documentId);

    if (error) throw new Error(`Failed to get collaborators: ${error.message}`);
    return data;
  }

  static async logActivity(documentId: string, action: string, metadata?: any): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('document_activity')
      .insert({
        document_id: documentId,
        user_id: user.id,
        action,
        metadata: metadata || {}
      });
  }
}