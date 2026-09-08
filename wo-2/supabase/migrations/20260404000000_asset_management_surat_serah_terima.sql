-- Asset Management + Surat Serah Terima for digitalteamsrt.com.
-- Requires public.profiles(id uuid, role text) and public.work_orders(id uuid).
create extension if not exists pgcrypto;

create sequence if not exists public.surat_document_number_seq;

-- Helper: Safe cast string to UUID to avoid unhandled exception in storage policy
create or replace function public.safe_cast_uuid(p_val text)
returns uuid language plpgsql immutable as $$
begin
  if p_val ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return p_val::uuid;
  end if;
  return null;
exception when others then
  return null;
end $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

-- 1. Tabel public.assets
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  category text not null,
  serial_number text,
  asset_value bigint not null default 0 check (asset_value >= 0),
  status text not null default 'available'
    check (status in ('available','in_use','maintenance','retired')),
  current_holder_id uuid references public.profiles(id) on delete set null,
  acquired_at date,
  notes text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (btrim(code) <> ''),
  check (btrim(name) <> ''),
  check (btrim(category) <> ''),
  check (status <> 'in_use' or current_holder_id is not null)
);
create unique index if not exists assets_code_ci_key on public.assets (lower(code));
create unique index if not exists assets_serial_number_ci_key on public.assets (lower(serial_number))
  where serial_number is not null and btrim(serial_number) <> '';
create index if not exists assets_status_idx on public.assets(status);
create index if not exists assets_category_idx on public.assets(category);
create index if not exists assets_holder_idx on public.assets(current_holder_id);
create index if not exists assets_status_category_idx on public.assets(status, category);

-- 2. Tabel public.surat_serah_terima
create table if not exists public.surat_serah_terima (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete restrict,
  document_number text not null unique,
  document_type text not null check (document_type in ('handover','return')),
  document_date date not null default current_date,
  giver_id uuid not null references public.profiles(id) on delete restrict,
  receiver_id uuid not null references public.profiles(id) on delete restrict,
  hrd_id uuid references public.profiles(id) on delete set null,
  giver_name text not null,
  giver_department text not null,
  receiver_name text not null,
  receiver_department text not null,
  hrd_name text,
  notes text,
  status text not null default 'draft'
    check (status in ('draft','awaiting_recipient_signature','completed','cancelled')),
  giver_signature_path text,
  receiver_signature_path text,
  hrd_signature_path text,
  giver_signed_at timestamptz,
  receiver_signed_at timestamptz,
  hrd_signed_at timestamptz,
  pdf_path text,
  finalized_at timestamptz,
  cancelled_at timestamptz,
  version integer not null default 1 check (version > 0),
  created_by uuid not null references public.profiles(id) on delete restrict default auth.uid(),
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (btrim(document_number) <> ''),
  check (btrim(giver_name) <> '' and btrim(giver_department) <> ''),
  check (btrim(receiver_name) <> '' and btrim(receiver_department) <> ''),
  -- Path sanitization: tidak boleh string kosong / whitespace
  check (giver_signature_path is null or btrim(giver_signature_path) <> ''),
  check (receiver_signature_path is null or btrim(receiver_signature_path) <> ''),
  check (hrd_signature_path is null or btrim(hrd_signature_path) <> ''),
  check (pdf_path is null or btrim(pdf_path) <> ''),
  -- Konsistensi path dan timestamp ttd
  check ((giver_signature_path is null) = (giver_signed_at is null)),
  check ((receiver_signature_path is null) = (receiver_signed_at is null)),
  check ((hrd_signature_path is null) = (hrd_signed_at is null)),
  -- Two-way check constraint untuk status 'completed'
  check (
    (status = 'completed' and finalized_at is not null and pdf_path is not null
     and giver_signature_path is not null and receiver_signature_path is not null)
    or
    (status <> 'completed' and finalized_at is null)
  ),
  -- Two-way check constraint untuk status 'cancelled'
  check (
    (status = 'cancelled' and cancelled_at is not null)
    or
    (status <> 'cancelled' and cancelled_at is null)
  )
);
create index if not exists surat_work_order_idx on public.surat_serah_terima(work_order_id);
create index if not exists surat_receiver_idx on public.surat_serah_terima(receiver_id);
create index if not exists surat_giver_idx on public.surat_serah_terima(giver_id);
create index if not exists surat_status_date_idx on public.surat_serah_terima(status, document_date desc);
create index if not exists surat_receiver_status_idx on public.surat_serah_terima(receiver_id, status);
create index if not exists surat_work_order_type_idx on public.surat_serah_terima(work_order_id, document_type);

