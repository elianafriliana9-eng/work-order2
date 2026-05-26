# Panduan Pengguna - Sistem Work Order IT

Dokumen ini ditujukan untuk pemohon (requestor) yang ingin mengajukan permintaan pekerjaan melalui sistem Work Order.

---

## Daftar Isi

1. Login dan Autentikasi
2. Dashboard
3. Membuat Tiket Baru
4. Detail Tiket
5. Meeting / Video Call
6. Revisi Pekerjaan
7. Arsip Tiket
8. Alur Kerja (Workflow)
9. Ketentuan Prioritas
10. Ketentuan Kategori
11. Tips dan Catatan Penting

---

## 1. Login dan Autentikasi

Untuk mengakses sistem, buka halaman login dan masuk menggunakan salah satu metode berikut:

- Google Sign-In: Klik tombol "Sign in with Google" untuk masuk menggunakan akun Google perusahaan. Ini adalah metode utama yang disarankan.
- Email dan Password: Masukkan email dan password yang telah didaftarkan sebelumnya.

Setelah berhasil login, Anda akan diarahkan otomatis ke halaman Dashboard.

---

## 2. Dashboard

Dashboard adalah halaman utama setelah login. Di sini Anda dapat melihat ringkasan tiket yang telah dibuat.

Informasi yang ditampilkan:

- Total Tickets: Jumlah seluruh tiket Anda yang masih aktif (belum diarsipkan).
- In Queue: Jumlah tiket yang masih dalam antrian menunggu verifikasi.
- Completed: Jumlah tiket yang telah selesai dikerjakan.
- Urgent: Jumlah tiket dengan prioritas P1 (mendesak).

Fitur pada Dashboard:

- Tabel Daftar Tiket: Menampilkan semua tiket Anda lengkap dengan judul, brand, kategori, status, dan deadline. Anda dapat mencari tiket menggunakan kolom pencarian.
- Team Live Pipeline: Menampilkan 5 tiket terbaru yang sedang dalam tahap pengerjaan (Execution) oleh tim.
- Tombol "Create Ticket": Untuk membuat tiket baru.
- Tombol "Archive": Untuk melihat tiket yang sudah selesai atau ditolak.

---

## 3. Membuat Tiket Baru

Untuk mengajukan permintaan pekerjaan, klik tombol "Create Ticket" di Dashboard atau akses halaman "/new-ticket". Proses pembuatan tiket terdiri dari 5 langkah.

### Langkah 1: Informasi Dasar

- Judul: Nama singkat yang menggambarkan permintaan Anda (minimal 5 karakter).
- Brand / Project: Nama brand atau proyek terkait.
- Kategori: Pilih salah satu dari tiga kategori berikut:
  - Creative Design: Untuk permintaan desain grafis, visual, atau konten kreatif.
  - IT / Programming: Untuk permintaan pengembangan fitur, perbaikan bug, atau pemeliharaan sistem.
  - Asset Management: Untuk pengelolaan aset digital, file, perangkat keras, atau perangkat lunak.

### Langkah 2: Detail Permintaan

Isi deskripsi lengkap mengenai permintaan Anda (minimal 20 karakter). Semakin jelas brief yang diberikan, semakin cepat dan tepat pekerjaan dapat diselesaikan.

Kolom tambahan berdasarkan kategori:

Untuk Creative Design:
- Dimensi / Ukuran: Masukkan ukuran yang dibutuhkan, misalnya "1080x1080px" untuk Instagram atau "1920x1080px" untuk presentasi.

Untuk IT / Programming:
- Tipe Pekerjaan: Pilih salah satu dari Bug Fix, New Feature, Maintenance, atau Develop New System.
- Platform: Pilih Web, Mobile, atau Database Internal.
- Kolom tambahan sesuai tipe pekerjaan:
  - Bug Fix: Modul yang bermasalah dan langkah-langkah untuk mereproduksi bug.
  - New Feature: Alur pengguna (user flow) yang diinginkan.
  - Maintenance: Modul atau sistem yang perlu dipelihara.
  - Develop New System: Alur pengguna sistem baru yang diinginkan.
- Credentials / Akses: Informasi login staging, URL, atau akses yang diperlukan tim untuk mengerjakan permintaan Anda.

### Langkah 3: Meeting Tatap Muka

Pilih metode meeting untuk mendiskusikan detail pekerjaan dengan tim:

- Online: Meeting akan dilakukan secara online melalui video call yang terintegrasi di sistem. Room meeting akan otomatis dibuat untuk tiket Anda.
- Offline: Meeting dilakukan secara langsung di ruangan IT.

Tentukan tanggal dan waktu meeting yang Anda inginkan.

