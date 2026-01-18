import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  user_id: string;
  cattery_name: string | null;
  cattery_prefix: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Check if profile exists
    if (profile) {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);
      
      if (!error) {
        setProfile(prev => prev ? { ...prev, ...updates } : null);
      }
      return { error };
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('profiles')
        .insert({ user_id: user.id, ...updates })
        .select()
        .single();
      
      if (!error && data) {
        setProfile(data);
      }
      return { error };
    }
  };

  const getCatteryDisplayName = () => {
    if (profile?.cattery_prefix && profile?.cattery_name) {
      return `${profile.cattery_prefix}*${profile.cattery_name}`;
    }
    if (profile?.cattery_name) {
      return profile.cattery_name;
    }
    return 'Katteoppdrett';
  };

  return {
    profile,
    loading,
    updateProfile,
    getCatteryDisplayName,
  };
}
