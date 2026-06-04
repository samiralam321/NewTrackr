-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  bio text,
  college text,
  resume_url text,
  resume_name text,
  consistency_score integer default 0,
  last_post_date date,
  badge_level integer default 0,
  badge_earned_at timestamp with time zone,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- Profile policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create posts table
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  image_url text,
  tags text[] default '{}',
  time_spent integer, -- in minutes
  type text check (type in ('Learned', 'Built', 'Practiced', 'Other')),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for posts
alter table public.posts enable row level security;

-- Post policies
create policy "Posts are viewable by everyone."
  on posts for select
  using ( true );

create policy "Users can insert their own posts."
  on posts for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own posts."
  on posts for update
  using ( auth.uid() = user_id );

create policy "Users can delete own posts."
  on posts for delete
  using ( auth.uid() = user_id );

-- Create comments table
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for comments
alter table public.comments enable row level security;

-- Comment policies
create policy "Comments are viewable by everyone."
  on comments for select
  using ( true );

create policy "Users can insert their own comments."
  on comments for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete own comments."
  on comments for delete
  using ( auth.uid() = user_id );

-- Create likes table
create table public.likes (
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (post_id, user_id)
);

-- Enable RLS for likes
alter table public.likes enable row level security;

-- Like policies
create policy "Likes are viewable by everyone."
  on likes for select
  using ( true );

create policy "Users can insert their own likes."
  on likes for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete own likes."
  on likes for delete
  using ( auth.uid() = user_id );

-- Storage bucket setup
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
insert into storage.buckets (id, name, public) values ('post_images', 'post_images', true);
insert into storage.buckets (id, name, public) values ('resumes', 'resumes', true);

-- Storage policies for avatars
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );

create policy "Anyone can update their avatar."
  on storage.objects for update
  using ( bucket_id = 'avatars' );

-- Storage policies for post images
create policy "Post images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'post_images' );

create policy "Anyone can upload post images."
  on storage.objects for insert
  with check ( bucket_id = 'post_images' );

-- Storage policies for resumes
create policy "Resumes are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'resumes' );

create policy "Anyone can upload a resume."
  on storage.objects for insert
  with check ( bucket_id = 'resumes' );

create policy "Anyone can update their resume."
  on storage.objects for update
  using ( bucket_id = 'resumes' );

create policy "Anyone can delete their resume."
  on storage.objects for delete
  using ( bucket_id = 'resumes' );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable replication for realtime channels
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.likes;

-- Create notifications table
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null, -- Receiver
  actor_id uuid references public.profiles(id) on delete cascade not null, -- Who did it
  type text check (type in ('like', 'comment', 'follow', 'mention', 'badge')),
  post_id uuid references public.posts(id) on delete cascade,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on notifications for select
  using ( auth.uid() = user_id );

create policy "Users can update their own notifications"
  on notifications for update
  using ( auth.uid() = user_id );

create policy "System can insert notifications"
  on notifications for insert
  with check ( true );

-- Notification Trigger for Likes
create or replace function public.handle_new_like()
returns trigger as $$
declare
  post_owner uuid;
begin
  select user_id into post_owner from public.posts where id = new.post_id;
  
  -- Don't notify if user likes their own post
  if post_owner != new.user_id then
    insert into public.notifications (user_id, actor_id, type, post_id)
    values (post_owner, new.user_id, 'like', new.post_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_like_created
  after insert on public.likes
  for each row execute procedure public.handle_new_like();

-- Notification Trigger for Comments
create or replace function public.handle_new_comment()
returns trigger as $$
declare
  post_owner uuid;
begin
  select user_id into post_owner from public.posts where id = new.post_id;
  
  -- Don't notify if user comments on their own post
  if post_owner != new.user_id then
    insert into public.notifications (user_id, actor_id, type, post_id)
    values (post_owner, new.user_id, 'comment', new.post_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_comment_created
  after insert on public.comments
  for each row execute procedure public.handle_new_comment();


-- Create messages table
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.messages enable row level security;

create policy "Users can view their own messages"
  on messages for select
  using ( auth.uid() = sender_id or auth.uid() = receiver_id );

create policy "Users can insert messages"
  on messages for insert
  with check ( auth.uid() = sender_id );

create policy "Users can update received messages"
  on messages for update
  using ( auth.uid() = receiver_id );

-- Enable replication for new tables
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;

-- Create bookmarks table
create table public.bookmarks (
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (post_id, user_id)
);

alter table public.bookmarks enable row level security;

create policy "Users can view own bookmarks"
  on bookmarks for select
  using ( auth.uid() = user_id );

create policy "Users can insert own bookmarks"
  on bookmarks for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete own bookmarks"
  on bookmarks for delete
  using ( auth.uid() = user_id );

alter publication supabase_realtime add table public.bookmarks;

-- Create follows table
create table public.follows (
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (follower_id, following_id)
);

alter table public.follows enable row level security;

create policy "Public can view follows"
  on follows for select
  using ( true );

create policy "Users can follow others"
  on follows for insert
  with check ( auth.uid() = follower_id );

create policy "Users can unfollow"
  on follows for delete
  using ( auth.uid() = follower_id );

alter publication supabase_realtime add table public.follows;

-- Follow Notification Trigger
create or replace function public.handle_new_follow()
returns trigger as $$
begin
  insert into public.notifications (user_id, actor_id, type)
  values (new.following_id, new.follower_id, 'follow');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_follow_created on public.follows;
create trigger on_follow_created
  after insert on public.follows
  for each row execute procedure public.handle_new_follow();
