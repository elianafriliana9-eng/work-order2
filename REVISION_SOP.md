# STANDAR OPERASIONAL PROSEDUR (SOP) REVISI
## Divisi IT & Kreatif - Work Order System

**Efektif:** 16 Maret 2026  
**Versi:** 1.0  
**Dokumen Terkait:** SOP Work Order System, Context.md, procedure.md

---

## 1. TUJUAN

Memastikan seluruh permintaan revisi pekerjaan (khususnya Design) terdokumentasi dengan jelas, memiliki batas waktu yang transparan, dan dapat diselesaikan dengan efisien tanpa revisi yang berulang-ulang.

---

## 2. PRINSIP UTAMA

### 2.1 Satu Tiket untuk Semua Revisi
- **WAJIB** mengajukan revisi pada tiket WO yang sama
- Dilarang membuat tiket baru untuk revisi pekerjaan yang sedang berjalan
- Riwayat revisi tercatat lengkap dalam satu tiket

### 2.2 Batas Waktu 24 Jam
- Pengajuan revisi hanya dapat dilakukan dalam **24 jam** setelah status berubah menjadi **Review**
- Setelah 24 jam, tiket otomatis dianggap **Completed** dan tidak dapat diajukan revisi
- Sistem akan menampilkan countdown waktu tersisa

### 2.3 Konsep Total = Tiket Baru
- Jika revisi mengubah konsep awal secara **TOTAL**, pemohon **WAJIB** membuat tiket WO baru
- Revisi konsep total akan masuk antrian dari awal
- Tiket lama akan ditutup dengan status **Completed** atau **Rejected**

---

## 3. KLASIFIKASI REVISI

### 3.1 Revisi Minor
Perubahan kecil yang tidak mengubah konsep dasar:
- ✅ Perubahan warna (tone, saturasi, brightness)
- ✅ Perubahan teks/copywriting
- ✅ Perubahan ukuran elemen
- ✅ Perubahan font (jenis, ukuran)
- ✅ Penambahan/hapus elemen kecil
- ✅ Koreksi typo atau kesalahan minor

**SLA Pengerjaan:** 1-2 hari kerja (tidak termasuk akhir pekan & hari libur nasional)

### 3.2 Revisi Major
Perubahan signifikan yang mempengaruhi desain:
- ⚠️ Perubahan layout/komposisi
- ⚠️ Perubahan style visual (dari minimalis ke maksimalis, dll)
- ⚠️ Penambahan elemen kompleks baru
- ⚠️ Perubahan target audience/branding
- ⚠️ Perubahan format/output media

**SLA Pengerjaan:** 2-4 hari kerja (tidak termasuk akhir pekan & hari libur nasional)

### 3.3 Perubahan Konsep Total (Wajib Tiket Baru)
Perubahan yang mengubah fundamental desain:
- ❌ Perubahan tema konsep (dari modern ke vintage, dll)
- ❌ Perubahan brief awal secara fundamental
- ❌ Perubahan tujuan komunikasi visual
- ❌ Perubahan brand identity yang diminta
- ❌ Request desain yang berbeda dari brief awal

**Proses:** Buat tiket WO baru → Masuk antrian dari awal

---

## 4. ALUR REVISI (WORKFLOW)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WORKFLOW REVISI                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Status     │────▶│  Pengajuan   │────▶│  Tanggapan   │────▶│  Status      │
│   Review     │     │   Revisi     │     │   Designer   │     │  Updated     │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │                    │
       │ 24 jam window      │ ≤24 jam            │ 1-4 hari           │ Kembali ke
       │ aktif              │ setelah Review     │ SLA                │ Review atau
       │                    │                    │                    │ Completed
       ▼                    ▼                    ▼                    ▼
