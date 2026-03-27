Laporan Pengerjaan - 25 Maret 2026
Work Order System

---

A. Perbaikan Fitur Revisi

1. Fix: Window revisi 24 jam tidak aktif saat status berubah ke Review
   - Saat designer submit design untuk review (submit-for-review-modal), sistem sekarang otomatis mengisi review_started_at dan revision_window_expires_at (24 jam dari sekarang)
   - Saat admin mengubah status ke Review secara manual, window 24 jam juga otomatis di-set
   - File: submit-for-review-modal.tsx, admin/tickets/[id]/page.tsx

2. Fix: Limit revisi hanya dicek di frontend, tidak di backend
   - Tambah pengecekan MAX_REVISIONS (2x) di API endpoint /api/revisions
   - Jika sudah 2 revisi, API akan menolak request dengan error 400
   - File: api/revisions/route.ts

3. Fix: Auto-complete tiket setelah 24 jam tidak ada revisi
   - Saat halaman detail tiket dibuka (dashboard dan admin), sistem mengecek apakah window revisi sudah expired
   - Jika expired dan status masih Review, otomatis diubah ke Completed
   - File: dashboard/ticket/[id]/page.tsx, admin/tickets/[id]/page.tsx

---

B. Form Permintaan IT Programming

1. Tambah field khusus Programming di form pembuatan tiket (Step 2)
   - Tipe Pekerjaan: card selector dengan 4 pilihan (Bug Fix, New Feature, Maintenance, Develop New System)
   - Field di bawah tipe pekerjaan muncul dinamis sesuai tipe yang dipilih

2. Mapping field per tipe pekerjaan:
   - Bug Fix: Platform, Modul yang Terkena, Langkah Reproduksi Bug, Kredensial/Akses
   - New Feature: Platform, Alur Kerja / User Flow, Kredensial/Akses
   - Maintenance: Platform, Modul / Sistem yang Perlu Maintenance, Kredensial/Akses
   - Develop New System: Platform, Alur Kerja / User Flow Sistem Baru, Kredensial/Akses

3. Database migration baru (20260325000000_add_programming_fields.sql)
   - Kolom baru di tabel work_orders: task_type, module_affected, reproduction_steps, user_flow, credentials

4. Data Programming ditampilkan di halaman detail tiket
   - Dashboard (requester): section "Detail Permintaan IT" dengan semua field yang diisi
   - Admin: section "Detail Permintaan IT" dengan styling biru, kredensial ditampilkan terpisah dengan highlight amber

---

C. Dokumentasi

1. Pembuatan CLAUDE.md untuk referensi pengembangan oleh Claude Code
   - Berisi: commands, arsitektur, tech stack, role-based routing, workflow, deployment

---

Ringkasan Perubahan:
- 7 file diubah/ditambah
- 391 baris ditambahkan, 64 baris dihapus
- 1 migration baru perlu dijalankan di Supabase dashboard
