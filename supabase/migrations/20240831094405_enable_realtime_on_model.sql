-- Check if the table 'previews' is already in the publication 'supabase_realtime'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'previews'
  ) THEN
    -- Add the table to the publication if it is not already included
    ALTER PUBLICATION supabase_realtime ADD TABLE public.previews;
  END IF;
END $$;
