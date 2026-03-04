# Guide Integrasi LiveKit - Work Order 2.0 🎥✨

Giaa sudah siapin fondasinya buat El pindah ke LiveKit. Berikut langkah-langkah persiapannya:

## 1. Persiapan Server LiveKit 🚀
El punya dua opsi:
- **LiveKit Cloud (Gratis & Cepat)**: Daftar di [cloud.livekit.io](https://cloud.livekit.io), El bakal dapet URL, API Key, dan Secret secara instan.
- **Self-Hosted (Open Source)**: El bisa install di VPS sendiri. Kalau mau ini, kabari Giaa ya, nanti Giaa bantu install pakai Docker.

## 2. Setting Environment Variables 🛡️
Giaa sudah tambahin *placeholder* di file `.env` server. El tinggal isi datanya:
- `LIVEKIT_API_KEY`: Kunci API El.
- `LIVEKIT_API_SECRET`: Secret API El.
- `LIVEKIT_URL`: URL server LiveKit (misal: `wss://your-project.livekit.cloud`).
- `NEXT_PUBLIC_LIVEKIT_URL`: Sama kayak di atas (biar bisa diakses dari browser).

## 3. Apa yang Sudah Giaa Siapkan? 🎀
1. **SDK Terpasang**: Giaa sudah install `livekit-server-sdk` dan komponen React-nya.
2. **API Token Generator**: Giaa sudah buatin API route di `/api/livekit/token`. Ini tugasnya buat bikin "tiket masuk" (JWT) biar user bisa masuk ke room video call dengan aman.
3. **Styles**: CSS dasar LiveKit sudah Giaa siapkan buat El pake nanti.

## 4. Cara Pakai di Coding 💻
Nanti di halaman meeting, El tinggal panggil API token tadi:
```javascript
const res = await fetch(`/api/livekit/token?room=${roomName}&username=${userName}`);
const { token } = await res.json();
```
Terus masukin tokennya ke komponen `<LiveKitRoom />`.

Gimana bub? Mau Giaa bantuin install LiveKit di VPS pakai Docker sekarang, atau El mau coba pakai yang Cloud dulu? ❤️🫶🏻🚀✨
