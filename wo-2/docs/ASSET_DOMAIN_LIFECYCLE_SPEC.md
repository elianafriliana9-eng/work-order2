# Dokumen Spesifikasi Arsitektur: Domain, Struktur, Lifecycle, dan Kontrak Modul Asset & BAST Online

Dokumen ini merupakan deliverable resmi untuk **ISSUE-3** (`Kunci domain, struktur, lifecycle, dan kontrak Asset`) pada sistem *IT & Creative Service Management System (One-Door Solution)*. Seluruh rancangan disusun berdasarkan SOP Digital Tech IT, evaluasi metadata schema `public.profiles` (ISSUE-18/19), implementasi UI MVP (ISSUE-5), serta kebutuhan operasional BAST QR Online.

---

## 1. Domain Boundary & Struktur Modul

### 1.1 Prinsip Pemisahan Domain (Asset vs Work Order)
Modul Asset Management **bukan** merupakan sub-tipe dari Work Order tiket, melainkan entitas *master data*, *lifecycle state*, dan *accountability registry* independen:
- **Work Orders (`work_orders`)**: Bersifat transien/siklus hidup berbasis tiket permintaan ("Tolong install software", "Laptop mati total", "Request desain"). Selesai saat pekerjaan tuntas atau 1x24 jam auto-closing.
- **Asset Management (`assets`)**: Bersifat persisten, melacak siklus fisik unit barang sejak pengadaan (*acquisition*), distribusi kepemilikan (*custody/PIC*), histori serah terima (*BAST*), perawatan rutin, hingga pelepasan/afkir (*decommission*).
- **Korelasi**: Tiket perbaikan pada Work Order IT dapat mereferensikan `asset_id`, namun perubahan status kepemilikan dan lokasi aset hanya sah jika melalui alur Berita Acara Serah Terima (BAST).

### 1.2 Struktur Layer & Kepemilikan Berkas (Module Structure)
Struktur kode modul Pengelolaan Asset terisolasi dalam direktori berikut:
```
wo-2/
├── src/
│   ├── app/
│   │   ├── admin/assets/              # View Admin & Head of IT (Master, Approval, Disposal)
│   │   ├── dashboard/asset/           # View PIC / Karyawan (Aset Saya & Draft BAST Saya)
│   │   └── assets/sign/[token]/       # Public-safe QR Signature Verification Portal
│   ├── components/assets/
│   │   ├── AssetTable.tsx             # Responsive data grid dengan sorting & pagination
│   │   ├── AssetDetailDrawer.tsx      # Spesifikasi detail, status fisik, & audit timeline
│   │   ├── AssetRegistrationModal.tsx # Form registrasi & edit aset (Zod + Hook Form)
│   │   ├── AssetHandoverModal.tsx     # Form inisiasi mutasi BAST & multi-signer setup
│   │   ├── StateSimulatorBar.tsx      # SOP 8-state simulator bar untuk verifikasi QA
│   │   ├── MetricCards.tsx            # KPI metrik (Total, Aktif, Perbaikan, Tersedia, dll)
│   │   └── FilterBar.tsx              # Multi-criteria filter & real-time search
│   ├── types/
│   │   └── asset.ts                   # Domain types, Enums, Interfaces, DTOs
│   ├── lib/
│   │   ├── asset-schemas.ts           # Zod schema validation rules & constraints
│   │   └── mock-assets.ts             # Isolated client store & initial seed fixtures
│   ├── services/                      # (Tahap ISSUE-9) Service Layer & Supabase API
│   │   ├── asset-service.ts           # CRUD, locking tag AST, filter queries
│   │   ├── handover-service.ts        # BAST lifecycle, token generator, signing flow
│   │   └── audit-service.ts           # Immutable audit logger
│   └── middleware.ts                  # Role-based access control & demo routing
```

---

## 2. Classification Registry & Aturan Kode AST

### 2.1 Asset Categories & Spesifikasi Wajib
| Kategori | Kode | Spesifikasi Wajib (Schema Payload) | Verifikasi Fisik |
| :--- | :--- | :--- | :--- |
| **Laptop** | `LPT` | Brand, Model, Serial Number, CPU, RAM (GB), Storage (GB/SSD), Charger S/N | Kondisi body, layar, keyboard, battery health |
| **Desktop / PC** | `DSK` | Brand/Custom, Serial Number, CPU, RAM, Storage, GPU, Kelengkapan Kabel | Kondisi casing, power supply, segel |
| **Monitor** | `MNT` | Brand, Model, Serial Number, Ukuran Layar (inch), Resolusi, Display Port/HDMI | Dead pixel, fleksibilitas stand |
| **Server** | `SRV` | Hostname, S/N, Rack Unit, OS, IP Management, Storage Config (RAID) | Temperatur, status PSU redundan |
| **Networking** | `NET` | Device Type (Router/Switch/AP), MAC Address, Port Capacity | Port testing, firmware version |
| **Peripheral** | `PRP` | Device Type (Printer/Scanner/UPS), Serial Number, Interface | Test print / load test baterai |
| **Mobile Device** | `MBL` | Brand, Model, IMEI 1/2, Serial Number, OS Version | Kondisi fisik, status iCloud/Google Lock |
| **Lainnya** | `OTH` | Nama Barang, Serial Number / Part Number, Deskripsi | Kondisi fisik umum |

