-- Add isActive and locked fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS locked BOOLEAN NOT NULL DEFAULT false;

-- Create function to ensure super-admin exists
CREATE OR REPLACE FUNCTION public.ensure_super_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count INTEGER;
  new_user_id UUID;
BEGIN
  -- Check if any admin exists
  SELECT COUNT(*) INTO admin_count
  FROM public.user_roles
  WHERE role = 'admin';
  
  -- Only create super-admin if no admin exists
  IF admin_count = 0 THEN
    -- Create the super-admin user in auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@smartbill.local',
      crypt('admin123', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"username":"admin","name":"Super Admin"}',
      NOW(),
      NOW(),
      '',
      ''
    )
    RETURNING id INTO new_user_id;
    
    -- Create profile for super-admin
    INSERT INTO public.profiles (id, username, name, is_active, locked)
    VALUES (new_user_id, 'admin', 'Super Admin', true, true);
    
    -- Assign admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, 'admin');
  END IF;
END;
$$;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION public.ensure_super_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_super_admin() TO postgres;