-- 3. Tabel public.surat_serah_terima_items
create table if not exists public.surat_serah_terima_items (
  id uuid primary key default gen_random_uuid(),
  surat_id uuid not null references public.surat_serah_terima(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete restrict,
  asset_code text not null,
  asset_name text not null,
  asset_category text not null,
  asset_serial_number text,
  asset_value bigint not null check (asset_value >= 0),
  handover_condition text not null,
  return_condition text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (surat_id, asset_id),
  check (btrim(asset_code) <> '' and btrim(asset_name) <> '' and btrim(asset_category) <> ''),
  check (btrim(handover_condition) <> '')
);
create index if not exists surat_items_surat_idx on public.surat_serah_terima_items(surat_id);
create index if not exists surat_items_asset_idx on public.surat_serah_terima_items(asset_id);

-- Triggers updated_at
drop trigger if exists assets_touch on public.assets;
create trigger assets_touch before update on public.assets
for each row execute function public.touch_updated_at();

drop trigger if exists surat_touch on public.surat_serah_terima;
create trigger surat_touch before update on public.surat_serah_terima
for each row execute function public.touch_updated_at();

drop trigger if exists surat_items_touch on public.surat_serah_terima_items;
create trigger surat_items_touch before update on public.surat_serah_terima_items
for each row execute function public.touch_updated_at();

-- Role helper
create or replace function public.is_asset_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('admin','head_it')
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin','head_it')
  );
$$;
revoke all on function public.is_asset_admin() from public;
grant execute on function public.is_asset_admin() to authenticated;

