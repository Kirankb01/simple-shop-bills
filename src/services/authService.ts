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
    const { data, error } = await supabase.rpc('admin_exists');
    
    if (error) {
      console.error('Error checking admin:', error);
      return false;
    }
    
    return data === true;
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

    // Claim admin privileges using the secure function
    const { data: claimResult, error: claimError } = await supabase
      .rpc('claim_admin_privileges', { _user_id: authData.user.id });

    if (claimError) {
      return { data: null, error: claimError };
    }

    if (!claimResult) {
      return { 
        data: null, 
        error: { message: 'Admin already exists. Please contact the administrator.' } as any
      };
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
