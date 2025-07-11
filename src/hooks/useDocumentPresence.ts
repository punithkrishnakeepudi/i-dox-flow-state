import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface PresenceUser {
  id: string;
  email: string;
  username: string;
  lastSeen: string;
  status: 'online' | 'away' | 'offline';
}

export function useDocumentPresence(documentId: string) {
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
  const [viewers, setViewers] = useState<number>(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!documentId || !user) return;

    // Create a channel for this document
    const channel = supabase.channel(`document:${documentId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Track presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const users: PresenceUser[] = [];
        
        Object.keys(presenceState).forEach((key) => {
          const presence = presenceState[key][0];
          if (presence) {
            users.push({
              id: presence.user_id,
              email: presence.email,
              username: presence.username,
              lastSeen: presence.last_seen,
              status: 'online'
            });
          }
        });
        
        setActiveUsers(users);
        setViewers(users.length);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user's presence
          await channel.track({
            user_id: user.id,
            email: user.email,
            username: user.email?.split('@')[0] || 'Anonymous',
            last_seen: new Date().toISOString(),
          });
        }
      });

    // Cleanup on unmount
    return () => {
      channel.unsubscribe();
    };
  }, [documentId, user]);

  return { activeUsers, viewers };
}