-- Helper visibility check
create or replace function public.can_read_surat(p_surat_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_asset_admin() or exists (
    select 1 from public.surat_serah_terima
    where id = p_surat_id and auth.uid() in (giver_id, receiver_id, hrd_id, created_by)
  )
$$;
revoke all on function public.can_read_surat(uuid) from public;
grant execute on function public.can_read_surat(uuid) to authenticated;

-- 4. Triggers Immutability & Actor Enforcement
create or replace function public.reject_completed_surat_changes()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.status in ('completed', 'cancelled') then
    raise exception 'Dokumen berstatus % bersifat permanen (immutable) dan tidak dapat diubah atau dihapus.', old.status using errcode = '55000';
  end if;
  if tg_op = 'UPDATE' and new.created_by is distinct from old.created_by then
    raise exception 'Kolom created_by bersifat tetap (immutable) dan tidak dapat diubah.' using errcode = '55000';
  end if;
  return new;
end $$;

drop trigger if exists surat_completed_immutable on public.surat_serah_terima;
create trigger surat_completed_immutable
before update or delete on public.surat_serah_terima
for each row execute function public.reject_completed_surat_changes();

create or replace function public.reject_completed_item_changes()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_surat_status text;
begin
  select status into v_surat_status
  from public.surat_serah_terima
  where id = coalesce(old.surat_id, new.surat_id);

  if v_surat_status in ('completed', 'cancelled') then
    raise exception 'Item dokumen berstatus % bersifat permanen (immutable) dan tidak dapat diubah atau dihapus.', v_surat_status using errcode = '55000';
  end if;
  if tg_op = 'UPDATE' and new.created_by is distinct from old.created_by then
    raise exception 'Kolom created_by bersifat tetap (immutable) dan tidak dapat diubah.' using errcode = '55000';
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists surat_items_completed_immutable on public.surat_serah_terima_items;
create trigger surat_items_completed_immutable
before insert or update or delete on public.surat_serah_terima_items
for each row execute function public.reject_completed_item_changes();

-- 5. RPC: Nomor Dokumen
create or replace function public.next_surat_document_number()
returns text language sql volatile security definer set search_path = '' as $$
  select lpad(nextval('public.surat_document_number_seq')::text, 6, '0')
    || '/SST/' || extract(year from current_date)::integer::text
$$;
revoke all on function public.next_surat_document_number() from public;
grant execute on function public.next_surat_document_number() to authenticated;

-- 6. RPC: Buat Draft Surat (Handover / Return)
create or replace function public.create_surat_draft(
  p_work_order_id uuid,
  p_document_type text,
  p_giver_id uuid,
  p_receiver_id uuid,
  p_giver_name text,
  p_giver_department text,
  p_receiver_name text,
  p_receiver_department text,
  p_asset_ids uuid[],
  p_notes text default null,
  p_hrd_id uuid default null,
  p_hrd_name text default null
) returns public.surat_serah_terima
language plpgsql security definer set search_path = '' as $$
declare
  v_actor_id uuid;
  d public.surat_serah_terima;
  a public.assets;
begin
  if not public.is_asset_admin() then
    raise exception 'Akses ditolak: Hanya Admin/Head IT yang berhak membuat surat' using errcode = '42501';
  end if;

  v_actor_id := auth.uid();
  if v_actor_id is null then
    raise exception 'Akses ditolak: Sesi otentikasi tidak ditemukan' using errcode = '42501';
  end if;

  if p_document_type not in ('handover','return') or coalesce(array_length(p_asset_ids, 1), 0) = 0 then
    raise exception 'Input dokumen tidak valid' using errcode = '22023';
  end if;

  insert into public.surat_serah_terima (
    work_order_id, document_number, document_type, giver_id, receiver_id,
    hrd_id, giver_name, giver_department, receiver_name, receiver_department,
    hrd_name, notes, status, created_by
  ) values (
    p_work_order_id, public.next_surat_document_number(), p_document_type,
    p_giver_id, p_receiver_id, p_hrd_id,
    p_giver_name, p_giver_department, p_receiver_name, p_receiver_department,
    p_hrd_name, p_notes, 'draft', v_actor_id
  ) returning * into d;

  for a in select * from public.assets where id = any(p_asset_ids) for update loop
    if p_document_type = 'handover' and (
      a.status <> 'available' or exists (
        select 1 from public.surat_serah_terima_items i
        join public.surat_serah_terima s on s.id = i.surat_id
        where i.asset_id = a.id and s.document_type = 'handover'
          and s.status in ('draft', 'awaiting_recipient_signature')
      )
    ) then
      raise exception 'Aset % (%) sedang tidak tersedia untuk penyerahan', a.name, a.code using errcode = '23514';
    end if;

    if p_document_type = 'return' and (
      a.status <> 'in_use' or a.current_holder_id <> p_giver_id
    ) then
      raise exception 'Aset % (%) tidak sedang dipegang oleh pihak pengembali', a.name, a.code using errcode = '23514';
    end if;

    insert into public.surat_serah_terima_items (
      surat_id, asset_id, asset_code, asset_name, asset_category,
      asset_serial_number, asset_value, handover_condition, created_by
    ) values (
      d.id, a.id, a.code, a.name, a.category,
      a.serial_number, a.asset_value, 'baik', v_actor_id
    );
  end loop;

  if (select count(*) from public.surat_serah_terima_items where surat_id = d.id) <> array_length(p_asset_ids, 1) then
    raise exception 'Satu atau lebih ID aset tidak ditemukan' using errcode = '23503';
  end if;

  return d;
end $$;
revoke all on function public.create_surat_draft(uuid,text,uuid,uuid,text,text,text,text,uuid[],text,uuid,text) from public;
grant execute on function public.create_surat_draft(uuid,text,uuid,uuid,text,text,text,text,uuid[],text,uuid,text) to authenticated;

-- 7. RPC: Tanda Tangan Pemberi (Transisi: draft -> awaiting_recipient_signature)
create or replace function public.sign_surat_as_giver(p_surat_id uuid, p_signature_path text)
returns public.surat_serah_terima
language plpgsql security definer set search_path = '' as $$
declare
  d public.surat_serah_terima;
begin
  if nullif(btrim(p_signature_path), '') is null then
    raise exception 'Path tanda tangan wajib diisi' using errcode = '22023';
  end if;

  select * into d from public.surat_serah_terima where id = p_surat_id for update;
  if d.id is null then
    raise exception 'Surat tidak ditemukan' using errcode = 'P0002';
  end if;

  if d.status <> 'draft' then
    raise exception 'Hanya surat berstatus draft yang dapat ditandatangani oleh penyerah' using errcode = '23514';
  end if;

  if auth.uid() <> d.giver_id and not public.is_asset_admin() then
    raise exception 'Akses ditolak: Hanya penyerah atau Admin yang berhak menandatangani bagian ini' using errcode = '42501';
  end if;

  update public.surat_serah_terima set
    giver_signature_path = p_signature_path,
    giver_signed_at = now(),
    status = 'awaiting_recipient_signature',
    updated_by = auth.uid()
  where id = d.id
  returning * into d;

  return d;
end $$;
revoke all on function public.sign_surat_as_giver(uuid,text) from public;
grant execute on function public.sign_surat_as_giver(uuid,text) to authenticated;

-- 8. RPC: Tanda Tangan Penerima
create or replace function public.sign_surat_as_receiver(p_surat_id uuid, p_signature_path text)
returns public.surat_serah_terima
language plpgsql security definer set search_path = '' as $$
declare
  d public.surat_serah_terima;
begin
  if nullif(btrim(p_signature_path), '') is null then
    raise exception 'Path tanda tangan wajib diisi' using errcode = '22023';
  end if;

  select * into d from public.surat_serah_terima where id = p_surat_id for update;
  if d.id is null then
    raise exception 'Surat tidak ditemukan' using errcode = 'P0002';
  end if;

  if d.status <> 'awaiting_recipient_signature' then
    raise exception 'Surat belum siap ditandatangani oleh penerima atau sudah selesai' using errcode = '23514';
  end if;

  if auth.uid() <> d.receiver_id and not public.is_asset_admin() then
    raise exception 'Akses ditolak: Hanya penerima yang berhak menandatangani dokumen ini' using errcode = '42501';
  end if;

  update public.surat_serah_terima set
    receiver_signature_path = p_signature_path,
    receiver_signed_at = now(),
    updated_by = auth.uid()
  where id = d.id
  returning * into d;

  return d;
end $$;
revoke all on function public.sign_surat_as_receiver(uuid,text) from public;
grant execute on function public.sign_surat_as_receiver(uuid,text) to authenticated;

-- 9. RPC: Tanda Tangan HRD (Opsional/Bila Diisi)
create or replace function public.sign_surat_as_hrd(p_surat_id uuid, p_signature_path text)
returns public.surat_serah_terima
language plpgsql security definer set search_path = '' as $$
declare
  d public.surat_serah_terima;
begin
  if nullif(btrim(p_signature_path), '') is null then
    raise exception 'Path tanda tangan wajib diisi' using errcode = '22023';
  end if;

  select * into d from public.surat_serah_terima where id = p_surat_id for update;
  if d.id is null then
    raise exception 'Surat tidak ditemukan' using errcode = 'P0002';
  end if;

  if d.hrd_id is null then
    raise exception 'Dokumen ini tidak memerlukan pengesahan HRD' using errcode = '22023';
  end if;

  if auth.uid() <> d.hrd_id and not public.is_asset_admin() then
    raise exception 'Akses ditolak: Hanya HRD terkait atau Admin yang dapat menandatangani' using errcode = '42501';
  end if;

  update public.surat_serah_terima set
    hrd_signature_path = p_signature_path,
    hrd_signed_at = now(),
    updated_by = auth.uid()
  where id = d.id
  returning * into d;

  return d;
end $$;
revoke all on function public.sign_surat_as_hrd(uuid,text) from public;
grant execute on function public.sign_surat_as_hrd(uuid,text) to authenticated;

-- 10. RPC: Finalisasi Surat & Mutasi Kustodi Aset Atomik
create or replace function public.finalize_surat(p_surat_id uuid, p_pdf_path text)
returns public.surat_serah_terima
language plpgsql security definer set search_path = '' as $$
declare
  d public.surat_serah_terima;
  aid uuid;
begin
  if not public.is_asset_admin() then
    raise exception 'Akses ditolak: Hanya Admin/Head IT yang dapat memfinalisasi surat' using errcode = '42501';
  end if;

  if nullif(btrim(p_pdf_path), '') is null then
    raise exception 'Path arsip PDF wajib disertakan' using errcode = '22023';
  end if;

  select * into d from public.surat_serah_terima where id = p_surat_id for update;
  if d.id is null then
    raise exception 'Surat tidak ditemukan' using errcode = 'P0002';
  end if;

  if d.status <> 'awaiting_recipient_signature' then
    raise exception 'Status surat tidak valid untuk difinalisasi (saat ini: %)', d.status using errcode = '23514';
  end if;

  if d.giver_signature_path is null or d.receiver_signature_path is null then
    raise exception 'Tanda tangan penyerah dan penerima wajib lengkap sebelum finalisasi' using errcode = '23514';
  end if;

  if d.hrd_id is not null and d.hrd_signature_path is null then
    raise exception 'Tanda tangan HRD wajib dilengkapi sebelum finalisasi' using errcode = '23514';
  end if;

  -- Mutasi kepemilikan aset
  for aid in select asset_id from public.surat_serah_terima_items where surat_id = d.id for update loop
    if d.document_type = 'handover' then
      update public.assets
      set status = 'in_use', current_holder_id = d.receiver_id, updated_by = auth.uid()
      where id = aid;
    else
      update public.assets
      set status = 'available', current_holder_id = null, updated_by = auth.uid()
      where id = aid and current_holder_id = d.giver_id;

      if not found then
        raise exception 'Inkonsistensi: Pemberi pengembalian bukan pemegang aset aktif saat ini' using errcode = '23514';
      end if;
    end if;
  end loop;

  -- Update status surat ke 'completed'
  update public.surat_serah_terima set
    status = 'completed',
    pdf_path = p_pdf_path,
    finalized_at = now(),
    updated_by = auth.uid()
  where id = d.id
  returning * into d;

  -- Sinkronisasi status Work Order
  update public.work_orders
  set status = 'Completed', completed_at = coalesce(completed_at, now())
  where id = d.work_order_id;

  return d;
end $$;
revoke all on function public.finalize_surat(uuid,text) from public;
grant execute on function public.finalize_surat(uuid,text) to authenticated;

-- 11. RPC: Pembatalan Dokumen (Transisi: draft/awaiting -> cancelled)
create or replace function public.cancel_surat(p_surat_id uuid, p_reason text default null)
returns public.surat_serah_terima
language plpgsql security definer set search_path = '' as $$
declare
  d public.surat_serah_terima;
begin
  if not public.is_asset_admin() then
    raise exception 'Akses ditolak: Hanya Admin/Head IT yang berhak membatalkan surat' using errcode = '42501';
  end if;

  select * into d from public.surat_serah_terima where id = p_surat_id for update;
  if d.id is null then
    raise exception 'Surat tidak ditemukan' using errcode = 'P0002';
  end if;

  if d.status not in ('draft', 'awaiting_recipient_signature') then
    raise exception 'Hanya surat berstatus draft atau menunggu tanda tangan yang dapat dibatalkan' using errcode = '23514';
  end if;

  update public.surat_serah_terima set
    status = 'cancelled',
    cancelled_at = now(),
    notes = case
      when p_reason is not null and btrim(p_reason) <> '' then
        coalesce(notes || E'\n[Alasan Batal]: ' || btrim(p_reason), '[Alasan Batal]: ' || btrim(p_reason))
      else notes
    end,
    updated_by = auth.uid()
  where id = d.id
  returning * into d;

  return d;
end $$;
revoke all on function public.cancel_surat(uuid,text) from public;
grant execute on function public.cancel_surat(uuid,text) to authenticated;

-- 12. Hak Akses DML Langsung (Zero Direct Mutation Policy)
-- Cabut seluruh hak mutasi DML langsung dari publik dan pengguna biasa
revoke insert, update, delete on public.surat_serah_terima from anon, authenticated;
revoke insert, update, delete on public.surat_serah_terima_items from anon, authenticated;

-- Izinkan SELECT terproteksi RLS
grant select on public.surat_serah_terima to authenticated;
grant select on public.surat_serah_terima_items to authenticated;
grant select on public.assets to authenticated;

-- Admin dapat mengelola katalog aset non-kustodi melalui DML langsung
grant insert (code, name, category, serial_number, asset_value, acquired_at, notes)
  on public.assets to authenticated;
grant update (code, name, category, serial_number, asset_value, acquired_at, notes)
  on public.assets to authenticated;

-- 13. Row Level Security Policies
alter table public.assets enable row level security;
alter table public.surat_serah_terima enable row level security;
alter table public.surat_serah_terima_items enable row level security;

-- Policy Assets
drop policy if exists assets_admin_all on public.assets;
drop policy if exists assets_admin_select on public.assets;
drop policy if exists assets_holder_read on public.assets;
drop policy if exists assets_admin_insert on public.assets;
drop policy if exists assets_admin_update on public.assets;

create policy assets_admin_select on public.assets for select to authenticated
  using (public.is_asset_admin());
create policy assets_holder_read on public.assets for select to authenticated
  using (current_holder_id = auth.uid());
create policy assets_admin_insert on public.assets for insert to authenticated
  with check (public.is_asset_admin());
create policy assets_admin_update on public.assets for update to authenticated
  using (public.is_asset_admin()) with check (public.is_asset_admin());

-- Policy Surat (Hanya SELECT, mutasi telah di-revoke ke RPC)
drop policy if exists surat_admin_all on public.surat_serah_terima;
drop policy if exists surat_participant_read on public.surat_serah_terima;
drop policy if exists surat_select_policy on public.surat_serah_terima;

create policy surat_select_policy on public.surat_serah_terima for select to authenticated
  using (
    public.is_asset_admin() or auth.uid() in (giver_id, receiver_id, hrd_id, created_by)
  );

-- Policy Surat Items (Hanya SELECT)
drop policy if exists surat_items_admin_all on public.surat_serah_terima_items;
drop policy if exists surat_items_participant_read on public.surat_serah_terima_items;
drop policy if exists surat_items_select_policy on public.surat_serah_terima_items;

create policy surat_items_select_policy on public.surat_serah_terima_items for select to authenticated
  using (public.can_read_surat(surat_id));

-- 14. Private Storage Buckets & Policies
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('surat-pdf', 'surat-pdf', false, 10485760, array['application/pdf']),
  ('surat-signatures', 'surat-signatures', false, 2097152, array['image/png', 'image/jpeg'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists surat_storage_admin_all on storage.objects;
drop policy if exists surat_storage_participant_read on storage.objects;

create policy surat_storage_admin_all on storage.objects for all to authenticated
using (bucket_id in ('surat-pdf', 'surat-signatures') and public.is_asset_admin())
with check (bucket_id in ('surat-pdf', 'surat-signatures') and public.is_asset_admin());

create policy surat_storage_participant_read on storage.objects for select to authenticated
using (
  bucket_id in ('surat-pdf', 'surat-signatures')
  and public.can_read_surat(public.safe_cast_uuid((storage.foldername(name))[1]))
);