```

### 4.1 Dari Sisi Pemohon (Requester)

1. **Cek Status Tiket**
   - Pastikan status tiket adalah **Review**
   - Sistem menampilkan countdown 24 jam

2. **Ajukan Revisi**
   - Klik tombol "Ajukan Revisi"
   - Pilih jenis revisi: **Minor** atau **Major**
   - Isi deskripsi revisi (min. 20 karakter)
   - Detail perubahan yang diminta (poin-poin spesifik)
   - Upload referensi visual (opsional, direkomendasikan)

3. **Klasifikasikan**
   - Centang "Ini mengubah konsep awal secara total" jika applicable
   - Isi alasan perubahan konsep (wajib jika dicentang)
   - Sistem akan warning jika ini memerlukan tiket baru

4. **Submit**
   - Review semua informasi
   - Klik "Ajukan Revisi"
   - Notifikasi otomatis ke tim design

### 4.2 Dari Sisi Designer

1. **Notifikasi Revisi**
   - Notifikasi masuk saat ada revisi baru
   - Cek detail revisi di ticket detail page

2. **Review Revisi**
   - Baca deskripsi dan perubahan yang diminta
   - Cek lampiran/referensi visual
   - Evaluasi apakah ini minor, major, atau konsep total

3. **Beri Tanggapan**
   - Klik "Beri Tanggapan" pada revisi
   - Tulis respon profesional
   - Pilih status:
     - **Tandai Selesai** (addressed) - revisi sudah dikerjakan
     - **Tolak Revisi** (rejected) - revisi tidak sesuai SOP/wajib tiket baru

4. **Kerjakan Revisi**
   - Update status tiket kembali ke **Execution**
   - Kerjakan revisi sesuai SLA
   - Submit hasil → status **Review** kembali

### 4.3 Dari Sisi Head of IT (Admin)

1. **Monitor Revisi**
   - Lihat semua revisi pending di admin dashboard
   - Pastikan revisi sesuai SOP

2. **Validasi**
   - Jika revisi adalah konsep total → wajibkan tiket baru
   - Jika revisi tidak jelas → minta klarifikasi
   - Jika revisi sudah berulang (>3x) → escalate ke pemohon

3. **Approval**
   - Beri tanggapan pada revisi
   - Approve atau reject dengan alasan jelas

---

## 5. ATURAN KHUSUS

### 5.1 Batas Jumlah Revisi
- **Normal:** Maksimal 3x revisi per tiket
- **Setelah 3x:** Head of IT akan evaluasi apakah perlu tiket baru
- **Revisi ke-4+:** Hanya untuk koreksi minor (typo, warna sedikit)

### 5.2 Revisi Berulang (Cicil)
- **DILARANG** mengajukan revisi satu per satu (dicicil)
- **WAJIB** kumpulkan semua revisi dalam satu submission
- Jika ada revisi tambahan setelah submit, buat revisi baru dengan alasan jelas

### 5.3 Revisi Setelah Deadline
- Setelah 24 jam, sistem **TIDAK MENGIZINKAN** pengajuan revisi
- Tiket otomatis berubah status menjadi **Completed**
- Jika masih ada kebutuhan revisi setelah completed → **Buat tiket WO baru**

### 5.4 Revisi untuk Programming/Asset
- SOP ini berlaku sama untuk kategori **Programming** dan **Asset**
- Untuk Programming: revisi bug fix tidak dihitung sebagai revisi
- Untuk Asset: revisi file management tidak dihitung sebagai revisi

---

## 6. DOKUMENTASI REVISI

### 6.1 Data yang Tercatat
Setiap revisi menyimpan:
- ✅ Nomor revisi (auto-increment: #1, #2, #3, ...)
- ✅ Jenis revisi (Minor/Major)
- ✅ Deskripsi lengkap
- ✅ Perubahan yang diminta
- ✅ Flag konsep total (ya/tidak)
- ✅ Alasan jika konsep total
- ✅ Timestamp pengajuan
- ✅ Lampiran/referensi
- ✅ Tanggapan designer
- ✅ Tanggapan admin
- ✅ Status (pending/addressed/rejected)

### 6.2 Akses Riwayat
Riwayat revisi dapat dilihat oleh:
- ✅ **Pemohon** - di dashboard ticket detail
- ✅ **Designer** - di team design ticket detail
- ✅ **Head of IT** - di admin ticket detail
- ✅ **Tim IT** lainnya - read-only access

---

## 7. CONTOH KASUS

### 7.1 Contoh Revisi Minor (DITERIMA)
```
Judul: Revisi Banner Promo Lebaran
Jenis: Minor
Deskripsi: Penyesuaian warna dan teks
Perubahan:
  1. Ubah warna background dari biru ke merah (#FF0000)
  2. Ganti teks "Promo Mei" menjadi "Promo Lebaran"
  3. Perbesar ukuran harga dari 24pt ke 32pt
  4. Tambahkan logo halal di pojok kanan bawah
```

### 7.2 Contoh Revisi Major (DITERIMA dengan SLA lebih lama)
```
Judul: Revisi Desain Feed Instagram
Jenis: Major
Deskripsi: Perubahan layout dan penambahan elemen
Perubahan:
  1. Ubah layout dari portrait ke square (1080x1080)
  2. Tambahkan frame border emas di sekeliling
  3. Ganti foto produk dari 1 jadi 3 foto grid
  4. Tambahkan badge "Best Seller" di pojok kiri atas
  5. Ubah posisi logo dari tengah ke pojok kanan
```

### 7.3 Contoh Perubahan Konsep Total (WAJIB TIKET BARU)
```
Judul: Revisi Logo Design
Jenis: Major ☑️ Perubahan Konsep Total
Alasan: 
  Brief awal minta logo minimalis, tapi setelah lihat referensi 
  dari kompetitor, kami ingin ubah ke style vintage/retro dengan 
  banyak detail dan ornamen. Ini berbeda total dari konsep awal.

→ SISTEM WARNING: "Revisi ini mengubah konsep total. 
   Anda perlu membuat tiket WO baru untuk antrian ulang."
```

---

## 8. SANKSI PELANGGARAN

| Pelanggaran | Konsekuensi |
|-------------|-------------|
| Membuat tiket baru untuk revisi minor | Tiket ditutup, diminta gunakan tiket lama |
| Ajukan revisi setelah 24 jam | Revisi ditolak otomatis |
| Cicil revisi (tidak dikumpulkan) | Peringatan, revisi ke-2 ditolak |
| Klaim minor tapi sebenarnya major | Re-klasifikasi oleh Head IT, SLA disesuaikan |
| Tidak jelas brief revisinya | Revisi dikembalikan untuk diperjelas |

---

## 9. METRIK & REPORTING

### 9.1 Metrik yang Dilacak
- **Rata-rata revisi per tiket** (target: <2)
- **Revisi on-time submission** (target: >90%)
- **Revisi completed dalam SLA** (target: >95%)
- **Revisi yang jadi konsep total** (target: <5%)

### 9.2 Reporting Bulanan
Head of IT menyajikan:
- Total revisi bulan ini
- Rata-rata revisi per kategori (Design/Programming/Asset)
- Top pemohon dengan revisi terbanyak
- Revisi yang memerlukan tiket baru
- Compliance rate (revisi dalam 24 jam)

---

## 10. FAQ

### Q: Apakah saya bisa mengajukan revisi jika status sudah Completed?
**A:** Tidak. Setelah Completed, Anda harus membuat tiket WO baru dengan referensi tiket lama.

### Q: Berapa kali saya bisa mengajukan revisi?
**A:** Maksimal 3x revisi per tiket. Setelah itu, evaluasi dengan Head IT.

### Q: Apa bedanya Minor dan Major?
**A:** Minor = perubahan kecil (warna, teks, ukuran). Major = perubahan layout, style, atau penambahan elemen kompleks.

### Q: Kapan saya harus buat tiket baru?
**A:** Saat revisi mengubah konsep awal secara total, atau setelah 3x revisi masih ada perubahan besar.

### Q: Apakah revisi bug untuk programming dihitung?
**A:** Bug fix tidak dihitung sebagai revisi jika itu adalah error dari implementasi.

### Q: Bagaimana jika saya tidak puas dengan hasil revisi?
**A:** Diskusikan dengan Head IT. Jika memang tidak sesuai brief, designer akan revisi ulang. Jika brief yang berubah, buat tiket baru.

---

## 11. LAMPIRAN

### 11.1 Diagram Status Revisi
```
┌────────────────────────────────────────────────────────────┐
│                    STATUS REVISI                            │
├────────────────────────────────────────────────────────────┤
│  Pending    →  Menunggu tanggapan designer                 │
│  Addressed  →  Revisi sudah dikerjakan/ditanggapi          │
│  Rejected   →  Revisi ditolak (alasan: wajib tiket baru)   │
└────────────────────────────────────────────────────────────┘
```

### 11.2 Template Pengajuan Revisi yang Baik
```
[Jenis Revisi]: Minor/Major

[Deskripsi Singkat]:
Penyesuaian warna dan layout banner promo

[Perubahan yang Diminta]:
1. Ubah warna background dari #0000FF ke #FF0000
2. Ganti font judul dari Arial ke Montserrat
3. Perbesar logo 20% dari ukuran sekarang
4. Tambahkan teks "New" di pojok kiri atas

[Referensi Visual]:
[Upload gambar contoh yang diinginkan]

[Catatan Tambahan]:
Mohon dikerjakan sebelum Jumat karena akan dipublish Sabtu pagi.
```

---

**Dokumen ini berlaku efektif sejak 16 Maret 2026.**  
**Review berkala: Setiap 6 bulan atau sesuai kebutuhan.**

**Disetujui oleh:**
- Head of IT
- Creative Lead
- Management
