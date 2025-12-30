-- Rename full_name to username in profiles table
ALTER TABLE public.profiles RENAME COLUMN full_name TO username;

-- Update the handle_new_user function to use username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'username'
  );
  RETURN NEW;
END;
$$;