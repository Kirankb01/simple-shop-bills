-- Create a secure function to claim admin privileges (only if no admin exists)
CREATE OR REPLACE FUNCTION public.claim_admin_privileges(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Check if any admin exists
  SELECT COUNT(*) INTO admin_count
  FROM public.user_roles
  WHERE role = 'admin';
  
  -- Only allow claiming admin if no admin exists
  IF admin_count = 0 THEN
    -- Update the user's role to admin
    UPDATE public.user_roles
    SET role = 'admin'
    WHERE user_id = _user_id;
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.claim_admin_privileges(UUID) TO authenticated;