### Langkah 4: Timeline dan Urgensi

- Deadline: Pilih tanggal target penyelesaian pekerjaan.
- Jika deadline kurang dari 3 hari dari hari ini, tiket akan otomatis ditandai sebagai Urgent (P1). Anda wajib mengisi alasan mengapa permintaan ini bersifat mendesak.

### Langkah 5: Lampiran dan Konfirmasi

- Upload File: Seret atau pilih file pendukung seperti gambar referensi, dokumen brief, atau file lainnya (format: gambar, PDF, Word).
- Konfirmasi SOP: Centang kotak konfirmasi bahwa Anda telah memahami prosedur yang berlaku.
- Klik tombol Submit untuk mengirimkan tiket.

Setelah tiket berhasil dibuat, statusnya akan menjadi "Open" dan menunggu verifikasi dari Head IT.

---

## 4. Detail Tiket

Klik judul tiket atau tombol "Detail" pada Dashboard untuk melihat informasi lengkap tiket.

Informasi yang ditampilkan:

- Judul, Brand, Kategori, dan Prioritas tiket.
- Status terkini dengan indikator warna.
- Deadline dan sisa waktu.
- Informasi pemohon (requester).
- Deskripsi lengkap dan kolom spesifik kategori.
- Informasi meeting (tipe, tanggal, dan tombol join jika online).
- Daftar file lampiran yang dapat diunduh.
- Riwayat revisi (jika ada).

---

## 5. Meeting / Video Call

Sistem menyediakan fitur video call terintegrasi untuk diskusi terkait tiket.

Cara bergabung meeting online:

1. Buka halaman detail tiket.
2. Tombol "Join Online Meeting" akan muncul ketika:
   - Status tiket sudah melewati tahap "Open" (sudah diverifikasi).
   - Waktu meeting sudah tiba (tombol aktif 15 menit sebelum jadwal).
3. Klik tombol tersebut untuk masuk ke ruangan video call.

Fitur dalam ruang meeting:

- Video dan audio aktif secara default.
- Indikator status koneksi (Connecting, Live, Disconnected).
- Header menampilkan judul tiket dan brand.
- Tombol "Leave" untuk keluar dari meeting.
- Koneksi terenkripsi untuk keamanan.

Jika koneksi gagal, sistem akan otomatis mencoba ulang. Jika tetap gagal, akan muncul tombol "Retry" untuk mencoba kembali secara manual.

---

## 6. Revisi Pekerjaan

Ketika tim selesai mengerjakan permintaan Anda, status tiket akan berubah menjadi "Review". Pada tahap ini, Anda memiliki kesempatan untuk meminta revisi.

### Ketentuan Revisi

- Jendela Waktu 24 Jam: Anda hanya dapat mengajukan revisi dalam waktu 24 jam setelah status berubah ke "Review". Hitungan mundur akan ditampilkan di halaman detail tiket.
- Batas Revisi: Maksimal 2 kali revisi per tiket.
- Auto-Complete: Jika dalam 24 jam tidak ada permintaan revisi, tiket akan otomatis berubah statusnya menjadi "Completed".

### Klasifikasi Revisi

- Minor: Perubahan kecil seperti warna, teks, ukuran font, atau elemen kecil lainnya. Estimasi pengerjaan 1-2 hari.
- Major: Perubahan besar seperti layout, gaya visual, atau elemen kompleks. Estimasi pengerjaan 2-4 hari.
- Perubahan Konsep: Jika revisi yang diminta mengubah konsep secara keseluruhan (misalnya dari minimalis ke vintage, atau brief yang berbeda total), maka diperlukan tiket baru. Revisi konsep tidak dapat dilakukan pada tiket yang sama.

### Cara Mengajukan Revisi

1. Buka halaman detail tiket yang berstatus "Review".
2. Isi formulir revisi yang tersedia:
   - Deskripsi revisi yang diinginkan.
   - Detail perubahan yang diminta (semakin spesifik semakin baik).
   - Upload file referensi jika diperlukan (format gambar atau PDF, maksimal 5MB per file).
   - Pilih tipe meeting (Online/Offline) untuk diskusi revisi.
   - Tentukan tanggal meeting revisi.
3. Klik Submit untuk mengirimkan permintaan revisi.

Setelah revisi dikerjakan oleh tim, status akan kembali ke "Review" dan Anda kembali memiliki jendela 24 jam untuk memeriksa hasilnya.

---

## 7. Arsip Tiket

Halaman arsip menampilkan tiket-tiket yang sudah selesai atau ditolak.

Akses halaman arsip melalui tombol "Archive" di Dashboard.

