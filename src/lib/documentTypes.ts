// Shared document types to ensure compatibility across components

export interface BaseDocument {
  id: string;
  title: string;
  content: any;
  created_at: string;
  updated_at: string;
}

export interface FullDocument extends BaseDocument {
  owner_id: string;
  is_public: boolean;
  share_code?: string;
}

// Type conversion utilities
export const toFullDocument = (doc: BaseDocument): FullDocument => ({
  ...doc,
  owner_id: (doc as any).owner_id || '',
  is_public: (doc as any).is_public || false,
  share_code: (doc as any).share_code
});

export const toBaseDocument = (doc: FullDocument): BaseDocument => ({
  id: doc.id,
  title: doc.title,
  content: doc.content,
  created_at: doc.created_at,
  updated_at: doc.updated_at
});