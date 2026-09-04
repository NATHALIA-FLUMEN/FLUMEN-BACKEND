-- ============================================================
-- Flumen Schema para Supabase (Postgres)
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- Extensión para passwords (seguridad)
create extension if not exists pgcrypto;

-- ============================================================
-- TABLA: profiles (usuarios con rol)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  avatar_url text,
  role text not null default 'client' check (role in ('admin', 'client')),
  password_hash text,
  google_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- TABLA: videos
-- ============================================================
create table if not exists public.videos (
  id bigserial primary key,
  title text not null,
  description text,
  thumbnail_path text,
  video_path text,
  video_bucket text,
  duration integer default 0,
  category text default 'General',
  tags text[] default '{}',
  price numeric(10,2) not null default 0,
  rating numeric(2,1) default 4.5,
  views bigint default 0,
  featured boolean default false,
  is_published boolean default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Columna video_bucket para registros existentes (idempotente si la tabla ya se creo antes)
alter table public.videos add column if not exists video_bucket text;

-- ============================================================
-- TABLA: orders (pagos / compras de videos)
-- ============================================================
create table if not exists public.orders (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  video_id bigint references public.videos(id) on delete cascade,
  amount numeric(10,2) not null,
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed', 'refunded')),
  payment_method text default 'card',
  created_at timestamptz not null default now(),
  unique (user_id, video_id)
);

-- ============================================================
-- TABLA: settings (personalización del sitio)
-- ============================================================
create table if not exists public.settings (
  id serial primary key,
  key text unique not null,
  value text not null,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Índices
-- ============================================================
create index if not exists idx_videos_category on public.videos(category);
create index if not exists idx_videos_featured on public.videos(featured) where featured = true;
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_profiles_role on public.profiles(role);

-- ============================================================
-- RLS (Row Level Security) - Aplicado con capacitación
-- ============================================================
alter table public.profiles enable row level security;
alter table public.videos enable row level security;
alter table public.orders enable row level security;
alter table public.settings enable row level security;

-- Los videos publicados son visibles para todos
drop policy if exists "videos_public_read" on public.videos;
create policy "videos_public_read"
  on public.videos for select
  using (is_published = true);

-- Los administradores pueden hacer todo con videos
drop policy if exists "videos_admin_all" on public.videos;
create policy "videos_admin_all"
  on public.videos for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Los perfiles visibles: solo el propio usuario o admins
drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read"
  on public.profiles for select
  using (
    auth.uid() = id or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Un usuario puede actualizar su propio perfil
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  using (auth.uid() = id);

-- Admins gestionan perfiles
drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
  on public.profiles for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Órdenes: el dueño ve las suyas, admins todas
drop policy if exists "orders_read" on public.orders;
create policy "orders_read"
  on public.orders for select
  using (
    auth.uid() = user_id or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Settings: lectura pública de keys, escritura solo admin
drop policy if exists "settings_read" on public.settings;
create policy "settings_read"
  on public.settings for select
  using (true);

drop policy if exists "settings_admin_all" on public.settings;
create policy "settings_admin_all"
  on public.settings for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- Bucket de Storage para videos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do nothing;

-- Políticas de storage: subir/borrar solo admin, leer todos
drop policy if exists "videos_storage_read" on storage.objects;
create policy "videos_storage_read"
  on storage.objects for select
  using (bucket_id = 'videos');

drop policy if exists "videos_storage_admin_write" on storage.objects;
create policy "videos_storage_admin_write"
  on storage.objects for insert
  with check (
    bucket_id = 'videos' and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "videos_storage_admin_delete" on storage.objects;
create policy "videos_storage_admin_delete"
  on storage.objects for delete
  using (
    bucket_id = 'videos' and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- Bucket PRIVADO para videos premium (protegido con URLs firmadas)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('videos-private', 'videos-private', false)
on conflict (id) do nothing;

-- Solo admins escriben en el bucket privado
drop policy if exists "videos_private_admin_write" on storage.objects;
create policy "videos_private_admin_write"
  on storage.objects for insert
  with check (
    bucket_id = 'videos-private' and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "videos_private_admin_delete" on storage.objects;
create policy "videos_private_admin_delete"
  on storage.objects for delete
  using (
    bucket_id = 'videos-private' and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- Settings por defecto
-- ============================================================
insert into public.settings (key, value) values
  ('siteName', 'Flumen'),
  ('tagline', 'Premium Videos'),
  ('heroTitle', 'Flumen Originals'),
  ('heroSubtitle', 'Experiencia visual en 4K Ultra HD'),
  ('heroDescription', 'Descubre contenido exclusivo, documentales y series premium solo para suscriptores de Flumen.'),
  ('heroButton', 'Reproducir ahora'),
  ('heroButtonSecondary', 'Más información'),
  ('footerText', 'Tu plataforma de referencia para contenido de video de alta calidad.'),
  ('accentColor', '#00e5ff'),
  ('supportEmail', 'soporte@Flumen.com'),
  ('enableRegistration', 'true'),
  ('enablePayments', 'true'),
  ('maintenanceMode', 'false')
on conflict (key) do nothing;

-- ============================================================
-- NOTA: la tabla users de Supabase Auth hace referencia cruzada.
-- Para creación del admin inicial, usar la ruta /api/auth/register
-- con el código maestro MASTER_ADMIN_CODE.
-- ============================================================
