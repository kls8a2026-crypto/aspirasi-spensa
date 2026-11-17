-- Skema SQL Supabase untuk Aspirasi Siswa Online — SMP Negeri 1 Ungaran
-- Jalankan seluruh skrip ini di Supabase Dashboard → SQL Editor → New Query.

create extension if not exists pgcrypto;

-- 1. Tabel Aspirasi Siswa
create table if not exists public.aspirations (
  id text primary key,
  category text not null,
  message text not null,
  author text not null default 'Anonim',
  created_at timestamptz not null default now(),
  is_hidden boolean not null default false,
  is_sample boolean not null default false,
  admin_reply text,
  admin_replied_at timestamptz
);

create index if not exists idx_aspirations_created_at
  on public.aspirations (created_at desc);

create index if not exists idx_aspirations_is_hidden
  on public.aspirations (is_hidden);

-- 2. Tabel Pengaturan Media (Logo Sekolah & Galeri Foto)
create table if not exists public.media_settings (
  id text primary key,
  school_logo_url text,
  explore_gallery_urls jsonb not null default '[]'::jsonb,
  write_gallery_urls jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- 3. Tabel Daftar Email Admin Tambahan (selain admin utama kls8a2026@gmail.com)
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- Daftarkan admin utama secara bawaan
insert into public.admin_users (email)
values ('kls8a2026@gmail.com')
on conflict (email) do nothing;

-- 4. Aktifkan Row Level Security (RLS)
alter table public.aspirations enable row level security;
alter table public.media_settings enable row level security;
alter table public.admin_users enable row level security;

-- Helper check: apakah pengguna JWT saat ini adalah Admin
create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') = 'kls8a2026@gmail.com'
    or exists (
      select 1
      from public.admin_users a
      where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    ),
    false
  );
$$;

-- Kebijakan RLS untuk public.aspirations
drop policy if exists "Public can read visible aspirations" on public.aspirations;
create policy "Public can read visible aspirations"
  on public.aspirations
  for select
  using (is_hidden = false or public.is_app_admin());

drop policy if exists "Public can submit aspirations" on public.aspirations;
create policy "Public can submit aspirations"
  on public.aspirations
  for insert
  with check (
    char_length(trim(message)) between 10 and 500
    and char_length(author) <= 40
    and is_hidden = false
    and is_sample = false
    and admin_reply is null
    and admin_replied_at is null
  );

drop policy if exists "Admin can manage aspirations" on public.aspirations;
create policy "Admin can manage aspirations"
  on public.aspirations
  for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- Kebijakan RLS untuk public.media_settings
drop policy if exists "Public can read media settings" on public.media_settings;
create policy "Public can read media settings"
  on public.media_settings
  for select
  using (true);

drop policy if exists "Admin can manage media settings" on public.media_settings;
create policy "Admin can manage media settings"
  on public.media_settings
  for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- Kebijakan RLS untuk public.admin_users
drop policy if exists "Admin can view admin users" on public.admin_users;
create policy "Admin can view admin users"
  on public.admin_users
  for select
  using (public.is_app_admin());

-- 5. Isi Otomatis Data Awal (Media Bawaan & 6 Aspirasi Contoh)
insert into public.media_settings (
  id,
  school_logo_url,
  explore_gallery_urls,
  write_gallery_urls
)
values (
  'media',
  null,
  '["/src/assets/images/poster_stop_bullying_1794848600284.jpg", "/src/assets/images/poster_be_a_friend_1794848600875.jpg", "/src/assets/images/hero_aspirasi_ilustrasi_1794848601330.jpg"]'::jsonb,
  '["/src/assets/images/poster_be_a_friend_1794848600875.jpg", "/src/assets/images/poster_stop_bullying_1794848600284.jpg"]'::jsonb
)
on conflict (id) do nothing;

insert into public.aspirations (
  id,
  category,
  message,
  author,
  created_at,
  is_hidden,
  is_sample,
  admin_reply,
  admin_replied_at
)
values
  (
    'sample-1',
    'Lingkungan dan Kebersihan',
    'Semoga di depan setiap kelas dan dekat kantin ditambah tempat sampah terpilah (organik dan anorganik) supaya siswa makin terbiasa memilah sampah sejak dini.',
    'Raka Pratama - 8B',
    '2026-11-15T08:30:00.000Z',
    false,
    true,
    null,
    null
  ),
  (
    'sample-2',
    'Keamanan dan Anti-Bullying',
    'Saya sangat setuju sekolah kita punya gerakan saling dukung antarangkatan. Semoga ada kegiatan kelas inspirasi atau peer counselor supaya teman yang merasa sendirian punya tempat cerita yang aman.',
    'Anonim',
    '2026-11-14T13:15:00.000Z',
    false,
    true,
    null,
    null
  ),
  (
    'sample-3',
    'Fasilitas Sekolah',
    'Kran air di area cuci tangan lapangan basket bagian timur alirannya agak kecil. Mohon bisa dicek agar nyaman dipakai setelah jam olahraga.',
    'Nadia Putri - 9A',
    '2026-11-13T10:45:00.000Z',
    false,
    true,
    null,
    null
  ),
  (
    'sample-4',
    'Pembelajaran',
    'Belajar IPA dengan praktik langsung di laboratorium sangat seru! Semoga frekuensi praktikum sederhana bisa lebih rutin untuk kelas 7 dan 8.',
    'Anonim',
    '2026-11-12T09:20:00.000Z',
    false,
    true,
    null,
    null
  ),
  (
    'sample-5',
    'Kegiatan dan Ekstrakurikuler',
    'Boleh dong diadakan festival karya dan pentas seni antarkelas di akhir semester agar bakat musik, tari, dan desain teman-teman bisa tampil.',
    'Dimas Aji - 8E',
    '2026-11-11T14:05:00.000Z',
    false,
    true,
    null,
    null
  ),
  (
    'sample-6',
    'OSIS dan Organisasi',
    'Terima kasih OSIS yang sudah rutin membuat mading digital. Kalau bisa jadwal lomba classmeeting diumumkan seminggu lebih awal supaya tiap kelas bisa persiapan lebih matang.',
    'Salsa Kirana - 7C',
    '2026-11-10T11:10:00.000Z',
    false,
    true,
    'Terima kasih atas sarannya, Salsa! Pengurus OSIS sudah menjadwalkan publikasi panduan dan jadwal lomba classmeeting minimal 7 hari sebelum acara berlangsung melalui mading digital dan grup ketua kelas.',
    '2026-11-10T15:40:00.000Z'
  )
on conflict (id) do nothing;

