import { supabase } from '@/integrations/supabase/client';

export const authService = {
  async signUp(username: string, password: string, name: string) {
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

  async signIn(username: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${username}@smartbill.local`,
      password,
    });
    
    return { data, error };
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
    };
  },

  async getUserRole(userId: string): Promise<'admin' | 'staff'> {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    return (roles?.[0]?.role as 'admin' | 'staff') || 'staff';
  },

  async checkAdminExists(): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);
    
    if (error) {
      console.error('Error checking admin:', error);
      return false;
    }
    
    return data && data.length > 0;
  },

  async createAdminUser(username: string, password: string, name: string) {
    // First create the user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
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
    
    if (authError || !authData.user) {
      return { data: null, error: authError };
    }

    // Update user role to admin
    const { error: roleError } = await supabase
      .from('user_roles')
      .update({ role: 'admin' })
      .eq('user_id', authData.user.id);

    if (roleError) {
      return { data: null, error: roleError };
    }

    return { data: authData, error: null };
  },

  onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await authService.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  },
};
