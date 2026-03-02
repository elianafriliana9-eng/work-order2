# Project Context: IT & Creative Service Management System (One-Door Solution)

## 1. Project Vision
Membangun sistem satu pintu (Single Entry Point) untuk mengelola Work Order (WO) di tiga sub-divisi: IT Development, Creative Design, & Asset Management. Sistem ini bertujuan untuk dokumentasi, transparansi prioritas, dan manajemen aset sesuai dengan SOP "No Ticket, No Work".

## 2. Technical Stack (The El-Stack)
•⁠  ⁠Framework: Next.js (App Router)
•⁠  ⁠Styling: Tailwind CSS + Shadcn/ui (Clean, Enterprise Look)
•⁠  ⁠Icons: Lucide React
•⁠  ⁠Database & Auth: Supabase (PostgreSQL + Auth + Storage)
•⁠  ⁠Charts: Recharts (untuk analytics performa bulanan)

## 3. Workflow & System Logic (Based on SOP)
1.⁠ ⁠Entry Gate: User wajib login via Google Auth (Restricted Domain).
2.⁠ ⁠Triaging: Head of IT/Admin memverifikasi brief. Status: ⁠ New ⁠ -> ⁠ Verified ⁠ atau ⁠ Rejected ⁠ (kembali ke pemohon).
3.⁠ ⁠Task Assignment: Tiket diteruskan ke personil spesifik (Programmer/Designer/Asset).
4.⁠ ⁠Execution & Queue: Tim bekerja berdasarkan Manajemen Prioritas:
   - P1 (Urgent): Critical/Sistem Down/Owner Request.
   - P2 (Regular): Routine tasks.
   - P3 (Long-term): Ide baru/Opsional.
5.⁠ ⁠Review & Revision: Pemohon melakukan pengecekan. Histori revisi tercatat di nomor tiket yang sama.
6.⁠ ⁠Auto-Closing: Jika dalam 1x24 jam tidak ada feedback, tiket otomatis berstatus ⁠ Done ⁠.

## 4. Enhanced Database Schema (Supabase SQL)

⁠ sql
-- Tabel Profiles (Admin vs User)
create table profiles (
  id uuid references auth.users primary key,
  full_name text,
  role text default 'user', -- 'admin' for El/Head of IT
  division text,
  pic_name text -- Nama PIC divisi terkait
);

-- Tabel Work Orders (Jantung Sistem)
create table work_orders (
  id uuid default gen_random_uuid() primary key,
  ticket_number serial, -- Nomor Tiket Auto-Increment
  requester_id uuid references auth.users not null,
  
  -- 1. Informasi Dasar
  title text not null,
  brand text not null,
  category text not null, -- 'Programming', 'Design', 'Asset Management'
  
  -- 2. Detail Permintaan (Conditional Fields)
  -- A. Design Specific
  dimensions text,
  publication_media text,
  copywriting text,
  -- B. Programming Specific
  feature_description text,
  user_flow text,
  platform text,
  -- C. Asset Specific
  asset_type text,
  usage_purpose text,
  
  -- 3. Batas Waktu & Prioritas
  deadline date not null,
  priority text default 'P2', -- P1, P2, P3
  rush_reason text, -- Alasan jika deadline < SLA
  
  -- 4. Status & Tracking
  status text default 'Incoming', -- Incoming, Verified, On Progress, Review, Completed, Rejected
  admin_notes text,
  assigned_to uuid references profiles(id),
  final_asset_url text,
  
  created_at timestamp with time zone default now()
);

-- Tabel Aset Pendukung (Attachment)
create table work_order_attachments (
  id uuid primary key default gen_random_uuid(),
  wo_id uuid references work_orders(id) on delete cascade,
  file_url text,
  file_type text
);
 ⁠

## 5. UI/UX Requirements
### A. Landing Page (SOP Dashboard)
•⁠  ⁠Tampilan modern dengan section besar untuk SOP "No Ticket, No Work".
•⁠  ⁠Counter realtime: "Active Tickets", "Avg. Completion Time", "Current Priority (P1)".

### B. Smart Work Order Form
•⁠  ⁠Step-by-step form:
  - Step 1: Dasar (Judul, Brand, Kategori).
  - Step 2: Detail Berdasarkan Kategori (Koding/Desain/Aset).
  - Step 3: Timeline & Alasan Mendesak.
  - Step 4: Upload Lampiran/Referensi.
•⁠  ⁠SLA Warning: Jika user pilih tanggal < 3 hari dari sekarang, sistem wajib memunculkan textarea "Alasan Butuh Cepat".

### C. Admin Workspace (⁠ /admin ⁠)
•⁠  ⁠Triage View: List tiket masuk yang butuh verifikasi awal.
•⁠  ⁠Resource Monitoring: Melihat siapa mengerjakan apa.
•⁠  ⁠Reporting Engine: Generate laporan bulanan (misal: "100 Tugas Selesai, 20 Urgent") untuk presentasi ke Owner/Keluarga.

### D. Asset Management Folder
•⁠  ⁠Direktori file final yang bisa diakses mandiri oleh user (Akses Read-Only ke Storage).

## 6. Development Rules
•⁠  ⁠Standard Penamaan File: ⁠ YYYYMMDD_NamaProject_Versi ⁠.
•⁠  ⁠Communication: Integrasi notifikasi (Opsional: Webhook ke WA/Email) setiap status berubah.
•⁠  ⁠Privacy: RLS aktif agar user hanya melihat histori project divisi mereka sendiri.