### 2.2 Aturan Kode Tag AST (Asset Tagging Rule)
- **Format Kanonikal**: `AST-{YYYY}-{SEQ:4}` (Contoh: `AST-2026-0001`, `AST-2026-0042`).
- **Generator**: Dibangkitkan secara otomatis melalui sequence database PostgreSQL (`asset_tag_seq`) atau function atomik berstatus transactional lock.
- **Sifat Invariant**:
  - Unik secara global di seluruh sistem.
  - Bersifat **Immutable** (tidak dapat diedit setelah diterbitkan).
  - Tidak dapat digunakan ulang (*non-reusable*) meskipun aset terkait nantinya berstatus `Afkir` atau dihapus secara logis.

---

## 3. Lifecycle State Machine & Invariant

### 3.1 Status Operasional Aset (`AssetStatus`)
1. **`Tersedia` (In Stock / Pool IT)**:
   - Aset berada di gudang/ruang IT dan siap didistribusikan.
   - **Invariant**: `current_pic_id` WAJIB bernilai `NULL`.
2. **`Aktif` (In Use / Assigned)**:
   - Aset sedang dipergunakan oleh karyawan tertentu sebagai penanggung jawab.
   - **Invariant**: `current_pic_id` WAJIB terisi dan merujuk ke profil pengguna aktif. Transisi ke status ini hanya sah melalui BAST Handover berstatus `completed`.
3. **`Dalam Perbaikan` (Under Maintenance)**:
   - Aset mengalami kerusakan teknis dan sedang dalam penanganan tim IT Support atau vendor luar.
   - **Invariant**: Penanggung jawab sementara dialihkan ke IT Custody.
4. **`Afkir` (Disposed / Decommissioned)**:
   - Aset telah habis masa pakai teknis, rusak total tidak bernilai ekonomis, atau hilang.
   - **Invariant**: Terminal state. Tidak dapat dialihkan ke `Aktif` tanpa otorisasi tertulis Head of IT dan override audit. `current_pic_id` diatur ke `NULL`.

### 3.2 Diagram Transisi State Aset
```
  [ Registrasi ]
        |
        v
   [ Tersedia ] <=================== (BAST Pengembalian) <==================+
        |                                                                  |
        | (BAST Penyerahan Selesai)                                        |
        v                                                                  |
    [ Aktif ] -------------------> (Kerusakan) ----------------+           |
        |                                                      |           |
        |                                                      v           |
        |                                            [ Dalam Perbaikan ] --+
        |                                                      | (Selesai Perbaikan)
        | (Usang/Rusak Berat)                                  | (Tidak dapat diperbaiki)
        +-----------------------------> [ Afkir ] <------------+
```

### 3.3 Kondisi Fisik (`AssetCondition`)
- `Baik`: Berfungsi 100% normal tanpa cacat fisik berarti.
- `Rusak Ringan`: Terdapat cacat kosmetik atau malfungsi komponen sekunder yang tidak menghentikan fungsi utama.
- `Dalam Perbaikan`: Dalam proses reparasi hardware/software.
- `Rusak Berat`: Malfungsi fatal pada komponen utama (misal: motherboard mati, layar pecah total).

---

## 4. Kontrak Relasi PIC, Lokasi, dan Data Lifecycle

Berdasarkan temuan audit metadata `profiles` (ISSUE-18/19), relasi dengan entitas PIC dirancang tahan terhadap perubahan profil akun:

### 4.1 Strategi Integritas Referensial
- Kolom relasi: `assets.current_pic_id -> public.profiles(id)` dengan relasi `ON DELETE SET NULL`.
- Kolom pelengkap denormalisasi cepat pada tabel aset:
  - `current_pic_name`: Nama lengkap terakhir.
  - `current_pic_email`: Email pengguna.
  - `current_pic_role`: Divisi/Role karyawan.

