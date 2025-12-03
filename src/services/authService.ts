import { supabase } from '@/integrations/supabase/client';

export const authService = {
  // Ensure super-admin exists (called on app startup)
  async ensureSuperAdmin() {
    try {
      const { error } = await supabase.rpc('ensure_super_admin');
      if (error) {
        console.error('Error ensuring super-admin:', error);
        return { error };
      }
      return { error: null };
    } catch (error) {
      console.error('Failed to ensure super-admin:', error);
      return { error };
    }
  },

  async signIn(username: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${username}@smartbill.local`,
      password,
    });
    
    if (error) return { data: null, error };

    // Check if user is active
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', data.user.id)
      .single();

    if (!profile?.is_active) {
      await supabase.auth.signOut();
      return { 
        data: null, 
        error: { message: 'Account is disabled. Contact administrator.' } as any 
      };
    }
    
    return { data, error: null };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const role = roles?.[0]?.role || 'staff';

    return {
      id: user.id,
      username: profile?.username || '',
      name: profile?.name || '',
      role: role as 'admin' | 'staff',
      isActive: profile?.is_active ?? true,
      locked: profile?.locked ?? false,
    };
  },

  async getUserRole(userId: string): Promise<'admin' | 'staff'> {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    return (roles?.[0]?.role as 'admin' | 'staff') || 'staff';
  },

  // Admin functions for managing staff
  async createStaffUser(username: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email: `${username}@smartbill.local`,
      password,
      options: {
        data: {
          username,
          name,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    
    return { data, error };
  },

  async toggleUserActive(userId: string, isActive: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', userId);
    
    return { error };
  },

  async resetUserPassword(userId: string, newPassword: string) {
    // This requires admin privileges
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: 'Not authenticated' } as any };

    const role = await this.getUserRole(user.id);
    if (role !== 'admin') {
      return { error: { message: 'Unauthorized' } as any };
    }

    // Get user email
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();

    if (!profile) {
      return { error: { message: 'User not found' } as any };
    }

    // Note: Password reset requires admin API access
    // For now, we'll return a message that this needs backend implementation
    return { 
      error: { 
        message: 'Password reset requires backend implementation. Use Supabase dashboard for now.' 
      } as any 
    };
  },

  async deleteStaffUser(userId: string) {
    // Check if user is locked (super-admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('locked')
      .eq('id', userId)
      .single();

    if (profile?.locked) {
      return { error: { message: 'Cannot delete super-admin' } as any };
    }

    // Delete user (cascade will handle profiles and roles)
    const { error } = await supabase.auth.admin.deleteUser(userId);
    return { error };
  },

  onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      // Defer Supabase calls with setTimeout to prevent deadlock
      if (session?.user) {
        setTimeout(async () => {
          const user = await authService.getCurrentUser();
          callback(user);
        }, 0);
      } else {
        callback(null);
      }
    });
  },
};
