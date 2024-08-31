-- handle new user
-- This is an empty migration.-- For shadow database agreement
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users ( id uuid NOT NULL );

DO $$
  BEGIN
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $BODY$
      SELECT
        coalesce(
          nullif(current_setting('request.jwt.claim.sub', true), ''),
          (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
        )::uuid
    $BODY$;
  EXCEPTION
    WHEN duplicate_function THEN NULL;
  END;
$$;

-- handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (id, auth_user_id, username, full_name, avatar_url, email)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Anonymous'),
    -- Using format to dynamically insert the email into the URL
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', format('https://source.boringavatars.com/beam/120/%s', NEW.email)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();