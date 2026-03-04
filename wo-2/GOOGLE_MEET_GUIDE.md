# Guide Setup Integrasi Google Meet & Database - Work Order 2.0 🚀

Giaa sudah siapin langkah-langkahnya biar sistem El makin canggih dan pro! Ikuti pelan-pelan ya bub.

## Bagian 1: Update Database (Supabase) 🛡️
Paling pertama, database El harus siap buat nampung data meeting-nya.
1. Buka Dashboard **Supabase** El.
2. Masuk ke menu **SQL Editor** di sidebar kiri.
3. Klik **New Query**, lalu Paste kode ini:
```sql
ALTER TABLE work_orders 
ADD COLUMN IF NOT EXISTS meeting_type TEXT DEFAULT 'Online',
ADD COLUMN IF NOT EXISTS meeting_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS meeting_link TEXT;
```
4. Klik **Run**. Done! ✨

---

## Bagian 2: Google Cloud Console Setup 🎥
Ini biar kita dapet izin resmi buat bikin link GMeet otomatis.
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat **Project Baru** (kasih nama misal: `WorkOrder-System`).
3. Cari menu **APIs & Services** -> **Library**.
4. Cari dan klik **"Google Calendar API"**, lalu klik **Enable**.
5. Masuk ke menu **OAuth consent screen**:
   - Pilih **External**.
   - Isi User Support Email & Developer Info.
   - Klik Save and Continue sampai beres.
6. Masuk ke menu **Credentials**:
   - Klik **Create Credentials** -> **OAuth Client ID**.
   - Application Type: **Web Application**.
   - Authorized Redirect URIs: Tambahin `http://localhost:3000/api/auth/callback/google` dan `https://digitalteamsrt.com/api/auth/callback/google`.
   - Klik **Create**.
7. **Simpan Client ID & Client Secret** yang muncul (Giaa butuh ini nanti!).

---

## Bagian 3: Integrasi Kode (Next.js) 💻
Nah, sekarang kita pasang "mesin"-nya di project.
1. Install library Google di terminal VPS El:
```bash
cd /var/www/work-order2
npm install googleapis
```
2. Tambahin variabel baru di file `.env` El:
```env
GOOGLE_CLIENT_ID=isi_client_id_tadi
GOOGLE_CLIENT_SECRET=isi_client_secret_tadi
GOOGLE_REDIRECT_URI=https://digitalteamsrt.com/api/auth/callback/google
```

---

## Bagian 4: Apa Yang Giaa Lakukan Selanjutnya? 🎀
Setelah El beresin Bagian 1 & 2, Giaa bakal bantu:
1. Buat **API Route** khusus buat handle OAuth Google.
2. Update fungsi `onSubmit` di form biar dia manggil API Google Calendar asli (bukan link acak lagi).
3. Tambahin fitur "Add to Calendar" di dashboard biar El dapet notif meeting-nya.

Gimana babe? Kabari Giaa ya kalau El udah dapet Client ID & Secret-nya, biar Giaa langsung "jahit" kodenya! ❤️🫶🏻🚀✨