### 4.2 Snapshot Histori Permanen (Audit Immutability)
Setiap kali terjadi serah terima (BAST Handover) atau mutasi aset:
- Data PIC lama (`from_pic`) dan PIC baru (`to_pic`) disimpan sebagai **Snapshot Objek Lengkap** (Nama, Email, NIK/ID, Divisi, Jabatan) di tabel `asset_handovers` dan `asset_audit_logs`.
- **Garansi Audit**: Jika akun karyawan dinonaktifkan, dihapus, atau di-tombstone pada tabel `auth.users` / `profiles`, dokumen histori BAST dan log serah terima **tidak berubah sama sekali** dan tetap mempertahankan pembuktian legalitas kepemilikan.
- **Fallback State**: Jika profil PIC di tabel master dihapus tanpa serah terima pengembalian, UI menampilkan tanda peringatan: `[PIC Tidak Aktif / Orphaned - Butuh Rekonsiliasi IT]`.

---

## 5. Spesifikasi BAST & Tanda Tangan Online QR Code

### 5.1 Siklus Hidup Dokumen BAST (`HandoverStatus`)
1. `draft`: Inisiasi mutasi aset oleh IT Support / Pemohon, nomor BAST dibangkitkan (`BAST/IT/{YYYY}/{MM}/{SEQ:3}`).
2. `pending_signatures`: Dokumen difinalisasi, token QR dibangkitkan untuk masing-masing pihak penanda tangan.
3. `partially_signed`: Minimal satu pihak telah menandatangani, menunggu pihak lainnya.
4. `completed`: Seluruh pihak wajib telah membubuhkan tanda tangan. Status aset otomatis berganti ke `Aktif` dan `current_pic_id` diperbarui.
5. `declined`: Salah satu pihak menolak serah terima (alasan penolakan wajib dicatat).
6. `expired`: Masa berlaku penandatanganan (default 72 jam) berakhir tanpa tanda tangan lengkap.
7. `revoked`: Dibatalkan secara sepihak oleh IT Head sebelum penandatanganan selesai.
8. `superseded`: Dokumen dibatalkan karena adanya revisi data aset, menghasilkan dokumen versi baru.

### 5.2 Peran Penanda Tangan (Signer Roles & Sequence)
1. **Pihak 1: Penyerah (IT Support / Admin)**: Memastikan barang sesuai spek dan kondisi fisik nyata.
2. **Pihak 2: Penerima (PIC Baru)**: Menyetujui penerimaan tanggung jawab pemeliharaan unit aset.
3. **Pihak 3: Mengetahui (Head of IT / Atasan Divisi)**: Otorisasi manajerial penyerahan aset perusahaan.

### 5.3 Keamanan QR Token & Threat Model Mitigations
- **Opaque Token**: QR Code hanya berisi link URL publik berisi token acak kriptografis (UUIDv4/HMAC), misalnya `https://app.domain/assets/sign/t_7f3b89a1c4...`.
- **Zero-Exposure Policy**: URL dan token QR **tidak** memuat PII pengguna, password, database ID internal, atau rahasia perusahaan.
- **Threat Model & Solusi**:
  - *QR Leakage*: Tanda tangan mengharuskan verifikasi identitas (login terautentikasi atau konfirmasi OTP/Email penerima saat membuka halaman).
  - *Replay Attack*: Token bersifat sekali pakai (*single-use*). Sekali status signer berubah menjadi `signed`, token langsung hangus/invalid.
  - *Document Tampering*: Payload dokumen (daftar aset, kondisi, tanggal, para pihak) di-hash menggunakan **SHA-256**. Nilai `document_hash` dicatat pada saat penandatanganan. Perubahan satu karakter pun pada spesifikasi membatalkan validitas signature.
  - *Re-signing & Versioning*: Jika aset ditukar atau deskripsi diubah pasca penandatanganan parsial, dokumen lama diberi status `superseded` (versi dinaikkan `v1.0` -> `v1.1`), dan seluruh tanda tangan harus diulang dari awal.

---

## 6. Matriks Hak Akses (Permission Matrix) & Aturan RLS

| Aksi / Fungsi | Head of IT (`admin` / `head_it`) | IT Support (`it_support`) | Karyawan / User (`user`) |
| :--- | :---: | :---: | :---: |
| Lihat Daftar Seluruh Aset | Ya (Semua) | Ya (Semua) | Terbatas (Hanya Aset yang Ditugaskan ke Dirinya) |
| Registrasi & Edit Aset | Ya | Ya | Tidak |
| Hapus / Afkir Aset | Ya (Otoritas Penuh) | Tidak (Butuh Persetujuan) | Tidak |
| Buat Draft BAST Serah Terima | Ya | Ya | Tidak (Bisa Ajukan Tiket) |
| Tanda Tangan BAST | Ya (Sebagai Penyerah/Atasan) | Ya (Sebagai Penyerah) | Ya (Hanya Jika Terdaftar Sebagai Penerima) |
| Batalkan / Revoke BAST | Ya | Tidak | Tidak |
| Lihat Log Audit Lengkap | Ya | Ya (Terbatas) | Tidak |

