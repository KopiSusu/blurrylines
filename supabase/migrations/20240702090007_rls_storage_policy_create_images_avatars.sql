-- Enable the pgvector extension
create extension if not exists vector;

-- use this to make sure that a uuid is provided in the string of the file
create or replace function public.uuid_or_null(str text)
returns uuid
language plpgsql
as $$
begin
  return str::uuid;
  exception when invalid_text_representation then
    return null;
  end;
$$;


-- AVATARS
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

create policy "Anyone can view avatar images." on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Anyone can upload an avatar." on storage.objects
  for insert with check (bucket_id = 'avatars');

  -- this checks to make sure the user is authorized to update the file, and the file belongs to them
create policy "Users can update their own avatars"
on storage.objects for update to authenticated with check (
  bucket_id = 'avatars' and
    owner = auth.uid() and
    public.uuid_or_null(path_tokens[1]) is not null and
    owner = public.uuid_or_null(path_tokens[1])
);

-- this checks to make sure the user is authorized to delete the file, and the file belongs to them
create policy "Users can delete their own avatars"
on storage.objects for delete to authenticated using (
  bucket_id = 'avatars' and
    owner = auth.uid() and
    public.uuid_or_null(path_tokens[1]) is not null and
    owner = public.uuid_or_null(path_tokens[1])
);


-- IMAGES
insert into storage.buckets (id, name, public)
  values ('images', 'images', true);

create policy "Anyone can view image images." on storage.objects
  for select using (bucket_id = 'images');

create policy "Anyone can upload an image." on storage.objects
  for insert with check (bucket_id = 'images');

create policy "Users can update their own images"
on storage.objects for update to authenticated with check (
  bucket_id = 'images' and
    owner = auth.uid() and
    public.uuid_or_null(path_tokens[1]) is not null and
    owner = public.uuid_or_null(path_tokens[1])
);

create policy "Users can delete their own images"
on storage.objects for delete to authenticated using (
  bucket_id = 'images' and
    owner = auth.uid() and
    public.uuid_or_null(path_tokens[1]) is not null and
    owner = public.uuid_or_null(path_tokens[1])
);

-- PRIVATE
insert into storage.buckets (id, name)
  values ('private', 'private');

  
create policy "Authenticated users can upload private files"
on storage.objects for insert to authenticated with check (
  bucket_id = 'private' and
    owner = auth.uid() and
    public.uuid_or_null(path_tokens[1]) is not null and
    public.uuid_or_null(path_tokens[2]) is not null and
    owner = public.uuid_or_null(path_tokens[1])
);

-- this checks to make sure the user is authorized to view the file, and the file belongs to them
create policy "Users can view their own private files"
on storage.objects for select to authenticated using (
  bucket_id = 'private' and
    owner = auth.uid() and
    public.uuid_or_null(path_tokens[1]) is not null and
    owner = public.uuid_or_null(path_tokens[1])
);

-- this checks to make sure the user is authorized to update the file, and the file belongs to them
create policy "Users can update their own private files"
on storage.objects for update to authenticated with check (
  bucket_id = 'private' and
    owner = auth.uid() and
    public.uuid_or_null(path_tokens[1]) is not null and
    owner = public.uuid_or_null(path_tokens[1])
);

-- this checks to make sure the user is authorized to delete the file, and the file belongs to them
create policy "Users can delete their own private files"
on storage.objects for delete to authenticated using (
  bucket_id = 'private' and
    owner = auth.uid() and
    public.uuid_or_null(path_tokens[1]) is not null and
    owner = public.uuid_or_null(path_tokens[1])
);