Fitur pada halaman arsip:

- Pencarian berdasarkan judul atau brand.
- Filter berdasarkan status:
  - Completed (hijau): Tiket yang telah selesai dan disetujui.
  - Rejected (merah): Tiket yang ditolak saat proses triaging.
- Informasi tiket: Judul, Brand, Deadline, dan Status.

---

## 8. Alur Kerja (Workflow)

Berikut adalah tahapan yang dilalui setiap tiket dari awal hingga selesai:

1. Open: Tiket baru dibuat dan masuk antrian. Menunggu verifikasi Head IT.
2. Triaging: Head IT sedang meninjau kelengkapan dan kejelasan brief tiket Anda.
3. Verified: Tiket telah disetujui dan siap dikerjakan oleh tim.
4. Execution: Tim sedang aktif mengerjakan permintaan Anda.
5. Review: Pekerjaan selesai dan diserahkan kepada Anda untuk ditinjau. Jendela revisi 24 jam dimulai.
6. Completed: Pekerjaan disetujui dan tiket ditutup. Masuk ke arsip.
7. Rejected: Tiket ditolak oleh Head IT (biasanya karena brief tidak lengkap atau permintaan tidak sesuai). Masuk ke arsip.

Catatan: Anda tidak perlu melakukan aksi khusus untuk menyetujui pekerjaan. Jika tidak ada revisi yang diajukan dalam 24 jam setelah status "Review", tiket akan otomatis dianggap selesai (Completed).

---

## 9. Ketentuan Prioritas

Setiap tiket memiliki tingkat prioritas yang menentukan urutan pengerjaan:

- P1 (Urgent): Deadline kurang dari 3 hari. Wajib mencantumkan alasan urgensi saat membuat tiket. Dikerjakan dengan prioritas tertinggi.
- P2 (Normal): Prioritas default untuk tiket dengan deadline lebih dari 3 hari. Dikerjakan sesuai antrian.
- P3 (Low): Prioritas rendah, untuk permintaan yang tidak mendesak.

---

## 10. Ketentuan Kategori

### Creative Design

Mencakup permintaan desain grafis, konten visual, dan materi kreatif. Contoh: desain poster, banner media sosial, presentasi visual, desain kemasan. Pastikan untuk menyertakan dimensi, referensi visual, dan brief yang jelas.

### IT / Programming

Mencakup pengembangan perangkat lunak, perbaikan bug, pemeliharaan sistem, dan pembuatan sistem baru. Contoh: perbaikan error pada website, penambahan fitur baru, maintenance database, pengembangan aplikasi internal. Pastikan untuk menyertakan langkah reproduksi (untuk bug), alur pengguna (untuk fitur baru), dan informasi akses yang diperlukan.

### Asset Management

Mencakup pengelolaan aset digital dan fisik. Contoh: pengelolaan file perusahaan, inventaris perangkat keras, lisensi perangkat lunak. Pastikan untuk menyertakan detail jenis aset dan tujuan penggunaan.

---

## 11. Tips dan Catatan Penting

- Tulis brief selengkap mungkin. Brief yang jelas akan mempercepat proses verifikasi dan mengurangi kebutuhan revisi.
- Sertakan referensi visual. Lampirkan contoh gambar, mockup, atau dokumen pendukung agar tim memahami ekspektasi Anda.
- Perhatikan deadline. Tetapkan deadline yang realistis. Permintaan mendadak (kurang dari 3 hari) akan ditandai sebagai P1 dan memerlukan justifikasi.
- Manfaatkan fitur meeting. Gunakan meeting online atau offline untuk berdiskusi langsung dengan tim, terutama untuk permintaan yang kompleks.
- Pantau status tiket secara berkala. Cek Dashboard Anda untuk mengetahui perkembangan terbaru dari tiket yang telah diajukan.
- Perhatikan jendela revisi 24 jam. Setelah status berubah ke "Review", Anda hanya punya waktu 24 jam untuk mengajukan revisi. Jika tidak ada revisi, tiket otomatis dianggap selesai.
- Revisi bukan untuk perubahan konsep. Jika Anda ingin mengubah arah konsep secara keseluruhan, buatlah tiket baru. Revisi hanya untuk penyesuaian minor atau major pada konsep yang sudah disepakati.
- Maksimal 2 revisi per tiket. Gunakan kesempatan revisi dengan bijak. Sampaikan semua perubahan yang diinginkan sekaligus dalam satu kali revisi agar lebih efisien.
- Sistem satu pintu. Seluruh permintaan pekerjaan ke tim IT harus melalui sistem Work Order ini untuk memastikan transparansi dan ketertelusuran.