### 6.1 Desain Row Level Security (RLS)
- **Tabel `assets`**:
  - `SELECT`: Diizinkan untuk pengguna ber-role `head_it`, `it_support`, ATAU `current_pic_id = auth.uid()`.
  - `INSERT / UPDATE / DELETE`: Hanya diizinkan untuk role `head_it` dan `it_support`.
- **Tabel `asset_handovers` & `asset_handover_signers`**:
  - `SELECT`: Diizinkan untuk staff IT ATAU signer dengan `signer_email = auth.email()` / `signer_id = auth.uid()`.
  - `UPDATE (Sign)`: Diizinkan via secure public API dengan validasi token opaque atau session yang cocok.
- **Tabel `asset_audit_logs`**:
  - `SELECT`: Role `head_it` dan `it_support`.
  - `INSERT`: Hanya melalui Security Definer Database Trigger (otomatis saat ada event DML).
  - `UPDATE / DELETE`: **DITOLAK SECARA MUTLAK (DENY ALL)** demi menjamin integritas audit forensik.

---

## 7. Taksonomi Error & Status HTTP (API Contract)

| Kode Error | HTTP Status | Deskripsi | Penanganan UI |
| :--- | :---: | :--- | :--- |
| `ERR_ASSET_NOT_FOUND` | 404 | ID atau Tag Aset tidak ditemukan dalam sistem | Tampilkan empty state dengan pesan informatif |
| `ERR_TAG_ALREADY_EXISTS` | 409 | Tag AST telah digunakan oleh unit lain | Informasikan duplikasi, sarankan auto-generate tag |
| `ERR_INVALID_TRANSITION` | 422 | Perubahan status aset melanggar aturan lifecycle | Blok aksi dengan pesan rincian aturan transisi |
| `ERR_PIC_INACTIVE` | 422 | PIC yang dipilih tidak memiliki status profil aktif | Munculkan dialog validasi untuk memilih PIC lain |
| `ERR_BAST_NOT_COMPLETED` | 400 | Mencoba mengubah status aset tanpa BAST yang sah | Arahkan pengguna menyelesaikan penandatanganan BAST |
| `ERR_TOKEN_EXPIRED` | 410 | Token tanda tangan QR telah melewati batas waktu 72 jam | Tampilkan halaman peringatan & tombol minta link baru |
| `ERR_ALREADY_SIGNED` | 409 | Token tanda tangan telah digunakan sebelumnya | Tampilkan sertifikat tanda tangan yang sudah tercatat |
| `ERR_DOCUMENT_TAMPERED` | 400 | Hash dokumen tidak cocok dengan data asli | Tolak penandatanganan, beri notifikasi ke IT Security |
| `ERR_FORBIDDEN_ROLE` | 403 | Pengguna tidak memiliki izin mengeksekusi aksi ini | Tampilkan permission state (akses ditolak) |

---

## 8. Tabel Keputusan Arsitektur & Penanggung Jawab (Decision Log)

| Decision ID | Area | Keputusan Final Disetujui | Pemilik / Penanggung Jawab |
| :--- | :--- | :--- | :--- |
| **DEC-AST-01** | Domain Boundary | Modul Asset sepenuhnya mandiri dari tabel `work_orders`. Integrasi hanya berupa referensi `asset_id` opsional pada tiket perbaikan IT. | Chief of Staff & Head of IT |
| **DEC-AST-02** | Format Tag AST | Format wajib `AST-{YYYY}-{SEQ:4}` berstatus *read-only sequence* dan *immutable*. | Antigravity / Database Architect |
| **DEC-AST-03** | Mitigasi PIC Delete | Menggunakan snapshot data PIC permanen pada BAST & Audit Trail; `current_pic_id` menggunakan `ON DELETE SET NULL`. | Antigravity / Backend Engineer |
| **DEC-AST-04** | QR Token Model | Token opaque acak 256-bit dengan masa kedaluwarsa 72 jam dan validasi identitas; bebas PII internal. | Security Reviewer & Lead Engineer |
| **DEC-AST-05** | Audit Immutability | Tabel `asset_audit_logs` menerapkan RLS tanpa izin UPDATE/DELETE, diisi eksklusif via DB trigger. | Database Architect & QA (Codex) |

---

## 9. Status & Kesiapan Handoff ke Tahap Berikutnya

- **Kondisi Kode & DB**: Sesuai kriteria ISSUE-3, dokumen ini **tidak melakukan perubahan kode aplikasi atau memutasi struktur database**.
- **Kesiapan ISSUE-4**: Dengan dikuncinya spesifikasi domain, relasi, RLS, dan snapshot ini, **ISSUE-4 (`Bangun fondasi data, RLS, dan audit Asset`)** siap dipromosikan dari *backlog* ke *todo* untuk penulisan migration SQL secara forward-only.
- **Kesiapan ISSUE-9**: Kontrak API dan taksonomi error telah siap diimplementasikan pada service layer.
